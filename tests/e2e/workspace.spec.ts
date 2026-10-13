import { test, expect } from '@playwright/test';
import { openPdf, goPage, write, saved, fixture } from './helpers';
test('Kernablauf: schnelle Seitenwechsel, Reload und unverwechselbare Seitenbindung', async ({ page }) => {
  const failures: string[] = []; page.on('pageerror', error => failures.push(error.message));
  await openPdf(page);
  for (const number of [1, 2, 3]) { await goPage(page, number); await write(page, `Eindeutige Notiz ${number}`); }
  await goPage(page, 1); await expect(page.locator('.ql-editor')).toContainText('Eindeutige Notiz 1');
  await saved(page); await page.reload(); await expect(page.locator('.ql-editor')).toContainText('Eindeutige Notiz 1');
  for (const number of [2, 3]) { await goPage(page, number); await expect(page.locator('.ql-editor')).toContainText(`Eindeutige Notiz ${number}`); }
  await expect(page.getByRole('button', { name: 'Nächste Seite', exact: true })).toBeDisabled();
  await page.getByLabel('Seitenzahl', { exact: true }).fill('0'); await page.getByLabel('Seitenzahl', { exact: true }).press('Enter');
  await expect(page.locator('.ql-editor')).toHaveAttribute('aria-label', 'Notizen zu Seite 3');
  expect(failures).toEqual([]);
});
test('Gleiches PDF unter anderem Namen erkennt den Stand; gleichnamige andere Bytes nicht', async ({ page }) => {
  await openPdf(page); await write(page, 'Mein erster Stand'); await saved(page);
  const original = await import('node:fs/promises').then(fs => fs.readFile(fixture()));
  await page.getByLabel('PDF-Datei', { exact: true }).setInputFiles({ name: 'Anders.pdf', mimeType: 'application/pdf', buffer: original });
  // Existing text alone is no completion signal: it is already present during import.
  await expect(page.getByRole('button', { name: '＋ PDF öffnen', exact: true })).toBeEnabled();
  await expect(page.locator('.ql-editor')).toContainText('Mein erster Stand');
  const different = await import('node:fs/promises').then(fs => fs.readFile(fixture('different.pdf')));
  await page.getByLabel('PDF-Datei', { exact: true }).setInputFiles({ name: 'mixed.pdf', mimeType: 'application/pdf', buffer: different });
  await expect(page.getByRole('button', { name: '＋ PDF öffnen', exact: true })).toBeEnabled();
  await expect(page.locator('.textLayer')).toContainText('Different ORIGINAL 1');
  await expect(page.locator('.ql-editor')).not.toContainText('Mein erster Stand');
});
test('Abgelehnte PDF-Dateien lassen das geöffnete Projekt unangetastet', async ({ page }) => {
  await openPdf(page); await write(page, 'Nicht verlieren'); await saved(page);
  for (const bad of ['empty.pdf', 'corrupt.pdf', 'not-pdf.pdf']) {
    await page.getByLabel('PDF-Datei', { exact: true }).setInputFiles(fixture(bad));
    await expect(page.getByRole('button', { name: '＋ PDF öffnen', exact: true })).toBeEnabled();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.locator('.ql-editor')).toContainText('Nicht verlieren');
  }
});
test('Zweiter Tab liest; nach Schließen des Schreib-Tabs lässt sich die Bearbeitung übernehmen', async ({ context, page }) => {
  await openPdf(page); await write(page, 'Gemeinsamer bestätigter Stand'); await saved(page);
  const second = await context.newPage(); await second.goto('');
  await expect(second.locator('.notice-bar').filter({ hasText: 'Schreibgeschützt:' })).toBeVisible();
  await expect(second.locator('.ql-editor')).toHaveAttribute('contenteditable', 'false');
  await page.close(); await second.getByRole('button', { name: 'Bearbeitung übernehmen' }).click();
  await expect(second.locator('.ql-editor')).toHaveAttribute('contenteditable', 'true');
  await write(second, 'Übernommen'); await saved(second);
});
for (const width of [1440, 1024, 768, 390]) test(`Bedienbarer Arbeitsbereich bei ${width} px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto('');
  await page.getByLabel('PDF-Datei', { exact: true }).setInputFiles(fixture());
  await expect(page.locator('.pdf-page canvas')).toBeVisible();
  if (width < 760) await page.getByRole('button', { name: 'Notizen', exact: true }).click();
  await expect(page.locator('.ql-editor')).toBeVisible(); await write(page, 'Responsive Notiz');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/workspace-${width}.png`, fullPage: true });
});
test('300-seitiges und bildlastiges synthetisches Skript öffnen', async ({ page }) => {
  await openPdf(page, 'long-300.pdf'); await goPage(page, 300); await expect(page.locator('.textLayer')).toContainText('ORIGINAL 300');
  await page.getByLabel('PDF-Datei', { exact: true }).setInputFiles(fixture('image-heavy.pdf'));
  await expect(page.locator('.textLayer')).toContainText('Images ORIGINAL 1'); await goPage(page, 32);
  await expect(page.locator('.pdf-page canvas')).toBeVisible();
});
