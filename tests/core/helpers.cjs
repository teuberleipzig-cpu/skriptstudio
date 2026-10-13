const { emptyNote, defaultView } = require('../../.core-build/types/models.js');
const document = { id: 'project-a', pdfSha256: 'a'.repeat(64), originalFilename: 'Vorlesung.pdf', displayName: 'Vorlesung', fileSize: 3, pageCount: 3, createdAt: 1, updatedAt: 2, lastOpenedAt: 2 };
const note = (page = 0, revision = 1, text = 'Notiz', id = 'project-a') => ({ ...emptyNote(id, page), delta: { ops: [{ insert: text + '\n' }] }, plainText: text + '\n', revision, updatedAt: revision });
const snapshot = () => ({ document: structuredClone(document), notes: [note()], viewState: defaultView(), asset: { sha256: document.pdfSha256, blob: new Blob(['PDF']), byteLength: 3, createdAt: 1 } });
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
module.exports = { document, note, snapshot, deferred, sleep };
