import { useEffect, useRef, useState } from 'react';
import { Dialog } from '../../components/Dialog';
import { workspace } from '../../app/workspace';
import { download, safeFilename } from '../../utils/binary';
import { errorText } from '../../types/models';
import { startExport, type ExportJob, type ExportProgress } from './exportService';
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const [omit, setOmit] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [progress, setProgress] = useState<ExportProgress>(); const job = useRef<ExportJob | undefined>(undefined); const cancelled = useRef(false);
  useEffect(() => () => { cancelled.current = true; job.current?.cancel(); }, []);
  async function run() {
    if (busy) return; cancelled.current = false; setBusy(true); setError(''); setProgress(undefined);
    try {
      const snapshot = workspace.capture();
      const saved = await workspace.flush();
      if (cancelled.current) throw new DOMException('Export vor der PDF-Erstellung abgebrochen. Es wurde keine Datei erzeugt.', 'AbortError');
      if (!saved) workspace.notify('Der PDF-Export verwendet den festgehaltenen Arbeitsspeicher-Stand. Die Browserspeicherung ist weiterhin fehlgeschlagen. Zusätzlich ein Projektbackup sichern.');
      job.current = startExport(snapshot, omit, setProgress);
      const bytes = await job.current.promise;
      download(new Blob([bytes], { type: 'application/pdf' }), safeFilename(snapshot.document.displayName, 'mit_Notizen') + '.pdf');
      job.current = undefined;
    } catch (error: unknown) { setError(errorText(error)); }
    finally { job.current = undefined; setBusy(false); }
  }
  return <Dialog title="Originalseiten mit Notizen" onClose={onClose} busy={busy}>
    <p>Nach jeder Originalfolie folgen ihre Notizseiten im A4-Hochformat. Lange Notizen werden umgebrochen. Originalformat und Reihenfolge der Folien bleiben erhalten.</p>
    <label className="check"><input type="checkbox" checked={omit} onChange={e => setOmit(e.target.checked)} disabled={busy} /> Leere Notizseiten auslassen</label>
    <p className="muted">Das neue PDF enthält auswählbaren Notiztext, ist aber kein bearbeitbares Projektbackup. Digitale Signaturen und alle Formularfunktionen werden nicht garantiert.</p>
    {progress && <div className="progress"><progress max={progress.total} value={progress.completed} /><span>{progress.completed} von {progress.total} Originalseiten verarbeitet · {progress.outputPages} Ausgabeseiten</span></div>}
    {error && <p className="error-box" role="alert">{error}</p>}
    <footer className="dialog-actions">{busy ? <button onClick={() => { cancelled.current = true; job.current?.cancel(); setError('Abbruch angefordert. Ein noch laufender Speichervorgang wird nicht gewaltsam unterbrochen.'); }}>Export abbrechen</button> : <><button onClick={onClose}>Schließen</button><button className="primary" onClick={() => void run()}>PDF erstellen</button></>}</footer>
  </Dialog>;
}
