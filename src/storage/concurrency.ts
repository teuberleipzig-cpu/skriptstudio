export interface DocumentLock { writable: boolean; fallback: boolean; release: () => void }
const PREFIX = 'skriptstudio:document:';
export async function acquireDocumentLock(id: string): Promise<DocumentLock> {
  if (typeof navigator === 'undefined' || !navigator.locks) return { writable: true, fallback: true, release: () => undefined };
  return new Promise<DocumentLock>((resolve, reject) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>(done => { release = done; });
    void navigator.locks.request(PREFIX + id, { mode: 'exclusive', ifAvailable: true }, async lock => {
      resolve({ writable: !!lock, fallback: false, release });
      if (lock) await held;
    }).catch(reject);
  });
}
export class ChangeChannel {
  private channel?: BroadcastChannel;
  constructor(onChange: (id: string) => void) {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('skriptstudio:changes:v1');
      this.channel.onmessage = (event: MessageEvent<unknown>) => {
        const data = event.data;
        if (typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'string' && data.id.length <= 128) onChange(data.id);
      };
    }
  }
  notify(id: string): void { this.channel?.postMessage({ id }); }
  close(): void { this.channel?.close(); }
}
