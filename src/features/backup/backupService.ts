import { db } from '../../storage/db';
import { preparePdf } from '../pdf/pdfService';
import { base64ToBytes, bytesToBase64 } from '../../utils/binary';
import { LIMITS, type PdfAsset, type Snapshot } from '../../types/models';
import { parseBackupJson, snapshotToBackup, type Backup } from './backupSchema';
export interface RestorePlan { backup: Backup; asset?: PdfAsset; matchingProjects: number }
export async function exportBackup(snapshot: Snapshot, includePdf: boolean): Promise<Blob> {
  const backup = snapshotToBackup(snapshot);
  if (includePdf) {
    backup.includesPdf = true;
    backup.pdfBase64 = bytesToBase64(new Uint8Array(await snapshot.asset.blob.arrayBuffer()));
  }
  const result = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  if (result.size > LIMITS.backupBytes) throw new Error('Dieses Vollbackup ist zu groß. Bitte ein Notizen-Backup und das Original-PDF getrennt sichern.');
  return result;
}
export async function inspectBackup(file: File): Promise<RestorePlan> {
  if (file.size > LIMITS.backupBytes) throw new Error('Backup größer als 280 MiB.');
  const backup = parseBackupJson(await file.text());
  const existing = await db.pdfAssets.get(backup.document.pdfSha256);
  const plan: RestorePlan = { backup, matchingProjects: await db.documents.where('pdfSha256').equals(backup.document.pdfSha256).count() };
  const blob = backup.includesPdf ? new Blob([base64ToBytes(backup.pdfBase64!)], { type: 'application/pdf' }) : existing?.blob;
  if (blob) plan.asset = await validateOriginal(backup, blob);
  return plan;
}
export async function validateOriginal(backup: Backup, blob: Blob): Promise<PdfAsset> {
  const prepared = await preparePdf(blob);
  if (prepared.asset.sha256 !== backup.document.pdfSha256 || prepared.pageCount !== backup.document.pageCount || prepared.asset.byteLength !== backup.document.fileSize) throw new Error('Das Original-PDF stimmt nicht mit diesem Backup überein. Dateiname oder Seitenzahl allein reichen nicht aus.');
  return prepared.asset;
}
