import { useState } from 'react';
import { Dialog } from '../../components/Dialog';
import { workspace } from '../../app/workspace';
import { useWorkspace } from '../../app/useWorkspace';
import { exportBackup, inspectBackup, validateOriginal, type RestorePlan } from './backupService';
import { download, safeFilename } from '../../utils/binary';
import { errorText } from '../../types/models';
import { hasContent } from '../notes/delta';
export function BackupDialog({ onClose }: { onClose: () => void }) {
  const state = useWorkspace(); const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [plan, setPlan] = useState<RestorePlan>();
  async function attempt(action: () => Promise<void>) { if (busy) return; setBusy(true); setMessage(''); try { await action(); } catch (error: unknown) { setMessage(errorText(error)); } finally { setBusy(false); } }
  async function save(full: boolean) {
    const snapshot = workspace.capture(); await workspace.flush();
    const blob = await exportBackup(snapshot, full);
    download(blob, safeFilename(snapshot.document.displayName, full ? 'Projektbackup' : 'Notizenbackup') + '.json');
    setMessage('Backup erstellt. Die Datei bewusst aufbewahren: Sie wird später nicht automatisch aktualisiert.');
  }
  return <Dialog title="Backups & Gerätewechsel" onClose={onClose} busy={busy}>
    <p>PC und Mac haben getrennte Browserdaten. Exportiere den Stand hier und importiere das Backup auf dem anderen Gerät.</p>
    {state.project && <div className="backup-options"><button disabled={busy} onClick={() => void attempt(() => save(true))}><strong>Vollständiges Projektbackup</strong><span>PDF, Formatierungen und Lesezeichen · auch als Notfall-Backup</span></button><button disabled={busy} onClick={() => void attempt(() => save(false))}><strong>Nur Notizen sichern</strong><span>Kleinere JSON-Datei · benötigt das identische Original-PDF</span></button></div>}
    <p className="muted">Vollbackups brauchen durch Base64 mehr Platz und Arbeitsspeicher. Sie enthalten deine vollständigen, unverschlüsselten Dokumentdaten.</p>
    <h3>Backup wiederherstellen</h3><label className="file-label">JSON-Datei auswählen<input aria-label="Backup-Datei" type="file" accept=".json,application/json" disabled={busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) { setPlan(undefined); void attempt(async () => setPlan(await inspectBackup(file))); } }} /></label>
    {plan && <section className="import-preview"><h3>{plan.backup.document.displayName}</h3><p>{plan.backup.document.pageCount} Originalseiten · {plan.backup.notes.filter(n => hasContent(n.delta)).length} Seiten mit Notizen<br />Gesichert: {new Date(plan.backup.exportedAt).toLocaleString('de-DE')}<br />{plan.backup.includesPdf ? 'Vollständiges Projektbackup' : 'Notizen-Backup'}</p>
      {plan.matchingProjects > 0 && <p>Bereits vorhandene Arbeitsstände: {plan.matchingProjects}. Sie bleiben unverändert.</p>}
      {!plan.asset && <label className="file-label">Identisches Original-PDF auswählen<input type="file" accept=".pdf,application/pdf" aria-label="Original-PDF für Backup" disabled={busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void attempt(async () => setPlan({ ...plan, asset: await validateOriginal(plan.backup, file) })); }} /></label>}
      <p>Der Import erzeugt eine <strong>neue Wiederherstellungskopie</strong>. Kein existierendes Projekt wird überschrieben.</p>
      <button className="primary" disabled={busy || !plan.asset} onClick={() => void attempt(async () => { await workspace.restore(plan); onClose(); })}>Als neue Projektkopie importieren</button></section>}
    {message && <p className="notice-box" role="status">{message}</p>}
    <footer className="dialog-actions"><button disabled={busy} onClick={onClose}>Schließen</button></footer>
  </Dialog>;
}
