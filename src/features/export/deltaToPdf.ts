import type { Attributes, NoteDelta } from '../../types/models';
import { parseDelta } from '../notes/delta';
export interface PdfRun { text: string; bold?: boolean; italics?: boolean; decoration?: ('underline' | 'lineThrough')[]; color?: string; background?: string }
export interface PdfNode {
  text?: string | PdfRun[]; stack?: PdfNode[]; ul?: PdfNode[]; ol?: PdfNode[];
  margin?: [number, number, number, number]; fontSize?: number; bold?: boolean;
  alignment?: 'left' | 'center' | 'right' | 'justify'; headlineLevel?: number;
}
interface Line { runs: PdfRun[]; attributes: Attributes }
export function deltaLines(input: NoteDelta): Line[] {
  const delta = parseDelta(input), lines: Line[] = [];
  let runs: PdfRun[] = [];
  for (const op of delta.ops) {
    const a = op.attributes ?? {};
    const pieces = op.insert.split('\n');
    pieces.forEach((text, i) => {
      if (text) {
        const run: PdfRun = { text: text.replace(/\t/g, '    ').replace(/\r/g, '') };
        if (a.bold) run.bold = true; if (a.italic) run.italics = true;
        if (a.color) run.color = a.color; if (a.background) run.background = a.background;
        const decoration: ('underline' | 'lineThrough')[] = [];
        if (a.underline) decoration.push('underline'); if (a.strike) decoration.push('lineThrough');
        if (decoration.length) run.decoration = decoration;
        runs.push(run);
      }
      if (i < pieces.length - 1) { lines.push({ runs: runs.length ? runs : [{ text: ' ' }], attributes: a }); runs = []; }
    });
  }
  return lines;
}
export function deltaToPdf(delta: NoteDelta): PdfNode[] {
  const content: PdfNode[] = [];
  type Level = { depth: number; kind: 'ordered' | 'bullet'; node: PdfNode; items: PdfNode[]; last: PdfNode };
  const levels: Level[] = [];
  for (const line of deltaLines(delta)) {
    const a = line.attributes;
    const paragraph: PdfNode = { text: line.runs, alignment: a.align ?? 'left', margin: [0, 0, 0, 7] };
    if (a.header) { paragraph.fontSize = { 1: 22, 2: 17, 3: 14 }[a.header]; paragraph.bold = true; paragraph.headlineLevel = a.header; paragraph.margin = [0, 8, 0, 8]; }
    if (!a.list) { levels.length = 0; paragraph.margin![0] = (a.indent ?? 0) * 18; content.push(paragraph); continue; }
    const depth = a.indent ?? 0;
    while (levels.length && levels[levels.length - 1]!.depth > depth) levels.pop();
    let level = levels[levels.length - 1];
    if (level && level.depth === depth && level.kind !== a.list) { levels.pop(); level = levels[levels.length - 1]; }
    if (!level || level.depth !== depth || level.kind !== a.list) {
      const items: PdfNode[] = [];
      const node: PdfNode = a.list === 'ordered' ? { ol: items } : { ul: items };
      const parent = levels[levels.length - 1];
      if (parent && parent.depth < depth) { node.margin = [(depth - parent.depth - 1) * 18, 0, 0, 0]; parent.last.stack!.push(node); }
      else { node.margin = [depth * 18, 0, 0, 5]; content.push(node); }
      level = { depth, kind: a.list, node, items, last: { stack: [] } };
      levels.push(level);
    }
    const item: PdfNode = { stack: [paragraph] };
    level.items.push(item); level.last = item;
  }
  return content.length ? content : [{ text: ' ' }];
}
