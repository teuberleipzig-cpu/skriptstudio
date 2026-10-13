const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, mkdir, writeFile, readFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
async function sample(run) {
  const directory = await mkdtemp(join(tmpdir(), 'skriptstudio-pwa-'));
  try {
    await mkdir(join(directory, 'assets')); await writeFile(join(directory, 'index.html'), '<h1>Test shell</h1>');
    await writeFile(join(directory, 'assets', 'lazy-export.js'), 'export const ready=true;');
    await writeFile(join(directory, 'assets', 'pdf.worker.mjs'), 'self.onmessage=()=>{};');
    const { buildPwa } = await import('../../scripts/build-pwa.mjs'); return await run(directory, buildPwa);
  } finally { await rm(directory, { recursive: true, force: true }); }
}
test('PWA-Build inventarisiert auch erst später benötigte Module unter dem echten Unterpfad', () => sample(async (dir, build) => {
  const result = await build(dir, '/skriptstudio/');
  assert.deepEqual(result.resources, ['/skriptstudio/assets/lazy-export.js', '/skriptstudio/assets/pdf.worker.mjs', '/skriptstudio/index.html']);
  assert.equal(result.base, '/skriptstudio/');
}));
test('PWA-Build ist deterministisch und nimmt vorherige generierte Manifeste nicht erneut auf', () => sample(async (dir, build) => {
  const first = await build(dir, '/skriptstudio/'), source = await readFile(join(dir, 'sw.js'), 'utf8');
  assert.deepEqual(await build(dir, '/skriptstudio/'), first);
  assert.equal(await readFile(join(dir, 'sw.js'), 'utf8'), source);
}));
test('Änderung einer Ressource ändert die Cacheversion', () => sample(async (dir, build) => {
  const first = await build(dir, '/skriptstudio/'); await writeFile(join(dir, 'assets', 'lazy-export.js'), 'export const changed=true;');
  assert.notEqual((await build(dir, '/skriptstudio/')).cacheName, first.cacheName);
}));
test('Verschiedene App-Unterpfade erhalten unterschiedliche Cachepräfixe', () => sample(async (dir, build) => {
  const a = await build(dir, '/skriptstudio/'), b = await build(dir, '/isolated/');
  assert.notEqual(a.cacheName.split('-').slice(0, 3).join('-'), b.cacheName.split('-').slice(0, 3).join('-'));
}));
test('Generierter Service Worker besteht einen echten Node-JavaScript-Syntaxcheck', () => sample(async (dir, build) => {
  await build(dir, '/'); execFileSync(process.execPath, ['--check', join(dir, 'sw.js')]);
}));
test('Ungültige Base-URLs und Builds ohne index.html werden abgewiesen', () => sample(async (dir, build) => {
  await assert.rejects(build(dir, 'https://external.example/')); await assert.rejects(build(dir, '/without-slash'));
  await rm(join(dir, 'index.html')); await assert.rejects(build(dir, '/skriptstudio/'));
}));
test('Offline-Generator enthält keinen erzwungenen skipWaiting-Aufruf und keinen globalen Cache-Clear', () => sample(async (dir, build) => {
  await build(dir, '/skriptstudio/'); const code = await readFile(join(dir, 'sw.js'), 'utf8');
  assert.doesNotMatch(code, /skipWaiting\s*\(/); assert.match(code, /key\.startsWith\(PREFIX\)/);
  assert.match(code, /SKRIPTSTUDIO_INCOMPLETE/); assert.match(code, /if\(request\.method!==['"]GET['"]/);
}));
