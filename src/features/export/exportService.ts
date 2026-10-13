import type { Snapshot } from '../../types/models';
export interface ExportProgress { completed: number; total: number; outputPages: number }
export interface ExportJob { promise: Promise<Uint8Array<ArrayBuffer>>; cancel: () => void }
export interface ExportRequest { original: ArrayBuffer; document: Snapshot['document']; notes: Snapshot['notes']; omitEmpty: boolean }
export type ExportResponse = { type: 'progress'; progress: ExportProgress } | { type: 'done'; bytes: ArrayBuffer } | { type: 'error'; message: string };
export function startExport(snapshot: Snapshot, omitEmpty: boolean, onProgress: (progress: ExportProgress) => void): ExportJob {
  let worker: Worker | undefined, cancelled = false;
  let rejectJob: (reason: Error) => void = () => undefined;
  const promise = new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    rejectJob = reject;
    void snapshot.asset.blob.arrayBuffer().then(original => {
      if (cancelled) return;
      worker = new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<ExportResponse>) => {
        const data = event.data;
        if (data.type === 'progress') onProgress(data.progress);
        else if (data.type === 'done') { worker?.terminate(); resolve(new Uint8Array(data.bytes)); }
        else { worker?.terminate(); reject(new Error(data.message)); }
      };
      worker.onerror = () => { worker?.terminate(); reject(new Error('PDF-Export fehlgeschlagen. Die Originaldatei und Notizen wurden nicht verändert. Bitte das Projektbackup sichern.')); };
      const request: ExportRequest = { original, document: snapshot.document, notes: snapshot.notes, omitEmpty };
      worker.postMessage(request, [original]);
    }).catch((error: unknown) => reject(error));
  });
  return { promise, cancel: () => { cancelled = true; worker?.terminate(); rejectJob(new DOMException('Export abgebrochen. Es wird keine Teildatei heruntergeladen.', 'AbortError')); } };
}
