import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';
import { LIMITS, type PdfAsset } from '../../types/models';
import { sha256 } from '../../utils/binary';
GlobalWorkerOptions.workerSrc = workerUrl;
export const pdfOptions = () => ({
  isEvalSupported: false, enableXfa: false, useSystemFonts: false,
  cMapUrl: `${import.meta.env.BASE_URL}pdfjs/cmaps/`, cMapPacked: true,
  standardFontDataUrl: `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`,
  wasmUrl: `${import.meta.env.BASE_URL}pdfjs/wasm/`,
});
export async function preparePdf(blob: Blob): Promise<{ asset: PdfAsset; pageCount: number }> {
  if (blob.size === 0 || blob.size > LIMITS.pdfBytes) throw new Error('PDF leer oder größer als 150 MiB. Das bisherige Projekt bleibt geöffnet.');
  const prefix = new TextDecoder('latin1').decode(await blob.slice(0, 1024).arrayBuffer());
  if (!/%PDF-\d\.\d/u.test(prefix)) throw new Error('Diese Datei besitzt keine plausible PDF-Signatur.');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let source: PDFDocument;
  try { source = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true }); }
  catch (error: unknown) {
    if (error instanceof Error && /encrypt|password/i.test(error.message)) throw new Error('Passwortgeschützte oder verschlüsselte PDFs werden in dieser Version nicht unterstützt.');
    throw new Error('Die PDF ist beschädigt oder wird von der Exportverarbeitung nicht unterstützt.');
  }
  if (source.isEncrypted) throw new Error('Verschlüsselte PDFs werden nicht unterstützt.');
  const count = source.getPageCount();
  if (count < 1 || count > LIMITS.pages) throw new Error(`Unterstützt werden 1 bis ${LIMITS.pages} Originalseiten.`);
  const task = getDocument({ ...pdfOptions(), data: bytes.slice(), stopAtErrors: true });
  try {
    const pdf = await task.promise;
    if (pdf.numPages !== count) throw new Error('Die PDF-Parser erkennen unterschiedliche Seitenzahlen. Import abgebrochen.');
    // Parse at least the first page before committing. Other page errors stay explicit in the viewer.
    await pdf.getPage(1);
  } catch (error: unknown) {
    if (error instanceof Error && /password/i.test(error.name)) throw new Error('Passwortgeschützte PDFs werden nicht unterstützt.');
    throw new Error('Die PDF kann nicht zuverlässig gelesen werden. Es wurde nichts importiert.');
  } finally { await task.destroy(); }
  return { asset: { sha256: await sha256(blob), blob, byteLength: blob.size, createdAt: Date.now() }, pageCount: count };
}
