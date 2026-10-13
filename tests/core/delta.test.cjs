const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseDelta, parseAttributes, hasContent, plainText, fromEditor, normalizeColor, record } = require('../../.core-build/features/notes/delta.js');
const { LIMITS, checkedPage } = require('../../.core-build/types/models.js');
test('full Delta preserves combined inline and newline attributes', () => {
  const d = { ops: [{ insert: 'Größe α ≤ →', attributes: { bold: true, italic: true, underline: true, strike: true, color: '#ABCDEF', background: '#ffee00' } }, { insert: '\n', attributes: { header: 2, align: 'center' } }] };
  const parsed = parseDelta(d); assert.equal(parsed.ops[0].attributes.color, '#abcdef'); assert.equal(parsed.ops[1].attributes.header, 2); assert.equal(plainText(parsed), 'Größe α ≤ →\n');
});
for (const [label, value] of Object.entries({ missingNewline: { ops: [{ insert: 'Text' }] }, retain: { ops: [{ retain: 2 }] }, deletion: { ops: [{ delete: 2 }] }, image: { ops: [{ insert: { image: 'https://evil.invalid/a' } }] }, unknown: { ops: [{ insert: 'a\n', attributes: { onclick: 'evil' } }] }, blockOnText: { ops: [{ insert: 'a\n', attributes: { header: 1 } }] }, invalidColor: { ops: [{ insert: 'a\n', attributes: { color: 'url(https://evil.invalid)' } }] }, nul: { ops: [{ insert: '\u0000\n' }] }, emptyOps: { ops: [] }, nonString: { ops: [{ insert: 7 }] }, attributeFalse: { ops: [{ insert: 'a\n', attributes: { bold: false } }] }, unsupportedHeading: { ops: [{ insert: '\n', attributes: { header: 4 } }] }, deepIndent: { ops: [{ insert: '\n', attributes: { indent: 5 } }] }, tooLong: { ops: [{ insert: 'x'.repeat(LIMITS.noteChars) + '\n' }] } })) {
  test('rejects malformed Delta: ' + label, () => assert.throws(() => parseDelta(value)));
}
test('rejects header/list ambiguity', () => assert.throws(() => parseAttributes({ header: 1, list: 'ordered' })));
test('rejects prototype keys and non-plain objects', () => { assert.throws(() => record(JSON.parse('{"__proto__":{"polluted":true}}'), ['__proto__'], 'test')); assert.throws(() => record(new Date(), [], 'test')); assert.equal({}.polluted, undefined); });
test('empty paragraphs, empty lists, invisible whitespace are empty', () => { for (const text of ['\n', ' \n\n', '\u200b\u200d\n']) assert.equal(hasContent({ ops: [{ insert: text }] }), false); assert.equal(hasContent({ ops: [{ insert: '\n', attributes: { list: 'bullet' } }] }), false); });
test('real text is not confused with empty formatting', () => assert.equal(hasContent({ ops: [{ insert: '0\n' }] }), true));
test('Quill normalization removes unset attributes and normalizes color', () => {
  const delta = fromEditor({ ops: [{ insert: 'A', attributes: { bold: false, italic: true, color: 'rgb(255, 0, 128)' } }, { insert: '\n', attributes: { indent: 0, align: '' } }] });
  assert.deepEqual(delta.ops[0].attributes, { italic: true, color: '#ff0080' }); assert.deepEqual(delta.ops[1], { insert: '\n' });
});
test('color parser accepts only limited solid colors', () => { assert.equal(normalizeColor('#F0A'), '#ff00aa'); assert.equal(normalizeColor('rgb(999,0,0)'), undefined); assert.equal(normalizeColor('rgba(0,0,0,0)'), undefined); assert.equal(normalizeColor('expression(x)'), undefined); });
test('page range is zero based and strict', () => { assert.equal(checkedPage(0, 3), 0); assert.equal(checkedPage(2, 3), 2); for (const p of [-1, 3, NaN, Infinity, 0.1]) assert.throws(() => checkedPage(p, 3)); });
test('validated Delta is detached from caller mutations', () => { const input={ops:[{insert:'A\n',attributes:{bold:true}}]}; const out=parseDelta(input); input.ops[0].attributes.bold=false; assert.equal(out.ops[0].attributes.bold,true); });
