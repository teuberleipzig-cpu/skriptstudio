import { useEffect, useState } from 'react';
import { Dialog } from '../../components/Dialog';
import { listProjects, noteCounts } from '../../storage/repositories';
import { db } from '../../storage/db';
import { workspace } from '../../app/workspace';
import { useWorkspace } from '../../app/useWorkspace';
import { errorText, type Project } from '../../types/models';
export function DocumentLibrary({ onClose, onBackup }: { onClose: () => void; onBackup: () => void }) {
  const active = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]), [counts, setCounts] = useState(new Map<string, number>());
  const [recoveryIds, setRecoveryIds] = useState(new Set<string>());
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [rename, setRename] = useState(''), [name, setName] = useState(''), [remove, setRemove] = useState<Project>();
  async function refresh() { setProjects(await listProjects()); setCounts(await noteCounts()); setRecoveryIds(new Set((await db.recoveries.toArray()).map(r => r.documentId))); }
  useEffect(() => { void refresh().catch((error: unknown) => setError(errorText(error))); }, []);
  async function action(fn: () => Promise<void>) { setBusy(true); setError(''); try { await fn(); await refresh(); } catch (error: unknown) { setError(errorText(error)); } finally { setBusy(false); } }
  return <Dialog title="Deine lokale Bibliothek" onClose={onClose} busy={busy} wide>
    <p className="muted">Nur in diesem Browserprofil gespeichert. Keine Cloud und kein geräteübergreifender Abgleich.</p>
    {projects.length === 0 && <p>Noch keine Skripte gespeichert. Öffne ein PDF oder importiere ein Projektbackup.</p>}
    <div className="library-list">{projects.map(project => <article className="library-card" key={project.id}>
      <div><button className="project-link" title={project.displayName} disabled={busy} onClick={() => void action(async () => { await workspace.open(project.id); onClose(); })}>{project.displayName}</button>
        <p>{project.pageCount} Seiten · {counts.get(project.id) ?? 0} mit Notizen · {(project.fileSize / 1024 / 1024).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MiB</p>
        <small>Bearbeitet: {new Date(project.updatedAt).toLocaleString('de-DE')}{active.project?.id === project.id ? ' · Aktuell geöffnet' : ''}</small></div>
      <div className="library-actions"><button disabled={busy} onClick={() => { setRename(project.id); setName(project.displayName); }}>Umbenennen</button><button disabled={busy} onClick={() => setRemove(project)}>Löschen</button>{recoveryIds.has(project.id) && <button disabled={busy} onClick={() => void action(async () => { await workspace.recover(project.id); onClose(); })}>Konfliktsicherung öffnen</button>}</div>
      {rename === project.id && <form className="rename-form" onSubmit={e => { e.preventDefault(); void action(async () => { await workspace.rename(project.id, name); setRename(''); }); }}><input aria-label="Neuer Projektname" maxLength={500} value={name} onChange={e => setName(e.target.value)} /><button disabled={busy}>Speichern</button><button type="button" onClick={() => setRename('')}>Abbrechen</button></form>}
    </article>)}</div>
    {remove && <section className="danger-zone"><h3>„{remove.displayName}“ wirklich löschen?</h3><p>Die lokalen Notizen, Lesezeichen und Konfliktsicherungen dieses Projekts werden entfernt. Andere Notizkopien bleiben erhalten. Sichere wichtige Arbeit vorher als Backup.</p><div className="button-group"><button disabled={busy} onClick={() => setRemove(undefined)}>Abbrechen</button><button className="danger" disabled={busy} onClick={() => void action(async () => { await workspace.remove(remove.id, remove.updatedAt); setRemove(undefined); })}>Projekt endgültig löschen</button></div></section>}
    {error && <p className="error-box" role="alert">{error}</p>}
    <footer className="dialog-actions"><button disabled={busy} onClick={onBackup}>Backup importieren / exportieren</button><button disabled={busy} onClick={onClose}>Schließen</button></footer>
  </Dialog>;
}
