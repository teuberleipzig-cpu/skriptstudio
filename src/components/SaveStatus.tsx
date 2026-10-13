import type { SaveState } from '../storage/saveQueue';
export function SaveStatus({ state, loading, readOnly }: { state: SaveState; loading: boolean; readOnly: boolean }) {
  let label: string;
  if (loading) label = 'Wird geladen';
  else if (state.errors.length) label = 'Speichern fehlgeschlagen';
  else if (state.writing) label = 'Speichert …';
  else if (state.dirty) label = 'Ungespeicherte Änderungen';
  else if (readOnly) label = 'Schreibgeschützter Stand';
  else if (state.savedAt) label = `Gespeichert um ${new Date(state.savedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  else label = 'Keine offenen Änderungen';
  return <span className={`save-status ${state.errors.length ? 'save-error' : ''}`} role="status" aria-live="polite">{state.errors.length ? '!' : state.dirty || state.writing ? '◌' : '✓'} {label}</span>;
}
