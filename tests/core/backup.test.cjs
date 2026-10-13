const { test } = require('node:test');
const assert = require('node:assert/strict');
const { snapshotToBackup, parseBackup, parseBackupJson } = require('../../.core-build/features/backup/backupSchema.js');
const { bytesToBase64, base64ToBytes, sha256, safeFilename } = require('../../.core-build/utils/binary.js');
const { snapshot } = require('./helpers.cjs');
const valid=()=>snapshotToBackup(snapshot());
test('notes backup roundtrip retains full Delta, bookmark and view', () => { const s=snapshot(); s.notes[0].isBookmarked=true; s.viewState.pageIndex=2; const value=parseBackupJson(JSON.stringify(snapshotToBackup(s))); assert.equal(value.includesPdf,false); assert.equal(value.notes[0].isBookmarked,true); assert.equal(value.viewState.pageIndex,2); assert.equal(value.notes[0].delta.ops[0].insert,'Notiz\n'); });
test('snapshot contains latest unsaved in-memory note independently of later edits', () => { const s=snapshot(); const b=snapshotToBackup(s); s.notes[0].delta.ops[0].insert='AFTER\n'; assert.equal(b.notes[0].delta.ops[0].insert,'Notiz\n'); });
for(const [label,modify] of Object.entries({ future:b=>b.schemaVersion=999, otherFormat:b=>b.format='other', duplicate:b=>b.notes.push(structuredClone(b.notes[0])), negative:b=>b.notes[0].pageIndex=-1, outOfRange:b=>b.notes[0].pageIndex=3, wrongType:b=>b.notes[0].isBookmarked='yes', hash:b=>b.document.pdfSha256='not-a-hash', date:b=>b.exportedAt='yesterday', zoom:b=>b.viewState.zoom=NaN, hiddenPdf:b=>b.pdfBase64='UERG', embed:b=>b.notes[0].delta.ops=[{insert:{video:'x'}}], unknownAttribute:b=>b.notes[0].delta.ops[0].attributes={script:'x'}, excessiveSize:b=>b.document.fileSize=151*1024*1024 })) {
  test('invalid backup rejected: '+label,()=>{const b=valid();modify(b);assert.throws(()=>parseBackup(b));});
}
test('malformed JSON and dangerous nested object keys are rejected',()=>{for(const text of ['{oops', '{"constructor":{}}', '{"format":"skriptstudio-project","notes":[{"__proto__":{}}]}']) assert.throws(()=>parseBackupJson(text)); assert.equal({}.polluted,undefined);});
test('full backup verifies base64 length before PDF parser stage',()=>{ const b=valid();b.includesPdf=true;b.pdfBase64='UERG';assert.equal(parseBackup(b).pdfBase64,'UERG'); b.pdfBase64='UERG!';assert.throws(()=>parseBackup(b));b.pdfBase64='UA==';assert.throws(()=>parseBackup(b)); });
test('binary roundtrip across base64 chunk boundaries',async()=>{const bytes=Uint8Array.from({length:70003},(_,i)=>i%251); const b64=bytesToBase64(bytes);assert.deepEqual(base64ToBytes(b64),bytes);});
test('SHA256 identifies bytes, not names',async()=>{assert.equal(await sha256(new Blob(['abc'])),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');assert.notEqual(await sha256(new Blob(['abc'])),await sha256(new Blob(['abd'])));});
test('download filename never keeps unsafe path or unmodified original name',()=>{const name=safeFilename('../../A:B? .pdf','mit_Notizen');assert.match(name,/mit_Notizen_\d{4}-\d{2}-\d{2}$/);assert.doesNotMatch(name,/[/:?]/);});
