export const APP_VERSION = '0.1.0-review';
export const LIMITS = Object.freeze({
  pdfBytes: 150 * 1024 * 1024,
  backupBytes: 280 * 1024 * 1024,
  pages: 5000,
  noteChars: 500_000,
  totalChars: 10_000_000,
  deltaOps: 50_000,
  indent: 4,
  debounceMs: 350,
  maxWaitMs: 1500,
  canvasPixels: 12_000_000,
});
export interface Attributes {
  bold?: true; italic?: true; underline?: true; strike?: true;
  header?: 1 | 2 | 3; list?: 'ordered' | 'bullet'; indent?: number;
  align?: 'center' | 'right' | 'justify'; color?: string; background?: string;
}
export interface DeltaOp { insert: string; attributes?: Attributes }
export interface NoteDelta { ops: DeltaOp[] }
export interface Project {
  id: string; pdfSha256: string; originalFilename: string; displayName: string;
  fileSize: number; pageCount: number; createdAt: number; updatedAt: number; lastOpenedAt: number;
}
export interface PdfAsset { sha256: string; blob: Blob; byteLength: number; createdAt: number }
export interface Note {
  documentId: string; pageIndex: number; delta: NoteDelta; plainText: string;
  isBookmarked: boolean; updatedAt: number; revision: number;
}
export interface ViewState { pageIndex: number; zoomMode: 'fit' | 'manual'; zoom: number }
export interface Session extends ViewState { documentId: string }
export interface Recovery { id?: number; documentId: string; pageIndex: number; local: Note; remote?: Note; createdAt: number }
export interface Snapshot { document: Project; notes: Note[]; viewState: ViewState; asset: PdfAsset }
export function noteKey(documentId: string, pageIndex: number): string { return `${documentId}:${pageIndex}`; }
export function emptyDelta(): NoteDelta { return { ops: [{ insert: '\n' }] }; }
export function emptyNote(documentId: string, pageIndex: number): Note {
  return { documentId, pageIndex, delta: emptyDelta(), plainText: '\n', isBookmarked: false, updatedAt: 0, revision: 0 };
}
export const defaultView = (): ViewState => ({ pageIndex: 0, zoomMode: 'fit', zoom: 1 });
export function checkedPage(page: number, count: number): number {
  if (!Number.isInteger(page) || page < 0 || page >= count) throw new Error(`Bitte eine Seite zwischen 1 und ${count} wählen.`);
  return page;
}
export function errorText(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'QuotaExceededError') return 'Browserspeicher voll. Der aktuelle Text bleibt im Arbeitsspeicher. Jetzt ein Notfall-Backup herunterladen.';
    return error.message;
  }
  return 'Unbekannter Fehler. Bitte den Arbeitsstand als Backup sichern.';
}
