import { PDFDocument } from 'pdf-lib';
import pdfMake from 'pdfmake/build/pdfmake';
import vfs from 'pdfmake/build/vfs_fonts';
import fontkit from '@pdf-lib/fontkit';
import { base64ToBytes } from '../../utils/binary';
import { errorText } from '../../types/models';
import { hasContent, plainText } from '../notes/delta';
import { deltaToPdf, type PdfNode } from './deltaToPdf';
import type { ExportRequest, ExportResponse } from './exportService';
interface TextDefinition { text: string; fontSize?: number; color?: string; margin?: number[]; alignment?: string; bold?: boolean }
interface Definition {
  pageSize: 'A4'; pageOrientation: 'portrait'; pageMargins: [number, number, number, number];
  defaultStyle: { font: string; fontSize: number; lineHeight: number }; content: PdfNode[];
  header: () => TextDefinition; footer: (page: number, count: number) => TextDefinition;
  pageBreakBefore: (current: { headlineLevel?: number }, container: { getFollowingNodesOnPage: () => unknown[] }) => boolean;
}
interface PdfMakeBrowser { addVirtualFileSystem: (fonts: Record<string, string>) => void; setUrlAccessPolicy: (policy: (url: string) => boolean) => void; createPdf: (definition: Definition) => { getBuffer: () => Promise<Uint8Array> } }
// Narrow adapter for pdfmake 0.3.11: promise methods and the 0.3 page-break API.
const make = pdfMake as unknown as PdfMakeBrowser;
const fonts = vfs as Record<string, string>;
make.addVirtualFileSystem(fonts);
make.setUrlAccessPolicy(() => false);
const fontNames = ['Roboto-Regular.ttf', 'Roboto-Medium.ttf', 'Roboto-Italic.ttf', 'Roboto-MediumItalic.ttf'];
const fontObjects = fontNames.map(name => { const data = fonts[name]; if (!data) throw new Error(`PDF-Schrift fehlt: ${name}`); const font = fontkit.create(base64ToBytes(data)); if (!('hasGlyphForCodePoint' in font) || typeof font.hasGlyphForCodePoint !== 'function') throw new Error('Die PDF-Schrift kann nicht geprüft werden.'); return font; });
function checkGlyphs(text: string): void {
  const missing = [...new Set([...text].filter(char => !/[\s\r\n\t]/u.test(char) && fontObjects.some(font => !font.hasGlyphForCodePoint(char.codePointAt(0)!))))];
  if (missing.length) throw new Error(`Nicht unterstützte PDF-Zeichen: ${missing.slice(0, 12).map(c => `${c} (U+${c.codePointAt(0)!.toString(16).toUpperCase()})`).join(', ')}. Bitte ersetzen oder ein bearbeitbares JSON-Backup verwenden.`);
}
const scope = self as unknown as { postMessage: (message: ExportResponse, transfer: Transferable[]) => void; onmessage: (event: MessageEvent<ExportRequest>) => void };
function send(message: ExportResponse, transfer: Transferable[] = []): void { scope.postMessage(message, transfer); }
scope.onmessage = (event: MessageEvent<ExportRequest>) => {
  void (async () => {
    const { original, document, notes, omitEmpty } = event.data;
    checkGlyphs(document.displayName); notes.forEach(note => checkGlyphs(plainText(note.delta)));
    const source = await PDFDocument.load(original, { updateMetadata: false });
    if (source.isEncrypted || source.getPageCount() !== document.pageCount) throw new Error('Original-PDF nicht für diesen Export geeignet.');
    const result = await PDFDocument.create(); result.setTitle(`${document.displayName} – mit Notizen`); result.setCreator('SkriptStudio');
    const singleLineName = document.displayName.replace(/\s+/gu, ' ').trim();
    const headerName = [...singleLineName].length > 64 ? [...singleLineName].slice(0, 64).join('') + '…' : singleLineName;
    const indexed = new Map(notes.map(note => [note.pageIndex, note]));
    for (let i = 0; i < source.getPageCount(); i++) {
      const [originalPage] = await result.copyPages(source, [i]); result.addPage(originalPage!);
      const note = indexed.get(i);
      if (!omitEmpty || (note && hasContent(note.delta))) {
        const definition: Definition = {
          pageSize: 'A4', pageOrientation: 'portrait', pageMargins: [44, 74, 44, 52],
          defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.35 },
          header: () => ({ text: `Notizen zu Originalseite ${i + 1} · ${headerName}`, fontSize: 9, color: '#53606d', margin: [44, 30, 44, 0] }),
          footer: (page, count) => ({ text: `SkriptStudio · Originalseite ${i + 1} · Notizseite ${page} von ${count}`, fontSize: 8, color: '#53606d', alignment: 'center', margin: [44, 15, 44, 0] }),
          content: note ? deltaToPdf(note.delta) : [{ text: ' ' }],
          pageBreakBefore: (current, container) => !!current.headlineLevel && container.getFollowingNodesOnPage().length === 0,
        };
        const buffer = await make.createPdf(definition).getBuffer();
        const generated = await PDFDocument.load(buffer);
        for (const page of await result.copyPages(generated, generated.getPageIndices())) result.addPage(page);
      }
      send({ type: 'progress', progress: { completed: i + 1, total: source.getPageCount(), outputPages: result.getPageCount() } });
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    const bytes = await result.save(); const transferable = Uint8Array.from(bytes).buffer;
    send({ type: 'done', bytes: transferable }, [transferable]);
  })().catch((error: unknown) => send({ type: 'error', message: errorText(error) }));
};
