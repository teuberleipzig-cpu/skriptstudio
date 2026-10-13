const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deltaToPdf } = require('../../.core-build/features/export/deltaToPdf.js');
test('terminal paragraph has no trailing margin, without dropping actual blank paragraphs', () => {
  const nodes = deltaToPdf({ ops: [{ insert: 'First\nLast\n\n' }] });
  assert.equal(nodes.length, 3);
  assert.equal(nodes[0].margin[3], 7);
  assert.equal(nodes[1].margin[3], 7);
  assert.equal(nodes[2].margin[3], 0);
  assert.deepEqual(nodes[2].text, [{ text: ' ' }]);
});
test('terminal list wrapper and last paragraph have no trailing margin; preceding item keeps spacing', () => {
  const nodes = deltaToPdf({ ops: [{ insert: 'First' }, { insert: '\n', attributes: { list: 'ordered' } }, { insert: 'Last' }, { insert: '\n', attributes: { list: 'ordered' } }] });
  assert.equal(nodes[0].margin[3], 0);
  assert.equal(nodes[0].ol[0].stack[0].margin[3], 7);
  assert.equal(nodes[0].ol[1].stack[0].margin[3], 0);
});
