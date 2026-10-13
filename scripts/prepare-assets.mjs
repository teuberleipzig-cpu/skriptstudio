import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { basePath } from './base-path.mjs';
import { pngIcon } from './png-icon.mjs';
const require=createRequire(import.meta.url);
const pdfRoot=dirname(require.resolve('pdfjs-dist/package.json'));
const installed=JSON.parse(await readFile(join(pdfRoot,'package.json'),'utf8'));
const pkg=JSON.parse(await readFile('package.json','utf8'));
if(installed.version!==pkg.dependencies['pdfjs-dist']) throw new Error('PDF.js-Version stimmt nicht mit der festgelegten Version überein. npm ci ausführen.');
await mkdir('public',{recursive:true});
// Delete only our generated PDF.js folder, never an unrelated origin resource.
await rm('public/pdfjs',{recursive:true,force:true});
for(const folder of ['cmaps','standard_fonts','wasm']) await cp(join(pdfRoot,folder),join('public/pdfjs',folder),{recursive:true});
await writeFile('public/icon-192.png',pngIcon(192));await writeFile('public/icon-512.png',pngIcon(512));
const base=basePath();
await writeFile('public/manifest.webmanifest',JSON.stringify({id:base,name:'SkriptStudio',short_name:'SkriptStudio',description:'Lokale PDF-Notizen für dein Studium',lang:'de',start_url:base,scope:base,display:'standalone',background_color:'#f3f5f4',theme_color:'#287c69',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},null,2)+'\n');
console.log(`PDF.js ${installed.version}: CMaps, Standardfonts und WASM lokal vorbereitet. Basis ${base}`);
