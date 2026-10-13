/** Synthetic ASCII PDFs only: no lecture material, names or external font files. */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
export function fixturePdf(count = 3, label = 'SkriptStudio', imageHeavy = false) {
  if (!Number.isInteger(count) || count < 1 || count > 5000) throw new Error('Invalid fixture page count.');
  const objects = [null, null, Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')];
  const kids = [];
  const push = content => { objects.push(Buffer.isBuffer(content) ? content : Buffer.from(content, 'ascii')); return objects.length; };
  const stream = (dictionary, data) => Buffer.concat([Buffer.from(`<< ${dictionary} /Length ${data.length} >>\nstream\n`, 'ascii'), data, Buffer.from('\nendstream', 'ascii')]);
  for (let index = 0; index < count; index++) {
    const [width, height] = index % 3 === 0 ? [960, 540] : index % 3 === 1 ? [595, 842] : [720, 480];
    const safe = `${label} ORIGINAL ${index + 1}`.replace(/[^a-zA-Z0-9 _-]/g, '_');
    let imageId;
    if (imageHeavy) {
      // Seeded RGB noise avoids misleading tiny repetitive image fixtures.
      const rgb = Buffer.alloc(512 * 512 * 3); let seed = index + 1731;
      for (let i = 0; i < rgb.length; i++) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; rgb[i] = seed & 255; }
      imageId = push(stream('/Type /XObject /Subtype /Image /Width 512 /Height 512 /ColorSpace /DeviceRGB /BitsPerComponent 8', rgb));
    }
    const text = `BT /F1 26 Tf 40 ${height - 60} Td (${safe}) Tj ET\nBT /F1 14 Tf 40 ${height - 90} Td (Synthetic fixture - local processing only.) Tj ET\n`;
    const graphics = imageId ? `q 320 0 0 320 50 30 cm /Im${index} Do Q\n` : `0.85 0.91 0.89 rg 40 80 ${width - 80} ${height - 230} re f\n`;
    const contentId = push(stream('', Buffer.from(text + graphics, 'ascii')));
    const pageId = push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] ${index % 3 === 2 ? '/CropBox [10 10 710 470] /Rotate 90' : ''} /Resources << /Font << /F1 3 0 R >> ${imageId ? `/XObject << /Im${index} ${imageId} 0 R >>` : ''} >> /Contents ${contentId} 0 R >>`);
    kids.push(`${pageId} 0 R`);
  }
  objects[0] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>');
  objects[1] = Buffer.from(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${count} >>`);
  const chunks = [Buffer.from('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n', 'latin1')], offsets = [0]; let length = chunks[0].length;
  for (let i = 0; i < objects.length; i++) { offsets.push(length); const chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), objects[i], Buffer.from('\nendobj\n')]); chunks.push(chunk); length += chunk.length; }
  chunks.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`));
  return Buffer.concat(chunks);
}
export async function generateFixtures(directory = 'tests/fixtures') {
  await mkdir(directory, { recursive: true });
  const fixtures = [['mixed.pdf', fixturePdf(3)], ['different.pdf', fixturePdf(3, 'Different')], ['long-300.pdf', fixturePdf(300)], ['image-heavy.pdf', fixturePdf(32, 'Images', true)]];
  const results = [];
  for (const [name, bytes] of fixtures) { await writeFile(join(directory, name), bytes); results.push({ name, bytes: bytes.length }); }
  await writeFile(join(directory, 'corrupt.pdf'), '%PDF-1.7\nnot a valid PDF');
  await writeFile(join(directory, 'not-pdf.pdf'), 'This is not a PDF.');
  await writeFile(join(directory, 'empty.pdf'), '');
  return results;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(await generateFixtures());
