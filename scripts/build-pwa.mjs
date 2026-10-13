import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { basePath } from './base-path.mjs';
async function walk(dir) { const paths=[]; for(const f of await readdir(dir,{withFileTypes:true})){const p=join(dir,f.name);if(f.isDirectory())paths.push(...await walk(p));else if(f.isFile())paths.push(p);}return paths.sort(); }
export async function buildPwa(dist='dist',base=basePath()) {
  base=basePath(base);const root=resolve(dist);
  await stat(join(root,'index.html'));
  const files=(await walk(root)).filter(p=>!['sw.js','precache-manifest.json'].includes(relative(root,p)));
  const digest=createHash('sha256');const resources=[];
  for(const file of files) { const path=relative(root,file).replaceAll('\\','/'); const bytes=await readFile(file); digest.update(path).update(bytes);resources.push(base+path); }
  const version=digest.digest('hex').slice(0,20);
  const prefix='skriptstudio-shell-'+createHash('sha256').update(base).digest('hex').slice(0,10)+'-';
  const cacheName=prefix+version;
  const code=`/* Generated from the actual dist files. Do not edit. No user data is included. */
const CACHE=${JSON.stringify(cacheName)}, PREFIX=${JSON.stringify(prefix)}, BASE=${JSON.stringify(base)}, RESOURCES=${JSON.stringify(resources)};
const allowed=new Set(RESOURCES.map(path=>new URL(path,self.location.origin).href));
self.addEventListener('install', event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try { for(let i=0;i<RESOURCES.length;i+=8) await cache.addAll(RESOURCES.slice(i,i+8).map(url=>new Request(url,{cache:'reload'}))); }
  catch(error) { await caches.delete(CACHE); throw error; }
  // No skipWaiting: an editing tab must never be replaced automatically.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys()) if(key.startsWith(PREFIX)&&key!==CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{
  if(event.data!=='SKRIPTSTUDIO_CHECK') return;
  event.waitUntil((async()=>{
    try { const cache=await caches.open(CACHE);const complete=(await Promise.all(RESOURCES.map(url=>cache.match(url)))).every(Boolean);event.ports[0]?.postMessage(complete?'SKRIPTSTUDIO_READY':'SKRIPTSTUDIO_INCOMPLETE'); }
    catch { event.ports[0]?.postMessage('SKRIPTSTUDIO_INCOMPLETE'); }
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE)) return;
  if(request.mode==='navigate'&&(url.pathname===BASE||url.pathname===BASE+'index.html')) {
    event.respondWith((async()=>{ const cache=await caches.open(CACHE);return await cache.match(BASE+'index.html') || fetch(request); })());return;
  }
  if(!allowed.has(request.url)) return;
  // Runtime requests do not add files to the app cache, especially no documents or notes.
  event.respondWith((async()=>{ const cache=await caches.open(CACHE);return await cache.match(request) || fetch(request); })());
});
`;
  await writeFile(join(root,'sw.js'),code);
  await writeFile(join(root,'precache-manifest.json'),JSON.stringify({version,base,cacheName,resources},null,2)+'\n');
  return {version,base,cacheName,resources};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) console.log(await buildPwa());
