import { useEffect, useId, useRef, type ReactNode } from 'react';
interface Props { title: string; children: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean }
export function Dialog({ title, children, onClose, busy = false, wide = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null), heading = useId();
  useEffect(() => { const d = ref.current, previous = document.activeElement; d?.showModal(); return () => { d?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); }; }, []);
  return <dialog ref={ref} aria-labelledby={heading} className={wide ? 'dialog wide' : 'dialog'} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <header className="dialog-heading"><h2 id={heading}>{title}</h2><button type="button" aria-label="Dialog schließen" disabled={busy} onClick={onClose}>×</button></header>{children}
  </dialog>;
}
