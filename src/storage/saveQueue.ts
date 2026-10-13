import { LIMITS, noteKey, type Note, errorText } from '../types/models';
export class ConflictError extends Error { constructor() { super('Ein anderer Tab hat diese Notiz verändert. Beide Stände bleiben erhalten. Bitte eine Wiederherstellungskopie oder ein Backup erstellen.'); this.name = 'ConflictError'; } }
export interface SaveState { dirty: number; writing: number; errors: string[]; conflicts: boolean; savedAt: number }
type Entry = { current: Note; confirmed: number; flight?: Promise<void>; error?: Error; debounce?: ReturnType<typeof setTimeout>; maxWait?: ReturnType<typeof setTimeout> };
type Writer = (snapshot: Note, expectedRevision: number) => Promise<void>;
/** Each entry owns its immutable snapshot and confirmed DB revision; no global page lookup. */
export class SaveQueue {
  private entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();
  private savedAt = 0;
  constructor(private write: Writer, private timing = { debounceMs: LIMITS.debounceMs, maxWaitMs: LIMITS.maxWaitMs }) {}
  subscribe = (fn: () => void): (() => void) => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  private emit(): void { this.listeners.forEach(fn => fn()); }
  seed(note: Note): void {
    const key = noteKey(note.documentId, note.pageIndex);
    const entry = this.entries.get(key);
    if (!entry || (entry.current.revision === entry.confirmed && note.revision >= entry.confirmed && !entry.flight && !entry.error)) {
      this.entries.set(key, { current: structuredClone(note), confirmed: note.revision });
    }
  }
  current(documentId: string, pageIndex: number): Note | undefined { const n = this.entries.get(noteKey(documentId, pageIndex))?.current; return n && structuredClone(n); }
  notes(documentId: string): Note[] { return [...this.entries.values()].filter(e => e.current.documentId === documentId).map(e => structuredClone(e.current)); }
  enqueue(note: Note): void {
    const key = noteKey(note.documentId, note.pageIndex);
    let entry = this.entries.get(key);
    if (!entry) { entry = { current: structuredClone(note), confirmed: 0 }; this.entries.set(key, entry); }
    else {
      if (note.revision <= entry.current.revision) throw new Error('Veralteter Notiz-Snapshot abgewiesen.');
      entry.current = structuredClone(note);
    }
    // A conflict freezes writes, but edits remain available in the rescue snapshot.
    if (!(entry.error instanceof ConflictError)) {
      entry.error = undefined;
      clearTimeout(entry.debounce);
      entry.debounce = setTimeout(() => { void this.drain(key); }, this.timing.debounceMs);
      entry.maxWait ??= setTimeout(() => { void this.drain(key); }, this.timing.maxWaitMs);
    }
    this.emit();
  }
  private async drain(key: string): Promise<void> {
    const e = this.entries.get(key);
    if (!e || e.error instanceof ConflictError) return;
    if (e.flight) { await e.flight; if (!e.error && e.current.revision > e.confirmed) await this.drain(key); return; }
    clearTimeout(e.debounce); clearTimeout(e.maxWait); e.debounce = undefined; e.maxWait = undefined;
    if (e.current.revision <= e.confirmed) return;
    const snapshot = structuredClone(e.current);
    const expected = e.confirmed;
    // Defer writer invocation so flight is assigned before a synchronous writer error.
    e.flight = Promise.resolve().then(() => this.write(snapshot, expected)).then(() => {
      e.confirmed = snapshot.revision; e.error = undefined; this.savedAt = Date.now();
    }).catch((error: unknown) => { e.error = error instanceof Error ? error : new Error(errorText(error)); }).finally(() => { e.flight = undefined; this.emit(); });
    this.emit();
    await e.flight;
    if (!e.error && e.current.revision > e.confirmed) await this.drain(key);
  }
  async flush(documentId?: string): Promise<boolean> {
    const entries = [...this.entries].filter(([, e]) => !documentId || e.current.documentId === documentId);
    await Promise.all(entries.map(([key]) => this.drain(key)));
    return entries.every(([, e]) => !e.error && !e.flight && e.current.revision <= e.confirmed);
  }
  async retry(): Promise<boolean> {
    for (const e of this.entries.values()) if (!(e.error instanceof ConflictError)) e.error = undefined;
    return this.flush();
  }
  state(): SaveState {
    const all = [...this.entries.values()];
    return { dirty: all.filter(e => e.current.revision > e.confirmed).length, writing: all.filter(e => e.flight).length, errors: [...new Set(all.flatMap(e => e.error ? [e.error.message] : []))], conflicts: all.some(e => e.error instanceof ConflictError), savedAt: this.savedAt };
  }
  forget(documentId: string): void {
    const owned = [...this.entries].filter(([, e]) => e.current.documentId === documentId);
    if (owned.some(([, e]) => e.flight || e.current.revision > e.confirmed)) throw new Error('Ungespeicherte Notizen dürfen nicht entfernt werden.');
    for (const [key, e] of owned) {
      clearTimeout(e.debounce); clearTimeout(e.maxWait); this.entries.delete(key);
    }
    this.emit();
  }
  forgetRecovered(documentId: string): void {
    // Call only after an atomic recovery-copy commit containing ALL in-memory notes.
    const owned = [...this.entries].filter(([, e]) => e.current.documentId === documentId);
    if (owned.some(([, e]) => e.flight)) throw new Error('Speicherung noch aktiv.');
    for (const [key, e] of owned) {
      clearTimeout(e.debounce); clearTimeout(e.maxWait); this.entries.delete(key);
    }
    this.emit();
  }
  dispose(): void { for (const e of this.entries.values()) { clearTimeout(e.debounce); clearTimeout(e.maxWait); } this.listeners.clear(); }
}
