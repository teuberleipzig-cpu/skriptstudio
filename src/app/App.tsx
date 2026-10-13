import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from './useWorkspace';
import { workspace } from './workspace';
import { emptyDelta } from '../types/models';
import { SaveStatus } from '../components/SaveStatus';
import { SplitPane } from '../components/SplitPane';
import { HelpDialog } from '../components/HelpDialog';
import { PdfViewer } from '../features/pdf/PdfViewer';
import { PdfControls } from '../features/pdf/PdfControls';
import { PageNavigator } from '../features/pdf/PageNavigator';
import { NoteEditor } from '../features/notes/NoteEditor';
import { DocumentLibrary } from '../features/library/DocumentLibrary';
import { BackupDialog } from '../features/backup/BackupDialog';
import { ExportDialog } from '../features/export/ExportDialog';
import { watchPwa, type PwaState } from '../pwa/updateManager';
type OpenDialog = 'library' | 'backup' | 'export' | 'help' | undefined;
export function App() {
  const state = useWorkspace(), input = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<OpenDialog>(), [mobile, setMobile] = useState<'pdf' | 'notes'>('pdf'), [navigation, setNavigation] = useState(false);
  const [pwa, setPwa] = useState<PwaState>({ state: 'online-only', updateAvailable: false, message: 'Online-Betrieb' });
  const [offline, setOffline] = useState(!navigator.onLine);
  const run = (action: () => Promise<void>) => { void action().catch(workspace.report); };
  useEffect(() => {
    void workspace.initialize();
    const stopPwa = watchPwa(setPwa);
    const hidden = () => { if (document.visibilityState === 'hidden') void workspace.flush(); };
    const pageHide = () => { void workspace.flush(); };
    const beforeUnload = (event: BeforeUnloadEvent) => { const s = workspace.getSnapshot().save; if (s.dirty || s.writing || s.errors.length) { event.preventDefault(); event.returnValue = ''; } };
    const net = () => setOffline(!navigator.onLine);
    const keys = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void workspace.retry(); return; }
      if (event.isComposing || document.querySelector('dialog[open]')) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('input,textarea,select,[contenteditable="true"],[role="separator"]')) return;
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        const s = workspace.getSnapshot(); if (!s.project) return;
        event.preventDefault(); const next = s.view.pageIndex + (event.key === 'ArrowRight' ? 1 : -1);
        if (next >= 0 && next < s.project.pageCount) workspace.page(next);
      }
    };
    document.addEventListener('visibilitychange', hidden); document.addEventListener('keydown', keys);
    window.addEventListener('pagehide', pageHide); window.addEventListener('beforeunload', beforeUnload); window.addEventListener('online', net); window.addEventListener('offline', net);
    return () => { stopPwa(); document.removeEventListener('visibilitychange', hidden); document.removeEventListener('keydown', keys); window.removeEventListener('pagehide', pageHide); window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('online', net); window.removeEventListener('offline', net); };
  }, []);
  const current = state.notes.find(note => note.pageIndex === state.view.pageIndex);
  return <div className="app" onDragOver={e => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); }} onDrop={e => { if (!e.dataTransfer.files.length) return; e.preventDefault(); if (e.dataTransfer.files.length !== 1) { workspace.report('Bitte genau ein PDF gleichzeitig öffnen.'); return; } const file = e.dataTransfer.files[0]; if (file) run(() => workspace.importPdf(file)); }}>
    <header className="app-header"><a className="brand" href={import.meta.env.BASE_URL} onClick={e => { e.preventDefault(); setDialog('library'); }} aria-label="SkriptStudio – Bibliothek öffnen"><span className="brand-mark">S</span><span>SkriptStudio<small>DEIN LOKALER LERNRAUM</small></span></a>
      <div className="header-actions"><button onClick={() => setDialog('library')}>Bibliothek</button><button className="primary" disabled={state.busy || !state.initialized} onClick={() => input.current?.click()}>＋ PDF öffnen</button></div>
      <div className="document-meta"><strong title={state.project?.originalFilename ?? 'Noch kein Dokument'}>{state.project?.displayName ?? 'Noch kein Skript geöffnet'}</strong><SaveStatus state={state.save} loading={!state.initialized || state.busy} readOnly={state.readOnly} /></div>
      <div className="header-actions export-actions"><button onClick={() => setDialog('backup')}>Backup</button><button disabled={!state.project} onClick={() => setDialog('export')}>PDF exportieren</button><button aria-label="Hilfe und Datenschutz" onClick={() => setDialog('help')}>?</button></div>
      <input ref={input} className="sr-only" aria-label="PDF-Datei" type="file" accept=".pdf,application/pdf" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) run(() => workspace.importPdf(file)); }} />
    </header>
    {(state.error || state.save.errors.length > 0) && <div className="app-alert" role="alert"><div><strong>{state.save.errors.length ? 'Speichern fehlgeschlagen' : 'Hinweis'}</strong><p>{state.error ?? state.save.errors.join(' ')}</p></div><div className="button-group">{state.save.errors.length > 0 && <button onClick={() => run(() => workspace.retry())}>Erneut versuchen</button>}{state.project && <button onClick={() => setDialog('backup')}>Notfall-Backup herunterladen</button>}{state.project && state.save.conflicts && <button onClick={() => run(() => workspace.copyCurrent())}>Eigenen Stand als Kopie sichern</button>}{!state.save.errors.length && <button onClick={workspace.dismissError} aria-label="Hinweis schließen">×</button>}</div></div>}
    {state.notice && <div className="notice-bar" role="status">{state.notice}</div>}
    {state.readOnly && <div className="notice-bar"><span>Schreibgeschützt: Dieses Dokument wird in einem anderen Tab bearbeitet. Lesen und Exportieren bleiben möglich.</span><button onClick={() => run(() => workspace.takeWriteAccess())}>Bearbeitung übernehmen</button></div>}
    {state.lockFallback && <div className="notice-bar">Web Locks sind nicht verfügbar. Transaktionale Revisionsprüfungen verhindern stilles Überschreiben; Konflikte benötigen eine eigene Wiederherstellungskopie.</div>}
    {state.project && state.asset ? <>
      <div className="workspace-strip"><div className="button-group"><button aria-expanded={navigation} onClick={() => setNavigation(!navigation)}>☷ Seiten & Suche</button><span>{state.project.pageCount} Originalseiten</span></div><div className="mobile-tabs" role="group" aria-label="Arbeitsbereich wechseln"><button aria-pressed={mobile === 'pdf'} onClick={() => setMobile('pdf')}>PDF</button><button aria-pressed={mobile === 'notes'} onClick={() => setMobile('notes')}>Notizen</button></div><button disabled={state.busy} onClick={() => run(() => workspace.copyCurrent())}>Unabhängige Notizkopie</button></div>
      {navigation && <PageNavigator count={state.project.pageCount} page={state.view.pageIndex} notes={state.notes} onPage={page => { try { workspace.page(page); } catch (error: unknown) { workspace.report(error); } }} />}
      <SplitPane mobile={mobile} left={<><div className="pane-heading"><span className="eyebrow">ORIGINAL</span><h2>Seite {state.view.pageIndex + 1}</h2></div><PdfControls view={state.view} count={state.project.pageCount} busy={state.busy} onPage={page => workspace.page(page)} onZoom={(mode, zoom) => workspace.zoom(mode, zoom)} onError={workspace.report} /><PdfViewer asset={state.asset} view={state.view} onError={workspace.report} /></>} right={<><div className="pane-heading"><div><span className="eyebrow">DEINE NOTIZEN</span><h2>Notizen zu Seite {state.view.pageIndex + 1}</h2></div><button title="Lesezeichen für diese Seite" aria-label="Lesezeichen setzen oder entfernen" aria-pressed={current?.isBookmarked ?? false} disabled={state.readOnly || state.busy} onClick={() => workspace.bookmark()}>{current?.isBookmarked ? '★ Markiert' : '☆ Merken'}</button></div><NoteEditor key={`${state.project.id}:${state.view.pageIndex}:${state.readOnly ? current?.revision ?? 0 : 'edit'}`} initial={current?.delta ?? emptyDelta()} pageIndex={state.view.pageIndex} disabled={state.readOnly || state.busy} onChange={delta => workspace.edit(state.project!.id, state.view.pageIndex, delta)} onError={workspace.report} onNotice={workspace.notify} /></>} />
    </> : <main className="empty-workspace"><div className="empty-card"><div className="paper-symbol" aria-hidden="true">▤</div><span className="eyebrow">FOLIEN VERSTEHEN. GEDANKEN FESTHALTEN.</span><h1>Ein Platz für dein Skript<br />und deine eigenen Notizen.</h1><p>Öffne ein Vorlesungs-PDF. Links die Originalfolie, rechts dein Schreibblatt – fest mit jeder Seite verbunden.</p><button className="primary large" disabled={state.busy || !state.initialized} onClick={() => input.current?.click()}>{state.busy ? 'PDF wird geprüft …' : 'PDF öffnen'}</button><button className="text-button" onClick={() => setDialog('backup')}>Vorhandenes Projektbackup importieren</button><div className="privacy-note"><strong>Nur auf diesem Gerät</strong><span>Kein Upload · Kein Konto · Original bleibt unverändert</span></div><small>Auch per Drag-and-drop · PDF bis 150 MiB / 5.000 Seiten<br />Technische Eingangslimits, keine Leistungszusage</small></div></main>}
    <footer className="app-footer"><span>{offline ? 'Ohne Internet · ' : ''}{pwa.message}</span><span>Browserdaten sind kein Backup.</span>{pwa.updateAvailable && <span>Update bereit. <button onClick={() => run(async () => { const saved = await workspace.flush(); workspace.notify(saved ? 'Stand gespeichert. Zum Aktualisieren alle SkriptStudio-Tabs schließen und die App neu öffnen.' : 'Vor dem Update ein Notfall-Backup erstellen. Es wurde kein Tab neu geladen.'); })}>Vor Update sichern</button></span>}</footer>
    {dialog === 'library' && <DocumentLibrary onClose={() => setDialog(undefined)} onBackup={() => setDialog('backup')} />}
    {dialog === 'backup' && <BackupDialog onClose={() => setDialog(undefined)} />}
    {dialog === 'export' && <ExportDialog onClose={() => setDialog(undefined)} />}
    {dialog === 'help' && <HelpDialog onClose={() => setDialog(undefined)} />}
  </div>;
}
