import { useLayoutEffect, useRef, useState } from 'react';
import Quill, { Delta, type Range } from 'quill';
import 'quill/dist/quill.snow.css';
import { LIMITS, type NoteDelta } from '../../types/models';
import { fromEditor } from './delta';
import { sanitizeClipboard } from './clipboard';
import { EditorToolbar } from './EditorToolbar';
interface Props { initial: NoteDelta; pageIndex: number; disabled: boolean; onChange: (delta: NoteDelta) => void; onError: (error: unknown) => void; onNotice: (notice: string) => void }
export function NoteEditor(props: Props) {
  const host = useRef<HTMLDivElement>(null), quill = useRef<Quill | undefined>(undefined), selection = useRef<Range | null>(null), live = useRef(props);
  live.current = props;
  const initial = useRef(props.initial);
  const [formats, setFormats] = useState<Record<string, unknown>>({});
  const [history, setHistory] = useState({ undo: false, redo: false });
  const refresh = () => {
    const q = quill.current; if (!q) return;
    setFormats(selection.current ? q.getFormat(selection.current) : q.getFormat());
    setHistory({ undo: q.history.stack.undo.length > 0, redo: q.history.stack.redo.length > 0 });
  };
  useLayoutEffect(() => {
    const parent = host.current; if (!parent) return;
    const container = document.createElement('div'); parent.replaceChildren(container);
    const q = new Quill(container, { theme: 'snow', placeholder: 'Eigene Gedanken, Beispiele und Fragen zu dieser Folie …', formats: ['bold', 'italic', 'underline', 'strike', 'header', 'list', 'indent', 'align', 'color', 'background'], modules: { toolbar: false, history: { delay: 500, maxStack: 100, userOnly: true } } });
    quill.current = q;
    q.setContents(new Delta(initial.current.ops), 'silent'); q.history.clear(); q.enable(!live.current.disabled);
    q.root.setAttribute('aria-label', `Notizen zu Seite ${live.current.pageIndex + 1}`); q.root.setAttribute('role', 'textbox'); q.root.setAttribute('aria-multiline', 'true');
    let lastAccepted = initial.current;
    const change = (_change: unknown, _old: unknown, source: string) => {
      if (source !== 'user') return;
      try { const delta = fromEditor(q.getContents()); live.current.onChange(delta); lastAccepted = delta; }
      catch (error: unknown) { const range = q.getSelection(); q.setContents(new Delta(lastAccepted.ops), 'silent'); q.history.clear(); if (range) q.setSelection(Math.min(range.index, q.getLength() - 1), 0, 'silent'); live.current.onError(error); }
      refresh();
    };
    const selected = (range: Range | null) => { if (range) selection.current = range; refresh(); };
    const flush = () => q.update('user');
    const paste = (event: ClipboardEvent) => {
      event.preventDefault(); event.stopImmediatePropagation();
      if (live.current.disabled || !event.clipboardData) return;
      try {
        const text = event.clipboardData.getData('text/plain'), html = event.clipboardData.getData('text/html');
        if (text.length > LIMITS.noteChars || html.length > LIMITS.noteChars * 4) throw new Error('Dieser Text ist zu lang für eine einzelne Notiz.');
        const safe = html ? sanitizeClipboard(html) : { html: '', changed: false };
        const converted = html ? q.clipboard.convert({ html: safe.html, text }) : new Delta().insert(text);
        const range = q.getSelection(true) ?? { index: q.getLength() - 1, length: 0 };
        q.history.cutoff();
        q.updateContents(new Delta().retain(range.index).delete(range.length).concat(converted), 'user');
        q.setSelection(Math.min(range.index + converted.length(), q.getLength() - 1), 0, 'silent'); q.history.cutoff();
        if (safe.changed) live.current.onNotice('Nicht unterstützte Inhalte wie Bilder, Tabellenstrukturen und Links wurden beim Einfügen entfernt oder zu Text reduziert.');
      } catch (error: unknown) { live.current.onError(error); }
    };
    // Leave Tab to native focus navigation; Quill must not trap it as indentation.
    const tabFocus = (event: KeyboardEvent) => { if (event.key === 'Tab') event.stopImmediatePropagation(); };
    const dropped = (event: DragEvent) => { if (event.dataTransfer?.files.length) { event.preventDefault(); event.stopPropagation(); live.current.onNotice('Dateien bitte über „PDF öffnen“ einlesen. Bilder im Notiztext werden nicht unterstützt.'); } };
    q.on('text-change', change); q.on('selection-change', selected);
    q.root.addEventListener('keydown', tabFocus, true); q.root.addEventListener('paste', paste, true); q.root.addEventListener('drop', dropped);
    document.addEventListener('skriptstudio:flush-editor', flush);
    refresh();
    return () => { q.off('text-change', change); q.off('selection-change', selected); q.root.removeEventListener('keydown', tabFocus, true); q.root.removeEventListener('paste', paste, true); q.root.removeEventListener('drop', dropped); document.removeEventListener('skriptstudio:flush-editor', flush); q.disable(); quill.current = undefined; parent.replaceChildren(); };
  }, []);
  useLayoutEffect(() => { quill.current?.enable(!props.disabled); }, [props.disabled]);
  const action = (name: string, value?: unknown) => {
    const q = quill.current; if (!q || props.disabled) return;
    const range = selection.current ?? { index: 0, length: 0 };
    q.setSelection(range.index, range.length, 'silent');
    if (name === 'undo') q.history.undo();
    else if (name === 'redo') q.history.redo();
    else if (name === 'clean') q.removeFormat(range.index, range.length || 1, 'user');
    else q.format(name, value === 0 ? false : value, 'user');
    refresh();
  };
  return <div className="editor-frame"><EditorToolbar formats={formats} undo={history.undo} redo={history.redo} action={action} disabled={props.disabled} /><div className="editor-scroll" ref={host} /><div className="editor-footnote">Notizen bleiben in diesem Browser · Rückgängig gilt nur für die aktuelle Seitenbearbeitung.</div></div>;
}
