import { db } from './db';
import { ConflictError } from './saveQueue';
import { defaultView, emptyNote, type Note, type PdfAsset, type Project, type Session, type Snapshot, type ViewState } from '../types/models';
import { boolean, integer, parseDelta, plainText } from '../features/notes/delta';
import { parseProject, parseView, type Backup } from '../features/backup/backupSchema';
export async function listProjects(): Promise<Project[]> {
  return (await db.documents.orderBy('lastOpenedAt').reverse().toArray()).map(parseProject);
}
export async function readProject(id: string): Promise<Snapshot> {
  return db.transaction('r', db.documents, db.pdfAssets, db.notes, db.sessions, async () => {
    const raw = await db.documents.get(id);
    if (!raw) throw new Error('Dieses Projekt existiert nicht mehr.');
    const document = parseProject(raw), asset = await db.pdfAssets.get(document.pdfSha256);
    if (!asset || !(asset.blob instanceof Blob) || asset.blob.size !== document.fileSize || asset.byteLength !== document.fileSize) throw new Error('Die lokal gespeicherte PDF fehlt oder ist beschädigt. Bitte ein Projektbackup wiederherstellen.');
    const notes: Note[] = (await db.notes.where('documentId').equals(id).toArray()).map(note => {
      const delta = parseDelta(note.delta);
      return { documentId: id, pageIndex: integer(note.pageIndex, 0, document.pageCount - 1, 'Notizseite'), delta, plainText: plainText(delta), isBookmarked: boolean(note.isBookmarked, 'Lesezeichen'), revision: integer(note.revision, 0, Number.MAX_SAFE_INTEGER - 1, 'Revision'), updatedAt: integer(note.updatedAt, 0, Number.MAX_SAFE_INTEGER, 'Notizzeit') };
    });
    const session = await db.sessions.get(id);
    const viewState = session ? parseView({ pageIndex: session.pageIndex, zoom: session.zoom, zoomMode: session.zoomMode }, document.pageCount) : defaultView();
    return { document, asset, notes, viewState };
  });
}
export async function writeNote(note: Note, expectedRevision: number): Promise<void> {
  const conflict = await db.transaction('rw', db.documents, db.notes, db.recoveries, async () => {
    const document = await db.documents.get(note.documentId);
    const remote = await db.notes.get([note.documentId, note.pageIndex]);
    if (!document || (remote?.revision ?? 0) !== expectedRevision) {
      await db.recoveries.add({ documentId: note.documentId, pageIndex: note.pageIndex, local: structuredClone(note), ...(remote ? { remote } : {}), createdAt: Date.now() });
      const keys = await db.recoveries.where('documentId').equals(note.documentId).primaryKeys();
      if (keys.length > 20) await db.recoveries.bulkDelete(keys.slice(0, keys.length - 20));
      return true;
    }
    integer(note.pageIndex, 0, document.pageCount - 1, 'Notizseite');
    const delta = parseDelta(note.delta);
    integer(note.revision, expectedRevision + 1, Number.MAX_SAFE_INTEGER - 1, 'Notizrevision');
    boolean(note.isBookmarked, 'Lesezeichen');
    await db.notes.put({ ...note, delta, plainText: plainText(delta) });
    await db.documents.update(document.id, { updatedAt: Math.max(document.updatedAt + 1, note.updatedAt) });
    return false;
  });
  if (conflict) throw new ConflictError();
}
export async function writeSession(id: string, view: ViewState): Promise<void> {
  await db.transaction('rw', db.documents, db.sessions, db.settings, async () => {
    const document = await db.documents.get(id);
    if (!document) throw new Error('Der Arbeitsstand kann nicht gespeichert werden: Projekt nicht mehr vorhanden.');
    await db.sessions.put({ documentId: id, ...parseView(view, document.pageCount) });
    await db.settings.put({ key: 'lastDocumentId', value: id });
    await db.documents.update(id, { lastOpenedAt: Date.now() });
  });
}
export async function insertProject(asset: PdfAsset, originalFilename: string, pageCount: number): Promise<Project> {
  const now = Date.now();
  const project: Project = { id: crypto.randomUUID(), pdfSha256: asset.sha256, originalFilename, displayName: originalFilename.replace(/\.pdf$/i, '') || 'Skript', fileSize: asset.byteLength, pageCount, createdAt: now, updatedAt: now, lastOpenedAt: now };
  return db.transaction('rw', db.documents, db.pdfAssets, db.sessions, db.settings, async () => {
    // Recheck inside the transaction: simultaneous imports must not create accidental copies.
    const duplicate = await db.documents.where('pdfSha256').equals(asset.sha256).first();
    if (duplicate) return parseProject(duplicate);
    if (!await db.pdfAssets.get(asset.sha256)) await db.pdfAssets.add(asset);
    await db.documents.add(project);
    await db.sessions.add({ documentId: project.id, ...defaultView() });
    await db.settings.put({ key: 'lastDocumentId', value: project.id });
    return project;
  });
}
export async function restoreCopy(backup: Backup, asset: PdfAsset, suffix = ' (Wiederherstellung)'): Promise<Project> {
  if (asset.sha256 !== backup.document.pdfSha256 || asset.byteLength !== backup.document.fileSize || asset.blob.size !== backup.document.fileSize) throw new Error('PDF-Asset und Projektbackup passen nicht zusammen.');
  const now = Date.now();
  const project: Project = { ...backup.document, id: crypto.randomUUID(), displayName: (backup.document.displayName + suffix).slice(0, 500), createdAt: now, updatedAt: now, lastOpenedAt: now };
  await db.transaction('rw', db.documents, db.pdfAssets, db.notes, db.sessions, db.settings, async () => {
    if (!await db.pdfAssets.get(asset.sha256)) await db.pdfAssets.add(asset);
    await db.documents.add(project);
    await db.notes.bulkAdd(backup.notes.map(n => ({ ...emptyNote(project.id, n.pageIndex), delta: structuredClone(n.delta), plainText: plainText(n.delta), isBookmarked: n.isBookmarked, updatedAt: now, revision: 1 })));
    await db.sessions.add({ documentId: project.id, ...(backup.viewState ?? defaultView()) });
    await db.settings.put({ key: 'lastDocumentId', value: project.id });
  });
  return project;
}
export async function deleteProject(id: string, expectedUpdatedAt: number): Promise<void> {
  await db.transaction('rw', [db.documents, db.pdfAssets, db.notes, db.sessions, db.settings, db.recoveries], async () => {
    const document = await db.documents.get(id);
    if (!document) return;
    if (document.updatedAt !== expectedUpdatedAt) throw new Error('Das Projekt wurde inzwischen verändert. Bibliothek neu öffnen und den aktuellen Stand prüfen.');
    await db.notes.where('documentId').equals(id).delete();
    await db.sessions.delete(id); await db.recoveries.where('documentId').equals(id).delete();
    await db.documents.delete(id);
    if (await db.documents.where('pdfSha256').equals(document.pdfSha256).count() === 0) await db.pdfAssets.delete(document.pdfSha256);
    if ((await db.settings.get('lastDocumentId'))?.value === id) await db.settings.delete('lastDocumentId');
  });
}
export async function renameProject(id: string, name: string): Promise<void> {
  if (!name.trim() || name.length > 500) throw new Error('Bitte einen Namen mit 1 bis 500 Zeichen eingeben.');
  await db.transaction('rw', db.documents, async () => {
    const project = await db.documents.get(id);
    if (!project) throw new Error('Projekt nicht mehr vorhanden.');
    await db.documents.update(id, { displayName: name.trim(), updatedAt: Math.max(project.updatedAt + 1, Date.now()) });
  });
}
export async function noteCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const { hasContent } = await import('../features/notes/delta');
  for (const note of await db.notes.toArray()) if (hasContent(parseDelta(note.delta))) counts.set(note.documentId, (counts.get(note.documentId) ?? 0) + 1);
  return counts;
}
export type { Session };
