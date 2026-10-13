import { useEffect, useState } from 'react';
import type { ViewState } from '../../types/models';
interface Props { view: ViewState; count: number; busy: boolean; onPage: (page: number) => void; onZoom: (mode: ViewState['zoomMode'], zoom?: number) => void; onError: (error: unknown) => void }
export function PdfControls({ view, count, busy, onPage, onZoom, onError }: Props) {
  const [input, setInput] = useState(String(view.pageIndex + 1));
  useEffect(() => setInput(String(view.pageIndex + 1)), [view.pageIndex]);
  function commit() {
    try { if (!/^\d+$/.test(input)) throw new Error(`Bitte eine ganze Seitenzahl zwischen 1 und ${count} eingeben.`); onPage(Number(input) - 1); }
    catch (error: unknown) { onError(error); setInput(String(view.pageIndex + 1)); }
  }
  return <div className="pdf-controls">
    <div className="button-group"><button title="Vorherige Seite · Alt + Pfeil links außerhalb des Editors" aria-label="Vorherige Seite" disabled={busy || view.pageIndex === 0} onClick={() => onPage(view.pageIndex - 1)}>←</button>
      <label className="page-input">Seite <input aria-label="Seitenzahl" inputMode="numeric" value={input} onChange={e => setInput(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} disabled={busy} /> <span>von {count}</span></label>
      <button title="Nächste Seite · Alt + Pfeil rechts außerhalb des Editors" aria-label="Nächste Seite" disabled={busy || view.pageIndex === count - 1} onClick={() => onPage(view.pageIndex + 1)}>→</button></div>
    <div className="button-group"><button aria-label="Verkleinern" disabled={view.zoomMode === 'manual' && view.zoom <= 0.25} onClick={() => onZoom('manual', view.zoom - 0.25)}>−</button>
      <span className="zoom-label">{view.zoomMode === 'fit' ? 'Breite' : `${Math.round(view.zoom * 100)} %`}</span>
      <button aria-label="Vergrößern" disabled={view.zoomMode === 'manual' && view.zoom >= 4} onClick={() => onZoom('manual', view.zoom + 0.25)}>+</button>
      <button aria-pressed={view.zoomMode === 'fit'} onClick={() => onZoom('fit')}>An Breite</button></div>
  </div>;
}
