import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { db, SkriptDatabase } from '../../src/storage/db';
import * as repo from '../../src/storage/repositories';
import { emptyNote, type PdfAsset } from '../../src/types/models';
import { snapshotToBackup } from '../../src/features/backup/backupSchema';
import { ConflictError } from '../../src/storage/saveQueue';
function asset(hash = 'a'): PdfAsset { return { sha256: hash.repeat(64), blob: new Blob(['PDF']), byteLength: 3, createdAt: 1 }; }
beforeEach(async () => { await db.delete(); await db.open(); });
afterAll(async () => { await db.delete(); });
describe('Reale Dexie-Repository-Funktionen mit fake-indexeddb', () => {
  it('erkennt identische Bytes, aber keine Dateinamenidentität', async () => {
    const a = await repo.insertProject(asset(), 'Gleich.pdf', 3);
    expect((await repo.insertProject(asset(), 'Umbenannt.pdf', 3)).id).toBe(a.id);
    expect((await repo.insertProject(asset('b'), 'Gleich.pdf', 3)).id).not.toBe(a.id);
    expect(await db.documents.count()).toBe(2);
  });
  it('bindet Seiten getrennt, prüft Revisionen und schreibt den PDF-Blob nicht neu', async () => {
    const project = await repo.insertProject(asset(), 'Notizen.pdf', 3);
    const initialAsset = await db.pdfAssets.get(project.pdfSha256);
    for (const page of [0, 1, 2]) await repo.writeNote({ ...emptyNote(project.id, page), revision: 1, updatedAt: 10, delta: { ops: [{ insert: `Seite ${page}\n` }] } }, 0);
    const read = await repo.readProject(project.id);
    expect(read.notes.map(n => n.plainText)).toEqual(['Seite 0\n', 'Seite 1\n', 'Seite 2\n']);
    const after = await db.pdfAssets.get(project.pdfSha256);
    expect(after?.createdAt).toBe(initialAsset?.createdAt);
    expect(await after?.blob.text()).toBe(await initialAsset?.blob.text());
  });
  it('bewahrt bei einem Konflikt lokale und bestätigte Inhalte in einer eigenen Transaktion', async () => {
    const project = await repo.insertProject(asset(), 'Konflikt.pdf', 3);
    const remote = { ...emptyNote(project.id, 0), revision: 1, delta: { ops: [{ insert: 'Remote\n' }] } };
    await repo.writeNote(remote, 0);
    const local = { ...remote, delta: { ops: [{ insert: 'Local\n' }] } };
    await expect(repo.writeNote(local, 0)).rejects.toBeInstanceOf(ConflictError);
    expect((await db.notes.get([project.id, 0]))?.delta).toEqual(remote.delta);
    const recovery = await db.recoveries.toCollection().first();
    expect(recovery?.local.delta).toEqual(local.delta);
    expect(recovery?.remote?.delta).toEqual(remote.delta);
  });
  it('erzeugt unabhängige Wiederherstellungskopien und löscht gemeinsam verwendete Assets erst zuletzt', async () => {
    const project = await repo.insertProject(asset(), 'Kopie.pdf', 3);
    await repo.writeNote({ ...emptyNote(project.id, 0), revision: 1, delta: { ops: [{ insert: 'Erhalten\n' }] }, isBookmarked: true }, 0);
    const original = await repo.readProject(project.id);
    const copy = await repo.restoreCopy(snapshotToBackup(original), original.asset);
    expect(copy.id).not.toBe(project.id);
    expect((await repo.readProject(copy.id)).notes[0]?.isBookmarked).toBe(true);
    expect(await db.pdfAssets.count()).toBe(1);
    await repo.deleteProject(project.id, original.document.updatedAt);
    expect(await db.pdfAssets.count()).toBe(1);
    await repo.deleteProject(copy.id, copy.updatedAt);
    expect(await db.pdfAssets.count()).toBe(0);
  });
  it('rollt einen Import bei fehlgeschlagenem Notizschreiben vollständig zurück', async () => {
    const project = await repo.insertProject(asset(), 'Atomar.pdf', 3);
    const snapshot = await repo.readProject(project.id);
    snapshot.notes = [{ ...emptyNote(project.id, 0), revision: 1 }];
    const fail = () => { throw new DOMException('Quota simulated', 'QuotaExceededError'); };
    db.notes.hook('creating', fail);
    try { await expect(repo.restoreCopy(snapshotToBackup(snapshot), snapshot.asset)).rejects.toBeDefined(); }
    finally { db.notes.hook('creating').unsubscribe(fail); }
    expect(await db.documents.count()).toBe(1);
    expect(await db.notes.count()).toBe(0);
    expect((await db.settings.get('lastDocumentId'))?.value).toBe(project.id);
  });
  it('schützt vor Löschung nach zwischenzeitlicher Änderung und erhält Identität beim Umbenennen', async () => {
    const project = await repo.insertProject(asset(), 'Name.pdf', 3);
    await repo.renameProject(project.id, 'Neuer Name');
    await expect(repo.deleteProject(project.id, project.updatedAt)).rejects.toThrow('inzwischen');
    const read = await repo.readProject(project.id);
    expect(read.document.pdfSha256).toBe(project.pdfSha256);
    expect(read.document.originalFilename).toBe('Name.pdf');
    expect(read.document.displayName).toBe('Neuer Name');
  });
  it('erhält Notizen beim echten Upgrade von Schema 1 auf 2', async () => {
    const name = 'skriptstudio-test-migration-' + crypto.randomUUID();
    const legacy = new Dexie(name);
    legacy.version(1).stores({ documents: 'id,pdfSha256,lastOpenedAt', pdfAssets: 'sha256', notes: '[documentId+pageIndex],documentId', sessions: 'documentId', settings: 'key' });
    await legacy.open();
    await legacy.table('notes').put({ ...emptyNote('legacy', 0), revision: 1, delta: { ops: [{ insert: 'Erhalten\n' }] }, plainText: 'Veraltet' });
    legacy.close();
    const migrated = new SkriptDatabase(name);
    try { await migrated.open(); expect((await migrated.notes.get(['legacy', 0]))?.plainText).toBe('Erhalten\n'); expect(migrated.verno).toBe(2); }
    finally { await migrated.delete(); }
  });
});
