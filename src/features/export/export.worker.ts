import { PDFDocument } from 'pdf-lib';
import pdfMake from 'pdfmake/build/pdfmake';
import fontkit from '@pdf-lib/fontkit';
import { bytesToBase64 } from '../../utils/binary';
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
interface PdfMakeBrowser {
  addVirtualFileSystem: (fonts: Record<string, string>) => void;
  addFonts: (fonts: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>) => void;
  setUrlAccessPolicy: (policy: (url: string) => boolean) => void;
  createPdf: (definition: Definition) => { getBuffer: () => Promise<Uint8Array> };
}
const make = pdfMake as unknown as PdfMakeBrowser;
make.setUrlAccessPolicy(() => false);
interface GlyphFont { hasGlyphForCodePoint: (code: number) => boolean }
const fontNames = ['LiberationSans-Regular.ttf', 'LiberationSans-Bold.ttf', 'LiberationSans-Italic.ttf', 'LiberationSans-BoldItalic.ttf'];
async function prepareFonts(): Promise<GlyphFont[]> {
  // These licensed fonts already belong to the pinned PDF.js package and its offline cache.
  // No system font, external CDN, or server-side font lookup is used.
  const virtual: Record<string, string> = {};
  const parsed: GlyphFont[] = [];
  for (const name of fontNames) {
    const response = await fetch(`${import.meta.env.BASE_URL}pdfjs/standard_fonts/${name}`);
    if (!response.ok) throw new Error(`Lokale PDF-Schrift konnte nicht geladen werden: ${name}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const font = fontkit.create(bytes);
    if (!('hasGlyphForCodePoint' in font) || typeof font.hasGlyphForCodePoint !== 'function') throw new Error('PDF-Schrift kann nicht geprüft werden.');
    virtual[name] = bytesToBase64(bytes); parsed.push(font);
  }
  make.addVirtualFileSystem(virtual);
  make.addFonts({ SkriptSans: { normal: fontNames[0]!, bold: fontNames[1]!, italics: fontNames[2]!, bolditalics: fontNames[3]! } });
  return parsed;
}
function checkGlyphs(text: string, fonts: GlyphFont[]): void {
  const missing = [...new Set([...text].filter(char => !/[\s\r\n\t]/u.test(char) && fonts.some(font => !font.hasGlyphForCodePoint(char.codePointAt(0)!))))];
  if (missing.length) throw new Error(`Nicht unterstützte PDF-Zeichen: ${missing.slice(0, 12).map(c => `${c} (U+${c.codePointAt(0)!.toString(16).toUpperCase()})`).join(', ')}. Bitte ersetzen oder ein bearbeitbares JSON-Backup verwenden.`);
}
const scope = self as unknown as { postMessage: (message: ExportResponse, transfer: Transferable[]) => void; onmessage: (event: MessageEvent<ExportRequest>) => void };
function send(message: ExportResponse, transfer: Transferable[] = []): void { scope.postMessage(message, transfer); }
scope.onmessage = (event: MessageEvent<ExportRequest>) => {
  void (async () => {
    const { original, document, notes, omitEmpty } = event.data;
    const fonts = await prepareFonts();
    checkGlyphs(document.displayName, fonts); notes.forEach(note => checkGlyphs(plainText(note.delta), fonts));
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
          defaultStyle: { font: 'SkriptSans', fontSize: 11, lineHeight: 1.35 },
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
