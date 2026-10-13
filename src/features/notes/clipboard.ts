import { normalizeColor } from './delta';
const allowed = new Set(['P', 'BR', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'DEL', 'H1', 'H2', 'H3', 'OL', 'UL', 'LI', 'DIV']);
const remove = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'IMG', 'VIDEO', 'AUDIO', 'SVG', 'MATH', 'LINK', 'META']);
export function sanitizeClipboard(html: string): { html: string; changed: boolean } {
  if (html.length > 2_000_000) throw new Error('Der eingefügte Inhalt ist zu groß. Bitte in kleineren Abschnitten einfügen.');
  const template = document.createElement('template');
  // Inert template: external resources are never attached to the live document.
  template.innerHTML = html;
  let changed = false;
  for (const element of [...template.content.querySelectorAll('*')]) {
    if (remove.has(element.tagName)) { element.remove(); changed = true; continue; }
    if (!allowed.has(element.tagName)) { element.replaceWith(...element.childNodes); changed = true; continue; }
    const style = element instanceof HTMLElement ? element.style : undefined;
    const color = normalizeColor(style?.color ?? ''), background = normalizeColor(style?.backgroundColor ?? '');
    const align = style?.textAlign, weight = style?.fontWeight, italic = style?.fontStyle, decoration = style?.textDecorationLine;
    for (const attr of [...element.attributes]) element.removeAttribute(attr.name);
    if (element instanceof HTMLElement) {
      if (color) element.style.color = color; if (background) element.style.backgroundColor = background;
      if (['left', 'center', 'right', 'justify'].includes(align ?? '')) element.style.textAlign = align!;
      if (weight === 'bold' || Number(weight) >= 600) element.style.fontWeight = 'bold';
      if (italic === 'italic') element.style.fontStyle = 'italic';
      const lines = (decoration ?? '').split(' ').filter(v => v === 'underline' || v === 'line-through');
      if (lines.length) element.style.textDecorationLine = lines.join(' ');
    }
  }
  return { html: template.innerHTML, changed };
}
