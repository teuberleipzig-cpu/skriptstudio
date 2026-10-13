import { Component, type ErrorInfo, type ReactNode } from 'react';
import { workspace } from './workspace';
import { exportBackup } from '../features/backup/backupService';
import { download, safeFilename } from '../utils/binary';
import { errorText } from '../types/models';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; error: string }> {
  state = { failed: false, error: '' };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, _info: ErrorInfo) { console.error('SkriptStudio: Oberfläche ausgefallen.', error.name); }
  private rescue = async () => {
    try { const snapshot = workspace.capture(); const backup = await exportBackup(snapshot, true); download(backup, safeFilename(snapshot.document.displayName, 'Notfallbackup') + '.json'); this.setState({ error: 'Notfall-Backup erstellt. Nach dem Sichern kann die Seite neu geöffnet werden.' }); }
    catch (error: unknown) { this.setState({ error: errorText(error) }); }
  };
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="fatal-error"><h1>Die Oberfläche konnte nicht fortgesetzt werden.</h1><p>Die Browserdaten wurden nicht gelöscht. Vor einem Neuladen den aktuellen Arbeitsspeicher-Stand sichern.</p><button onClick={() => void this.rescue()}>Notfall-Backup herunterladen</button>{this.state.error && <p role="status">{this.state.error}</p>}</main>;
  }
}
