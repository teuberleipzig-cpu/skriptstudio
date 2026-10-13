import { test, expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { openPdf, goPage, write, bytes, downloadBackup, fixture } from './helpers';
test('Vollbackup unmittelbar nach Eingabe in einem frischen Browserprofil wiederherstellen', async ({ page, browser }) => {
  await openPdf(page); await write(page, 'Letzte Eingabe α β μ σ Δ ≤ ≥ ± ² → äöüß');
  await page.getByLabel('Lesezeichen setzen oder entfernen').click();
  const backup = await downloadBackup(page);
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173/skriptstudio/' });
  try {
    const fresh = await context.newPage(); await fresh.goto(''); await fresh.getByRole('button', { name: 'Backup', exact: true }).click();
    await fresh.getByLabel('Backup-Datei', { exact: true }).setInputFiles({ name: 'restore.json', mimeType: 'application/json', buffer: backup });
    await fresh.getByRole('button', { name: 'Als neue Projektkopie importieren' }).click();
    await expect(fresh.locator('.ql-editor')).toContainText('Letzte Eingabe α β μ σ Δ ≤ ≥ ± ² → äöüß');
    await expect(fresh.getByLabel('Lesezeichen setzen oder entfernen')).toHaveAttribute('aria-pressed', 'true');
  } finally { await context.close(); }
});
test('Notizenbackup verlangt das identische Original und ein ungültiges Backup entfernt die vorherige Vorschau', async ({ page, browser }) => {
  await openPdf(page); await write(page, 'Notizen ohne PDF'); const backup = await downloadBackup(page, false);
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173/skriptstudio/' });
  try {
    const fresh = await context.newPage(); await fresh.goto(''); await fresh.getByRole('button', { name: 'Backup', exact: true }).click();
    await fresh.getByLabel('Backup-Datei', { exact: true }).setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: backup });
    await fresh.getByLabel('Original-PDF für Backup').setInputFiles(fixture('different.pdf'));
    // Disabled is also the initial state. Wait for the actual parser/hash rejection.
    await expect(fresh.locator('.notice-box')).toContainText('stimmt nicht mit diesem Backup überein');
    await expect(fresh.getByLabel('Original-PDF für Backup')).toBeEnabled();
    await expect(fresh.getByRole('button', { name: 'Als neue Projektkopie importieren' })).toBeDisabled();
    await fresh.getByLabel('Original-PDF für Backup').setInputFiles(fixture());
    await expect(fresh.getByRole('button', { name: 'Als neue Projektkopie importieren' })).toBeEnabled();
    await fresh.getByLabel('Backup-Datei', { exact: true }).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
    await expect(fresh.getByRole('button', { name: 'Als neue Projektkopie importieren' })).toHaveCount(0);
  } finally { await context.close(); }
});
for (const omit of [true, false]) test(`PDF-Ausgabe: Reihenfolge, Text und Leeroption ${omit}`, async ({ page }) => {
  await openPdf(page); await write(page, 'NOTIZ_EINS äöüß α β μ σ Δ ≤ ≥ ± ² →');
  await goPage(page, 2); await write(page, 'NOTIZ_ZWEI');
  await page.getByRole('button', { name: 'PDF exportieren', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Leere Notizseiten auslassen' }).setChecked(omit);
  const downloading = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDF erstellen' }).click();
  const downloaded = await downloading; await downloaded.saveAs(`test-results/export-omit-${omit}.pdf`);
  const pdf = await bytes(downloaded), parsed = await PDFDocument.load(pdf);
  expect(parsed.getPageCount()).toBe(omit ? 5 : 6);
  expect(parsed.getPage(0).getSize()).toEqual({ width: 960, height: 540 });
  expect(parsed.getPage(4).getRotation().angle).toBe(90);
  await page.getByRole('button', { name: 'Dialog schließen' }).click();
  await page.getByLabel('PDF-Datei', { exact: true }).setInputFiles({ name: 'Ergebnis.pdf', mimeType: 'application/pdf', buffer: pdf });
  await expect(page.getByRole('button', { name: '＋ PDF öffnen', exact: true })).toBeEnabled();
  for (const [number, text] of [[1, 'ORIGINAL 1'], [2, 'NOTIZ_EINS'], [3, 'ORIGINAL 2'], [4, 'NOTIZ_ZWEI'], [5, 'ORIGINAL 3']] as const) {
    await goPage(page, number); await expect(page.locator('.textLayer')).toContainText(text);
  }
  await goPage(page, 2); await expect(page.locator('.textLayer')).toContainText('→');
  await page.screenshot({ path: `test-results/export-omit-${omit}.png`, fullPage: true });
});
test('Sehr lange Notiz bleibt bis zum Endmarker auf mehr als drei echten Textseiten erhalten', async ({ page }) => {
  await openPdf(page);
  await write(page, 'NOTIZ_START\n' + ('Ein langer Absatz mit äöüß und Statistik α β σ. '.repeat(18) + '\n').repeat(100) + 'NOTIZ_ENDE');
  await page.getByRole('button', { name: 'PDF exportieren', exact: true }).click();
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDF erstellen' }).click();
  const downloaded = await pending; await downloaded.saveAs('test-results/export-long.pdf');
  const pdf = await bytes(downloaded), count = (await PDFDocument.load(pdf)).getPageCount(); expect(count).toBeGreaterThan(6);
  await page.getByRole('button', { name: 'Dialog schließen' }).click();
  await page.getByLabel('PDF-Datei', { exact: true }).setInputFiles({ name: 'Langexport.pdf', mimeType: 'application/pdf', buffer: pdf });
  await expect(page.getByRole('button', { name: '＋ PDF öffnen', exact: true })).toBeEnabled();
  await goPage(page, 2); await expect(page.locator('.textLayer')).toContainText('NOTIZ_START');
  await goPage(page, count - 2); await expect(page.locator('.textLayer')).toContainText('NOTIZ_ENDE');
  await goPage(page, count - 1); await expect(page.locator('.textLayer')).toContainText('ORIGINAL 2');
});
