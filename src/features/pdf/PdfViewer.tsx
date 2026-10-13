import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getDocument, TextLayer, type PDFDocumentProxy, type PDFPageProxy, type RenderTask } from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import { pdfOptions } from './pdfService';
import { LIMITS, errorText, type PdfAsset, type ViewState } from '../../types/models';
interface Props { asset: PdfAsset; view: ViewState; onError: (error: unknown) => void }
export function PdfViewer({ asset, view, onError }: Props) {
  const scroll = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy>(), [width, setWidth] = useState(500);
  const [status, setStatus] = useState('PDF wird geladen …');
  const generation = useRef(0), loadedFor = useRef<Blob | undefined>(undefined);
  useLayoutEffect(() => {
    loadedFor.current = undefined;
    let cancelled = false;
    let task: ReturnType<typeof getDocument> | undefined;
    setPdf(undefined); setStatus('PDF wird geladen …');
    void (async () => {
      const data = new Uint8Array(await asset.blob.arrayBuffer());
      if (cancelled) return;
      task = getDocument({ ...pdfOptions(), data });
      const result = await task.promise;
      if (!cancelled) { loadedFor.current = asset.blob; setPdf(result); }
    })().catch((error: unknown) => { if (!cancelled) { setStatus(errorText(error)); onError(error); } });
    return () => { cancelled = true; generation.current++; if (task) void task.destroy().catch((error: unknown) => console.warn('PDF-Ressourcen konnten nicht vollständig freigegeben werden.', error instanceof Error ? error.name : 'Unbekannt')); };
  }, [asset.blob, onError]);
  useEffect(() => {
    if (!scroll.current) return;
    const observer = new ResizeObserver(entries => { const w = entries[0]?.contentRect.width; if (w && w > 40) setWidth(Math.max(64, Math.floor(w - 40))); });
    observer.observe(scroll.current); return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const target = stage.current, token = ++generation.current;
    let render: RenderTask | undefined, text: TextLayer | undefined, currentPage: PDFPageProxy | undefined;
    if (target) target.replaceChildren();
    setStatus(`Seite ${view.pageIndex + 1} wird geladen …`);
    if (!pdf || !target || loadedFor.current !== asset.blob) return;
    void (async () => {
      const page = await pdf.getPage(view.pageIndex + 1); currentPage = page;
      if (token !== generation.current) return;
      const natural = page.getViewport({ scale: 1 });
      const scale = view.zoomMode === 'fit' ? Math.min(4, Math.max(0.1, width / natural.width)) : view.zoom;
      const viewport = page.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(LIMITS.canvasPixels / (viewport.width * viewport.height)));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width * ratio)); canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
      canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
      canvas.setAttribute('aria-label', `Originalseite ${view.pageIndex + 1}`);
      const context = canvas.getContext('2d'); if (!context) throw new Error('Der Browser kann keinen PDF-Zeichenbereich bereitstellen.');
      render = page.render({ canvas, canvasContext: context, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] });
      await render.promise;
      if (token !== generation.current) return;
      const textContainer = document.createElement('div'); textContainer.className = 'textLayer';
      textContainer.style.setProperty('--scale-factor', String(scale));
      textContainer.style.setProperty('--total-scale-factor', String(scale * page.userUnit));
      text = new TextLayer({ textContentSource: page.streamTextContent(), container: textContainer, viewport });
      await text.render();
      if (token !== generation.current) return;
      target.style.width = `${viewport.width}px`; target.style.height = `${viewport.height}px`;
      target.style.setProperty('--scale-factor', String(scale)); target.style.setProperty('--total-scale-factor', String(scale * page.userUnit));
      target.replaceChildren(canvas, textContainer); setStatus('');
    })().catch((error: unknown) => {
      if (token !== generation.current || (error instanceof Error && error.name === 'RenderingCancelledException')) return;
      setStatus(`Seite konnte nicht dargestellt werden: ${errorText(error)}`); onError(error);
    }).finally(() => { currentPage?.cleanup(); });
    return () => { generation.current++; render?.cancel(); text?.cancel(); };
  }, [pdf, asset.blob, view.pageIndex, view.zoomMode, view.zoom, width, onError]);
  return <div className="pdf-scroll" ref={scroll} tabIndex={0} aria-label="PDF-Arbeitsbereich">
    {status && <div className="viewer-status" role="status">{status}</div>}
    <div className="pdf-page" ref={stage} hidden={!!status} />
  </div>;
}
