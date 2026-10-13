import { APP_VERSION, LIMITS, type Note, type Project, type Snapshot, type ViewState } from '../../types/models';
import { boolean, integer, parseDelta, plainText, record, string } from '../notes/delta';
export const BACKUP_FORMAT = 'skriptstudio-project';
export const BACKUP_VERSION = 1;
export type BackupNote = Omit<Note, 'documentId' | 'plainText'>;
export interface Backup {
  format: typeof BACKUP_FORMAT; schemaVersion: 1; appVersion: string; exportedAt: string;
  includesPdf: boolean; document: Project; notes: BackupNote[]; viewState?: ViewState; pdfBase64?: string;
}
export function parseProject(value: unknown): Project {
  const d = record(value, ['id', 'pdfSha256', 'originalFilename', 'displayName', 'fileSize', 'pageCount', 'createdAt', 'updatedAt', 'lastOpenedAt'], 'Dokument');
  const hash = string(d.pdfSha256, 64, 'PDF-Hash');
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Ungültiger PDF-Hash.');
  return {
    id: string(d.id, 128, 'Dokument-ID'), pdfSha256: hash,
    originalFilename: string(d.originalFilename, 500, 'Originalname'), displayName: string(d.displayName, 500, 'Anzeigename'),
    fileSize: integer(d.fileSize, 1, LIMITS.pdfBytes, 'PDF-Größe'), pageCount: integer(d.pageCount, 1, LIMITS.pages, 'Seitenanzahl'),
    createdAt: integer(d.createdAt, 0, Number.MAX_SAFE_INTEGER, 'Erstellungszeit'),
    updatedAt: integer(d.updatedAt, 0, Number.MAX_SAFE_INTEGER, 'Bearbeitungszeit'),
    lastOpenedAt: integer(d.lastOpenedAt, 0, Number.MAX_SAFE_INTEGER, 'Öffnungszeit'),
  };
}
export function parseView(value: unknown, count: number): ViewState {
  const v = record(value, ['pageIndex', 'zoomMode', 'zoom'], 'Arbeitsstand');
  if (v.zoomMode !== 'fit' && v.zoomMode !== 'manual') throw new Error('Ungültiger Zoommodus.');
  if (typeof v.zoom !== 'number' || !Number.isFinite(v.zoom) || v.zoom < 0.25 || v.zoom > 4) throw new Error('Ungültiger Zoomwert.');
  return { pageIndex: integer(v.pageIndex, 0, count - 1, 'Seite'), zoomMode: v.zoomMode, zoom: v.zoom };
}
export function parseBackup(value: unknown): Backup {
  const b = record(value, ['format', 'schemaVersion', 'appVersion', 'exportedAt', 'includesPdf', 'document', 'notes', 'viewState', 'pdfBase64'], 'Backup');
  if (b.format !== BACKUP_FORMAT) throw new Error('Keine SkriptStudio-Projektdatei.');
  if (b.schemaVersion !== BACKUP_VERSION) throw new Error('Diese Backup-Version wird nicht unterstützt. Es wurden keine Daten geändert.');
  const document = parseProject(b.document);
  const includesPdf = boolean(b.includesPdf, 'PDF enthalten');
  if (!Array.isArray(b.notes) || b.notes.length > document.pageCount) throw new Error('Ungültige Anzahl von Notizen.');
  let chars = 0;
  const pages = new Set<number>();
  const notes: BackupNote[] = b.notes.map((raw: unknown) => {
    const n = record(raw, ['pageIndex', 'delta', 'isBookmarked', 'revision', 'updatedAt'], 'Notizeintrag');
    const pageIndex = integer(n.pageIndex, 0, document.pageCount - 1, 'Notizseite');
    if (pages.has(pageIndex)) throw new Error('Das Backup enthält doppelte Seiteneinträge.');
    pages.add(pageIndex);
    const delta = parseDelta(n.delta);
    chars += plainText(delta).length;
    if (chars > LIMITS.totalChars) throw new Error('Die Gesamttextmenge überschreitet das erlaubte Limit.');
    return { pageIndex, delta, isBookmarked: boolean(n.isBookmarked, 'Lesezeichen'), revision: integer(n.revision, 0, Number.MAX_SAFE_INTEGER - 1, 'Revision'), updatedAt: integer(n.updatedAt, 0, Number.MAX_SAFE_INTEGER, 'Notizzeit') };
  });
  const exportedAt = string(b.exportedAt, 40, 'Sicherungszeit');
  if (!/^\d{4}-\d\d-\d\dT/u.test(exportedAt) || !Number.isFinite(Date.parse(exportedAt))) throw new Error('Ungültiger Sicherungszeitpunkt.');
  const result: Backup = { format: BACKUP_FORMAT, schemaVersion: BACKUP_VERSION, appVersion: string(b.appVersion, 60, 'App-Version'), exportedAt, includesPdf, document, notes };
  if (b.viewState !== undefined) result.viewState = parseView(b.viewState, document.pageCount);
  if (includesPdf) {
    const base64 = string(b.pdfBase64, Math.ceil(LIMITS.pdfBytes / 3) * 4, 'PDF-Daten');
    if (base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new Error('Die PDF-Daten sind kein gültiges Base64.');
    const decodedSize = base64.length / 4 * 3 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    if (decodedSize !== document.fileSize || decodedSize > LIMITS.pdfBytes) throw new Error('Die eingebettete PDF-Größe stimmt nicht.');
    result.pdfBase64 = base64;
  } else if (b.pdfBase64 !== undefined) throw new Error('Ein Notizen-Backup darf keine versteckten PDF-Daten enthalten.');
  return result;
}
export function parseBackupJson(text: string): Backup {
  if (text.length > LIMITS.backupBytes) throw new Error('Backup zu groß.');
  let raw: unknown;
  try { raw = JSON.parse(text, (key: string, value: unknown) => { if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Unsicherer Objektschlüssel.'); return value; }); }
  catch { throw new Error('Ungültige oder unsichere JSON-Datei. Bestehende Daten bleiben unverändert.'); }
  return parseBackup(raw);
}
export function snapshotToBackup(snapshot: Snapshot): Backup {
  return parseBackup({ format: BACKUP_FORMAT, schemaVersion: BACKUP_VERSION, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), includesPdf: false,
    document: structuredClone(snapshot.document),
    notes: snapshot.notes.map(({ pageIndex, delta, isBookmarked, revision, updatedAt }) => ({ pageIndex, delta: structuredClone(delta), isBookmarked, revision, updatedAt })),
    viewState: structuredClone(snapshot.viewState) });
}
