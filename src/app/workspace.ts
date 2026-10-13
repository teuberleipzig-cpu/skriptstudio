import { db } from '../storage/db';
import * as repo from '../storage/repositories';
import { SaveQueue, type SaveState } from '../storage/saveQueue';
import { acquireDocumentLock, ChangeChannel, type DocumentLock } from '../storage/concurrency';
import { checkedPage, defaultView, emptyNote, errorText, LIMITS, type NoteDelta, type PdfAsset, type Project, type Snapshot, type ViewState } from '../types/models';
import { parseDelta, plainText } from '../features/notes/delta';
import { snapshotToBackup } from '../features/backup/backupSchema';
import { preparePdf } from '../features/pdf/pdfService';
import type { RestorePlan } from '../features/backup/backupService';
export interface WorkspaceState {
  initialized: boolean; busy: boolean; project?: Project; asset?: PdfAsset; view: ViewState;
  readOnly: boolean; lockFallback: boolean; error?: string; notice?: string; notes: Snapshot['notes']; save: SaveState;
}
export class Workspace {
  private listeners = new Set<() => void>();
  private queue: SaveQueue;
  private lock?: DocumentLock;
  private generation = 0;
  private metaTail: Promise<void> = Promise.resolve();
  private metaPending = 0;
  private metaError?: string;
  private metaLatest = new Map<string, ViewState>();
  private metaSavedAt = 0;
  private initializePromise?: Promise<void>;
  private channel: ChangeChannel;
  private state: WorkspaceState;
  constructor() {
    this.queue = new SaveQueue(async (note, expected) => { await repo.writeNote(note, expected); this.channel.notify(note.documentId); });
    this.state = { initialized: false, busy: false, view: defaultView(), readOnly: false, lockFallback: false, notes: [], save: this.queue.state() };
    this.queue.subscribe(() => this.syncSave());
    this.channel = new ChangeChannel(id => { if (this.state.readOnly && id === this.state.project?.id) void this.refreshReader(); });
    db.on('blocked', () => this.report('Datenbank-Upgrade blockiert. Andere SkriptStudio-Tabs nach einem Backup schließen und diese Seite neu öffnen.'));
    db.on('versionchange', () => { db.close(); this.report('Eine andere App-Version benötigt den Speicher. Offene Notizen als Notfall-Backup sichern, dann alle SkriptStudio-Tabs schließen.'); });
  }
  subscribe = (fn: () => void): (() => void) => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  getSnapshot = (): WorkspaceState => this.state;
  private update(patch: Partial<WorkspaceState>): void { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()); }
  report = (error: unknown): void => { this.update({ error: typeof error === 'string' ? error : errorText(error) }); };
  dismissError = (): void => { this.update({ error: undefined }); };
  notify = (notice: string): void => { this.update({ notice }); };
  private syncSave(): void {
    const save = this.queue.state();
    save.writing += this.metaPending;
    save.dirty += this.metaError ? 1 : 0;
    if (this.metaError) save.errors.push(this.metaError);
    save.savedAt = Math.max(save.savedAt, this.metaSavedAt);
    this.update({ save, notes: this.state.project ? this.queue.notes(this.state.project.id) : [] });
  }
  initialize(): Promise<void> {
    this.initializePromise ??= (async () => {
      try { await db.open(); const id = (await db.settings.get('lastDocumentId'))?.value; if (id) await this.open(id); }
      catch (error: unknown) { this.report(error); }
      finally { this.update({ initialized: true }); }
    })();
    return this.initializePromise;
  }
  private saveView(): void {
    const id = this.state.project?.id;
    if (!id || this.state.readOnly) return;
    const snapshot = structuredClone(this.state.view);
    this.metaLatest.set(id, snapshot);
    this.metaPending++; this.syncSave();
    this.metaTail = this.metaTail.then(async () => {
      await repo.writeSession(id, snapshot);
      if (this.metaLatest.get(id) === snapshot) this.metaLatest.delete(id);
      if (!this.metaLatest.size) this.metaError = undefined;
      this.metaSavedAt = Date.now();
    }).catch((error: unknown) => { this.metaError = `Arbeitsstand: ${errorText(error)}`; }).finally(() => { this.metaPending--; this.syncSave(); });
  }
  async flush(): Promise<boolean> {
    document.dispatchEvent(new Event('skriptstudio:flush-editor'));
    const ok = await this.queue.flush(); await this.metaTail; this.syncSave();
    return ok && !this.metaError;
  }
  async retry(): Promise<void> {
    document.dispatchEvent(new Event('skriptstudio:flush-editor'));
    await this.queue.retry();
    if (this.metaError && !this.state.readOnly) this.saveView();
    await this.metaTail; this.syncSave();
  }
  private beginOperation(): void {
    if (this.state.busy) throw new Error('Ein Dokumentvorgang läuft bereits.');
    // Flush the DOM before freezing edits. The complete operation owns this freeze,
    // including the atomic recovery commit and switch to the new project.
    document.dispatchEvent(new Event('skriptstudio:flush-editor'));
    this.update({ busy: true, error: undefined });
  }
  async open(id: string): Promise<void> {
    this.beginOperation();
    try { await this.loadProject(id); } finally { this.update({ busy: false }); }
  }
  private async loadProject(id: string, recovered = false): Promise<void> {
    const generation = ++this.generation;
    let nextLock: DocumentLock | undefined;
    try {
      if (!recovered && !await this.flush()) throw new Error('Vor dem Dokumentwechsel bitte die Speicherung erneut versuchen oder eine Wiederherstellungskopie erstellen. Ein Notfall-Backup bleibt möglich.');
      if (id !== this.state.project?.id || !this.lock?.writable) nextLock = await acquireDocumentLock(id);
      else nextLock = this.lock;
      const snapshot = await repo.readProject(id);
      if (generation !== this.generation) { if (nextLock !== this.lock) nextLock.release(); return; }
      const oldId = this.state.project?.id;
      if (recovered && oldId) { this.queue.forgetRecovered(oldId); this.metaLatest.delete(oldId); this.metaError = undefined; }
      if (this.lock !== nextLock) this.lock?.release();
      this.lock = nextLock;
      for (const note of snapshot.notes) this.queue.seed(note);
      this.update({ project: snapshot.document, asset: snapshot.asset, view: snapshot.viewState, readOnly: !nextLock.writable, lockFallback: nextLock.fallback, notes: this.queue.notes(id), notice: undefined });
      if (nextLock.writable) this.saveView();
      this.syncSave();
    } catch (error: unknown) { if (nextLock && nextLock !== this.lock) nextLock.release(); throw error; }
  }
  private async refreshReader(): Promise<void> {
    const id = this.state.project?.id, generation = this.generation;
    if (!id || !this.state.readOnly || this.state.busy) return;
    try {
      const snapshot = await repo.readProject(id);
      if (generation !== this.generation || !this.state.readOnly) return;
      for (const note of snapshot.notes) this.queue.seed(note);
      this.update({ project: snapshot.document, notes: this.queue.notes(id) });
    } catch (error: unknown) { this.report(error); }
  }
  async takeWriteAccess(): Promise<void> {
    const id = this.state.project?.id; if (!id) return;
    await this.open(id);
    if (this.state.readOnly) this.notify('Das Dokument wird noch in einem anderen Tab bearbeitet. Dort zuerst speichern und das Projekt schließen.');
  }
  async importPdf(file: File): Promise<void> {
    this.beginOperation();
    try {
      if (!await this.flush()) throw new Error('Vor dem PDF-Import zuerst offene Änderungen sichern oder eine Wiederherstellungskopie erstellen.');
      const prepared = await preparePdf(file);
      const project = await repo.insertProject(prepared.asset, file.name, prepared.pageCount);
      await this.loadProject(project.id);
    } finally { this.update({ busy: false }); }
  }
  page(pageIndex: number): void {
    if (!this.state.project || this.state.busy) return;
    checkedPage(pageIndex, this.state.project.pageCount);
    document.dispatchEvent(new Event('skriptstudio:flush-editor'));
    void this.queue.flush(this.state.project.id);
    this.update({ view: { ...this.state.view, pageIndex } });
    this.saveView();
  }
  zoom(zoomMode: ViewState['zoomMode'], zoom = this.state.view.zoom): void {
    if (this.state.busy || !Number.isFinite(zoom)) return;
    this.update({ view: { ...this.state.view, zoomMode, zoom: Math.max(0.25, Math.min(4, zoom)) } }); this.saveView();
  }
  edit(documentId: string, pageIndex: number, value: NoteDelta): void {
    if (this.state.busy) throw new Error('Dokumentvorgang läuft; die Bearbeitung ist vorübergehend gesperrt.');
    if (this.state.readOnly || this.state.project?.id !== documentId || !this.lock?.writable) throw new Error('Dieses Dokument ist schreibgeschützt.');
    checkedPage(pageIndex, this.state.project.pageCount);
    const delta = parseDelta(value), current = this.queue.current(documentId, pageIndex) ?? emptyNote(documentId, pageIndex);
    const text = plainText(delta);
    const total = this.queue.notes(documentId).reduce((sum, n) => sum + (n.pageIndex === pageIndex ? 0 : n.plainText.length), text.length);
    if (total > LIMITS.totalChars) throw new Error('Maximale Gesamttextmenge dieses Projekts erreicht.');
    this.queue.enqueue({ ...current, delta, plainText: text, revision: current.revision + 1, updatedAt: Date.now() });
  }
  bookmark(): void {
    const id = this.state.project?.id, page = this.state.view.pageIndex;
    if (!id || this.state.busy || this.state.readOnly || !this.lock?.writable) return;
    const current = this.queue.current(id, page) ?? emptyNote(id, page);
    this.queue.enqueue({ ...current, isBookmarked: !current.isBookmarked, revision: current.revision + 1, updatedAt: Date.now() });
  }
  capture(): Snapshot {
    document.dispatchEvent(new Event('skriptstudio:flush-editor'));
    const { project, asset, view } = this.state;
    if (!project || !asset) throw new Error('Bitte zuerst ein PDF öffnen.');
    const notes = this.queue.notes(project.id);
    const latest = notes.reduce((time, note) => Math.max(time, note.updatedAt), project.updatedAt);
    return { document: { ...structuredClone(project), updatedAt: latest }, asset, viewState: structuredClone(view), notes };
  }
  async copyCurrent(): Promise<void> {
    this.beginOperation();
    try {
      const snapshot = this.capture();
      await this.queue.flush(); await this.metaTail;
      const project = await repo.restoreCopy(snapshotToBackup(snapshot), snapshot.asset, ' (Notizkopie)');
      await this.loadProject(project.id, true);
    } finally { this.update({ busy: false }); }
  }
  async restore(plan: RestorePlan): Promise<void> {
    if (!plan.asset) throw new Error('Bitte zuerst das identische Original-PDF auswählen.');
    this.beginOperation();
    try {
      if (!await this.flush()) throw new Error('Zuerst den offenen Arbeitsstand sichern oder eine Wiederherstellungskopie erstellen.');
      const project = await repo.restoreCopy(plan.backup, plan.asset);
      await this.loadProject(project.id);
    } finally { this.update({ busy: false }); }
  }
  async recover(id: string): Promise<void> {
    this.beginOperation();
    try {
      if (!await this.flush()) throw new Error('Zuerst den aktuellen Arbeitsspeicher über „Eigene Notizkopie“ sichern.');
      const snapshot = await repo.readProject(id);
      const entries = await db.recoveries.where('documentId').equals(id).sortBy('createdAt');
      if (!entries.length) throw new Error('Keine Konfliktsicherungen vorhanden.');
      const notes = new Map(snapshot.notes.map(n => [n.pageIndex, n]));
      entries.forEach(r => notes.set(r.pageIndex, r.local));
      snapshot.notes = [...notes.values()];
      const project = await repo.restoreCopy(snapshotToBackup(snapshot), snapshot.asset, ' (Konfliktsicherung)');
      await this.loadProject(project.id);
    } finally { this.update({ busy: false }); }
  }
  private async withWriteAccess(id: string, fn: () => Promise<void>, requireExclusive = false): Promise<void> {
    this.beginOperation();
    let temporaryLock: DocumentLock | undefined;
    try {
      const same = id === this.state.project?.id;
      if (same && (!this.lock?.writable || !await this.flush())) throw new Error('Das Projekt ist gesperrt oder hat ungespeicherte Änderungen.');
      const lock = same ? this.lock! : (temporaryLock = await acquireDocumentLock(id));
      if (!lock.writable) throw new Error('Dieses Projekt wird in einem anderen Tab bearbeitet.');
      if (requireExclusive && lock.fallback) throw new Error('Sicheres Löschen benötigt Web Locks. In diesem Browser bleibt das Projekt erhalten; verwenden Sie hierfür einen Browser mit Web-Locks-Unterstützung.');
      await fn(); this.channel.notify(id);
    } finally { temporaryLock?.release(); this.update({ busy: false }); }
  }
  async rename(id: string, name: string): Promise<void> {
    await this.withWriteAccess(id, () => repo.renameProject(id, name));
    if (id === this.state.project?.id) this.update({ project: { ...this.state.project, displayName: name.trim() } });
  }
  async remove(id: string, updatedAt: number): Promise<void> {
    await this.withWriteAccess(id, async () => {
      // A successful flush may itself advance updatedAt on the current document.
      const expected = id === this.state.project?.id ? (await db.documents.get(id))?.updatedAt ?? updatedAt : updatedAt;
      await repo.deleteProject(id, expected);
      if (id === this.state.project?.id) {
        this.queue.forget(id); this.lock?.release(); this.lock = undefined; this.generation++;
        this.update({ project: undefined, asset: undefined, notes: [], view: defaultView(), readOnly: false });
      }
    }, true);
  }
}
export const workspace = new Workspace();
