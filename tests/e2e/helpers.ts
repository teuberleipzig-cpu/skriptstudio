import { expect, type Page, type Download } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export const fixture = (name = 'mixed.pdf') => resolve('tests/fixtures', name);
export async function openPdf(page: Page, name = 'mixed.pdf') {
  await page.goto(''); await page.getByLabel('PDF-Datei', { exact: true }).setInputFiles(fixture(name));
  await expect(page.locator('.pdf-page canvas')).toBeVisible();
  await expect(page.locator('.ql-editor')).toBeVisible();
}
export async function goPage(page: Page, number: number) {
  await page.getByLabel('Seitenzahl', { exact: true }).fill(String(number));
  await page.getByLabel('Seitenzahl', { exact: true }).press('Enter');
  await expect(page.locator('.ql-editor')).toHaveAttribute('aria-label', `Notizen zu Seite ${number}`);
}
export async function write(page: Page, text: string) { await page.locator('.ql-editor').fill(text); }
export async function saved(page: Page) { await expect(page.locator('.save-status')).toContainText(/Gespeichert um/); }
export async function bytes(download: Download): Promise<Buffer> {
  const path = await download.path(); if (!path) throw new Error('Kein lokaler Downloadpfad.'); return readFile(path);
}
export async function downloadBackup(page: Page, full = true) {
  await page.getByRole('button', { name: 'Backup', exact: true }).click();
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: full ? /^Vollständiges Projektbackup/ : /^Nur Notizen sichern/ }).click();
  const data = await bytes(await promise);
  await page.getByRole('button', { name: 'Dialog schließen' }).click();
  return data;
}
