import Dexie, { type Table } from 'dexie';
import type { Note, PdfAsset, Project, Recovery, Session } from '../types/models';
import { parseDelta, plainText } from '../features/notes/delta';
export class SkriptDatabase extends Dexie {
  documents!: Table<Project, string>;
  pdfAssets!: Table<PdfAsset, string>;
  notes!: Table<Note, [string, number]>;
  sessions!: Table<Session, string>;
  settings!: Table<{ key: string; value: string }, string>;
  recoveries!: Table<Recovery, number>;
  constructor(name = 'skriptstudio-workspace') {
    super(name);
    const stores = { documents: 'id,pdfSha256,lastOpenedAt', pdfAssets: 'sha256', notes: '[documentId+pageIndex],documentId', sessions: 'documentId', settings: 'key' };
    this.version(1).stores(stores);
    this.version(2).stores({ ...stores, recoveries: '++id,documentId,createdAt' }).upgrade(async tx => {
      // Additive migration. Invalid legacy content aborts instead of deleting or replacing it.
      await tx.table<Note>('notes').toCollection().modify(note => { note.delta = parseDelta(note.delta); note.plainText = plainText(note.delta); });
    });
  }
}
export const db = new SkriptDatabase();
