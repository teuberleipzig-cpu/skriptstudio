import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import fontkit from '@pdf-lib/fontkit';
const require = createRequire(import.meta.url);
const root = dirname(require.resolve('pdfjs-dist/package.json'));
for (const style of ['Regular', 'Bold', 'Italic', 'BoldItalic']) {
  it(`gebündelte Liberation Sans ${style} enthält Umlaute und alle geforderten Statistikzeichen`, () => {
    const font = fontkit.create(readFileSync(join(root, 'standard_fonts', `LiberationSans-${style}.ttf`)));
    if (!('hasGlyphForCodePoint' in font) || typeof font.hasGlyphForCodePoint !== 'function') throw new Error('Ungültige Testschrift.');
    const missing = [...'äöüÄÖÜß „“ α β μ σ Δ ≤ ≥ ± ² →'].filter(char => !font.hasGlyphForCodePoint(char.codePointAt(0)!));
    expect(missing).toEqual([]);
  });
}
