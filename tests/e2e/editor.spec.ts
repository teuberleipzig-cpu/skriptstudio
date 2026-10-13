import { test, expect } from '@playwright/test';
import { openPdf, goPage, write, bytes, downloadBackup } from './helpers';
import { parseBackupJson } from '../../src/features/backup/backupSchema';
test('Toolbar-Auswahl, kombinierte Formate, Farben und getrennte Undo-Historie', async ({ page }) => {
  await openPdf(page); await write(page, 'FORMATE äöüß α β μ σ Δ ≤ ≥ ± ² →');
  await page.locator('.ql-editor').press('ControlOrMeta+A');
  for (const name of ['Fett', 'Kursiv', 'Unterstrichen', 'Durchgestrichen']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await page.getByLabel('Schriftfarbe', { exact: true }).fill('#123456');
  // Choose a new value: filling the already displayed default does not emit a change.
  await page.getByLabel('Text-Hintergrundfarbe').fill('#ffee88');
  await page.getByRole('button', { name: 'Blocksatz', exact: true }).click();
  const backup = parseBackupJson((await downloadBackup(page)).toString('utf8'));
  expect(backup.notes[0]?.delta.ops.some(op => op.attributes?.bold && op.attributes.italic && op.attributes.underline && op.attributes.strike && op.attributes.color === '#123456' && op.attributes.background === '#ffee88')).toBe(true);
  expect(backup.notes[0]?.delta.ops.some(op => op.attributes?.align === 'justify')).toBe(true);
  await page.getByRole('button', { name: 'PDF exportieren', exact: true }).click();
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'PDF erstellen' }).click();
  const downloaded = await pending; await downloaded.saveAs('test-results/export-formats.pdf');
  expect((await bytes(downloaded)).subarray(0, 5).toString()).toBe('%PDF-');
  await page.getByRole('button', { name: 'Dialog schließen' }).click();
  await goPage(page, 2); await write(page, 'Nur Seite zwei');
  await page.getByRole('button', { name: 'Rückgängig', exact: true }).click();
  await expect(page.locator('.ql-editor')).not.toContainText('Nur Seite zwei');
  await goPage(page, 1); await expect(page.locator('.ql-editor')).toContainText('FORMATE');
}
);
