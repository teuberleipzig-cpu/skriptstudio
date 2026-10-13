export async function sha256(blob: Blob): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export function bytesToBase64(bytes: Uint8Array): string {
  // Chunks must be multiples of three; avoids spreading a large array on the call stack.
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 24576) {
    let binary = ''; const end = Math.min(i + 24576, bytes.length);
    for (let j = i; j < end; j++) binary += String.fromCharCode(bytes[j]!);
    chunks.push(btoa(binary));
  }
  return chunks.join('');
}
export function base64ToBytes(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
export function safeFilename(name: string, suffix: string): string {
  const clean = name.replace(/\.pdf$/iu, '').replace(/[\u0000-\u001f<>:"/\\|?*]/gu, '_').replace(/[. ]+$/u, '').slice(0, 110) || 'Skript';
  const date = new Date().toISOString().slice(0, 10);
  return `${clean}_${suffix}_${date}`;
}
export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
