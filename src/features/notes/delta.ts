import { LIMITS, type Attributes, type DeltaOp, type NoteDelta } from '../../types/models';
const own = Object.prototype.hasOwnProperty;
export function record(value: unknown, allowed: readonly string[], label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label}: Objekt erwartet.`);
  const proto: unknown = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) throw new Error(`${label}: ungültiges Objekt.`);
  for (const key of Object.keys(value)) if (!allowed.includes(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error(`${label}: unerlaubtes Feld „${key}“.`);
  return value as Record<string, unknown>;
}
export function string(value: unknown, max: number, label: string, min = 1): string {
  if (typeof value !== 'string' || value.length < min || value.length > max) throw new Error(`${label}: ungültige Textlänge.`);
  return value;
}
export function integer(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label}: ungültige Ganzzahl.`);
  return value;
}
export function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label}: Wahrheitswert erwartet.`);
  return value;
}
const allowedAttributes = ['bold', 'italic', 'underline', 'strike', 'header', 'list', 'indent', 'align', 'color', 'background'];
export function parseAttributes(value: unknown): Attributes {
  const a = record(value, allowedAttributes, 'Formatierung');
  const out: Attributes = {};
  for (const key of ['bold', 'italic', 'underline', 'strike'] as const) {
    if (own.call(a, key)) { if (a[key] !== true) throw new Error(`Ungültiges Format: ${key}`); out[key] = true; }
  }
  if (own.call(a, 'header')) out.header = integer(a.header, 1, 3, 'Überschrift') as 1 | 2 | 3;
  if (own.call(a, 'indent')) out.indent = integer(a.indent, 1, LIMITS.indent, 'Einrückung');
  if (own.call(a, 'list')) { if (a.list !== 'bullet' && a.list !== 'ordered') throw new Error('Ungültige Liste.'); out.list = a.list; }
  if (own.call(a, 'align')) { if (a.align !== 'center' && a.align !== 'right' && a.align !== 'justify') throw new Error('Ungültige Ausrichtung.'); out.align = a.align; }
  for (const key of ['color', 'background'] as const) {
    if (own.call(a, key)) { const v = string(a[key], 7, 'Farbe'); if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error('Farben müssen sechsstellige Hexwerte sein.'); out[key] = v.toLowerCase(); }
  }
  if (out.header && out.list) throw new Error('Überschrift und Liste sind auf derselben Zeile nicht erlaubt.');
  return out;
}
export function parseDelta(value: unknown): NoteDelta {
  const d = record(value, ['ops'], 'Notiz');
  if (!Array.isArray(d.ops) || d.ops.length < 1 || d.ops.length > LIMITS.deltaOps) throw new Error('Ungültige Anzahl von Delta-Operationen.');
  let length = 0;
  const ops: DeltaOp[] = d.ops.map((raw: unknown) => {
    const op = record(raw, ['insert', 'attributes'], 'Delta-Operation');
    const insert = string(op.insert, LIMITS.noteChars, 'Notiztext');
    length += insert.length;
    if (length > LIMITS.noteChars || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(insert)) throw new Error('Notiz zu groß oder mit nicht unterstützten Steuerzeichen.');
    if (op.attributes === undefined) return { insert };
    const attributes = parseAttributes(op.attributes);
    if ((attributes.header || attributes.list || attributes.align || attributes.indent) && /[^\n]/u.test(insert)) throw new Error('Absatzformate müssen an Zeilenumbrüchen stehen.');
    return Object.keys(attributes).length ? { insert, attributes } : { insert };
  });
  if (!ops[ops.length - 1]?.insert.endsWith('\n')) throw new Error('Eine vollständige Notiz benötigt den abschließenden Zeilenumbruch.');
  return { ops };
}
export function plainText(delta: NoteDelta): string { return delta.ops.map(op => op.insert).join(''); }
export function hasContent(delta: NoteDelta): boolean { return plainText(delta).replace(/[\s\u200b-\u200d\ufeff]/gu, '').length > 0; }
export function normalizeColor(input: string): string | undefined {
  if (/^#[a-f\d]{6}$/i.test(input)) return input.toLowerCase();
  if (/^#[a-f\d]{3}$/i.test(input)) return '#' + [...input.slice(1)].map(x => x + x).join('').toLowerCase();
  const match = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(input);
  if (match && match.slice(1).every(n => Number(n) <= 255)) return '#' + match.slice(1).map(n => Number(n).toString(16).padStart(2, '0')).join('');
  return undefined;
}
/** Only used for Quill-generated state. Backup input uses strict parseDelta directly. */
export function fromEditor(value: { ops: { insert?: unknown; attributes?: Record<string, unknown> }[] }): NoteDelta {
  const ops = value.ops.map(op => {
    if (typeof op.insert !== 'string') throw new Error('Bilder, Videos und andere Einbettungen werden nicht unterstützt.');
    const attributes: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(op.attributes ?? {})) {
      if (!allowedAttributes.includes(key)) throw new Error(`Nicht unterstützte Formatierung: ${key}`);
      if (v === false || v === null || (key === 'indent' && v === 0) || (key === 'align' && v === '')) continue;
      if (key === 'color' || key === 'background') {
        const color = typeof v === 'string' ? normalizeColor(v) : undefined;
        if (!color) throw new Error('Diese Farbe wird nicht unterstützt.');
        attributes[key] = color;
      } else attributes[key] = v;
    }
    return Object.keys(attributes).length ? { insert: op.insert, attributes } : { insert: op.insert };
  });
  return parseDelta({ ops });
}
