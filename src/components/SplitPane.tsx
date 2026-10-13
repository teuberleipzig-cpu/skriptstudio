import { useRef, useState, type ReactNode } from 'react';
const KEY = 'skriptstudio:split';
function readSplit(): number { try { const n = Number(localStorage.getItem(KEY)); return n >= 30 && n <= 70 ? n : 52; } catch { return 52; } }
export function SplitPane({ left, right, mobile }: { left: ReactNode; right: ReactNode; mobile: 'pdf' | 'notes' }) {
  const root = useRef<HTMLDivElement>(null), [split, setSplit] = useState(readSplit);
  const [warning, setWarning] = useState('');
  function change(value: number) { const n = Math.max(30, Math.min(70, value)); setSplit(n); try { localStorage.setItem(KEY, String(n)); } catch { setWarning('Die Panel-Aufteilung kann nicht dauerhaft gespeichert werden. Notizen sind davon unabhängig.'); } }
  return <div className={`split-pane mobile-${mobile}`} ref={root} style={{ gridTemplateColumns: `minmax(0, ${split}fr) 10px minmax(0, ${100 - split}fr)` }}>
    <section className="pane pdf-pane" aria-label="Original-PDF">{left}</section>
    <div className="splitter" role="separator" tabIndex={0} aria-label="Breite der PDF-Spalte ändern; Pos1 setzt auf Standard zurück" aria-orientation="vertical" aria-valuemin={30} aria-valuemax={70} aria-valuenow={Math.round(split)}
      onDoubleClick={() => change(52)} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home'].includes(e.key)) { e.preventDefault(); change(e.key === 'Home' ? 52 : split + (e.key === 'ArrowRight' ? 2 : -2)); } }}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (!e.currentTarget.hasPointerCapture(e.pointerId) || !root.current) return; const rect = root.current.getBoundingClientRect(); change((e.clientX - rect.left) / rect.width * 100); }} onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}><span /></div>
    <section className="pane notes-pane" aria-label="Seitennotizen">{right}</section>{warning && <span className="sr-only" role="status">{warning}</span>}
  </div>;
}
