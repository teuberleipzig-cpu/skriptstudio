import { useMemo, useState } from 'react';
import type { Note } from '../../types/models';
import { hasContent } from '../notes/delta';
interface Props { count: number; page: number; notes: Note[]; onPage: (page: number) => void }
export function PageNavigator({ count, page, notes, onPage }: Props) {
  const [query, setQuery] = useState(''), [bookmarksOnly, setBookmarksOnly] = useState(false), [windowStart, setWindowStart] = useState(0);
  const indexed = useMemo(() => new Map(notes.map(note => [note.pageIndex, note])), [notes]);
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('de-DE');
    return notes.filter(n => (!bookmarksOnly || n.isBookmarked) && (!term || n.plainText.toLocaleLowerCase('de-DE').includes(term))).sort((a, b) => a.pageIndex - b.pageIndex);
  }, [notes, query, bookmarksOnly]);
  const filtering = query.trim() !== '' || bookmarksOnly;
  // Bounded page-number grid; never eagerly creates thousands of thumbnails.
  const start = Math.min(windowStart, Math.floor((count - 1) / 100) * 100);
  return <aside className="page-navigator" aria-label="Lernnavigation"><div className="search-row"><input type="search" aria-label="Notizen dieses Dokuments durchsuchen" placeholder="In deinen Notizen suchen …" value={query} onChange={e => setQuery(e.target.value)} /><label className="check"><input type="checkbox" checked={bookmarksOnly} onChange={e => setBookmarksOnly(e.target.checked)} /> Nur Lesezeichen</label></div>
    {filtering ? <div className="search-results">{results.length === 0 ? <p>Keine passenden Notizen oder Lesezeichen.</p> : results.map(note => <button key={note.pageIndex} aria-current={note.pageIndex === page ? 'page' : undefined} onClick={() => onPage(note.pageIndex)}><strong>Seite {note.pageIndex + 1}{note.isBookmarked ? ' ★' : ''}</strong><span>{snippet(note.plainText, query)}</span></button>)}</div> : <><div className="page-grid">{Array.from({ length: Math.min(100, count - start) }, (_, n) => n + start).map(i => { const note = indexed.get(i); return <button key={i} aria-current={page === i ? 'page' : undefined} title={`Seite ${i + 1}${note && hasContent(note.delta) ? ' · Mit Notizen' : ''}${note?.isBookmarked ? ' · Lesezeichen' : ''}`} onClick={() => onPage(i)}>{i + 1}<small>{note?.isBookmarked ? '★' : ''}{note && hasContent(note.delta) ? '✎' : ''}</small></button>; })}</div>{count > 100 && <div className="button-group"><button disabled={start === 0} onClick={() => setWindowStart(start - 100)}>← 100 Seiten</button><button onClick={() => setWindowStart(Math.floor(page / 100) * 100)}>Aktuelle Seite</button><button disabled={start + 100 >= count} onClick={() => setWindowStart(start + 100)}>100 Seiten →</button></div>}</>}
    <p className="navigation-legend">✎ Notizen · ★ Lesezeichen · Suche nur in eigenen Notizen, nicht im PDF.</p>
  </aside>;
}
function snippet(text: string, query: string): string { const lower = text.toLocaleLowerCase('de-DE'), at = lower.indexOf(query.trim().toLocaleLowerCase('de-DE')); const start = Math.max(0, at - 40); return (start ? '… ' : '') + text.slice(start, start + 170).replace(/\s+/g, ' ') + (text.length > start + 170 ? ' …' : ''); }
