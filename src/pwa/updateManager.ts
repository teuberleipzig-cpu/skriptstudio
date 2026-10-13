export interface PwaState { state: 'online-only' | 'preparing' | 'ready' | 'failed'; updateAvailable: boolean; message: string }
export function watchPwa(notify: (state: PwaState) => void): () => void {
  let disposed = false;
  const subscriptions: (() => void)[] = [];
  const state: PwaState = { state: 'online-only', updateAvailable: false, message: 'Online-Betrieb' };
  const emit = () => { if (!disposed) notify({ ...state }); };
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) { state.message = import.meta.env.PROD ? 'Offline-Funktion in diesem Browser nicht verfügbar.' : 'Offline-Prüfung ist nur im Produktionsbuild aktiv.'; emit(); return () => { disposed = true; }; }
  state.state = 'preparing'; state.message = 'Offline-Nutzung wird vorbereitet …'; emit();
  const fail = () => { state.state = 'failed'; state.message = 'Offline-Vorbereitung fehlgeschlagen. Online weiterarbeiten und später neu öffnen.'; emit(); };
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL, updateViaCache: 'none' }).then(async registration => {
    if (disposed) return;
    const check = async () => {
      if (disposed || !registration.active) return;
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); fail(); }, 15_000);
      channel.port1.onmessage = (event: MessageEvent<unknown>) => {
        clearTimeout(timeout); channel.port1.close();
        if (event.data === 'SKRIPTSTUDIO_READY') { state.state = 'ready'; state.message = 'Offline bereit'; emit(); } else fail();
      };
      registration.active.postMessage('SKRIPTSTUDIO_CHECK', [channel.port2]);
    };
    const updated = () => {
      if (registration.waiting) { state.updateAvailable = true; emit(); }
      const worker = registration.installing;
      if (worker) {
        const changed = () => { if (worker.state === 'activated') void check(); if (worker.state === 'installed' && registration.active) { state.updateAvailable = true; emit(); } if (worker.state === 'redundant' && !registration.active) fail(); };
        worker.addEventListener('statechange', changed); subscriptions.push(() => worker.removeEventListener('statechange', changed)); changed();
      }
    };
    registration.addEventListener('updatefound', updated); subscriptions.push(() => registration.removeEventListener('updatefound', updated));
    updated(); if (registration.active) await check();
    const controlled = () => { void check(); }; navigator.serviceWorker.addEventListener('controllerchange', controlled); subscriptions.push(() => navigator.serviceWorker.removeEventListener('controllerchange', controlled));
  }).catch(fail);
  return () => { disposed = true; subscriptions.forEach(cleanup => cleanup()); };
}
