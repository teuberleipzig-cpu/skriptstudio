import { deflateSync } from 'node:zlib';
function crc32(bytes) { let n = 0xffffffff; for (const b of bytes) { n ^= b; for (let j=0;j<8;j++) n=(n>>>1)^((n&1)?0xedb88320:0); } return (n^0xffffffff)>>>0; }
function chunk(type, data) { const t=Buffer.from(type), len=Buffer.alloc(4), crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc]); }
/** Locally generated geometric app icon, no external image/font dependency. */
export function pngIcon(size) {
  const raw=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const rx=x/size,ry=y/size;const s=rx>.28&&rx<.72&&((ry>.24&&ry<.36)||(ry>.46&&ry<.56)||(ry>.66&&ry<.77)) || rx>.28&&rx<.40&&ry>.30&&ry<.53 || rx>.60&&rx<.72&&ry>.50&&ry<.71;
    const i=y*(size*4+1)+1+x*4;raw.set(s?[255,255,255,255]:[40,124,105,255],i);
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
