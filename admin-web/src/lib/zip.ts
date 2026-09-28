// Minimal, dependency-free ZIP writer (STORE method — no compression).
//
// Product photos are already-compressed JPEG/PNG, so there is nothing to gain
// from deflating them; storing them verbatim keeps this tiny and avoids pulling
// in a zip library (and re-bloating the committed admin bundle). Enough to let
// the operator download a batch of photos as one .zip straight from the browser.

export interface ZipEntry {
  name: string; // path inside the zip, e.g. "Color-CZ/excele__garnet__marquise.jpg"
  data: Uint8Array;
}

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

const u16 = (n: number) => new Uint8Array([n & 255, (n >>> 8) & 255]);
const u32 = (n: number) =>
  new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);

function concat(parts: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Build a .zip Blob from the given entries (stored, uncompressed). */
export function makeZip(entries: ZipEntry[]): Blob {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data);
    const size = e.data.length;

    // Local file header. Flag bit 11 (0x0800) marks the name as UTF-8.
    const lfh = concat([
      u32(0x04034b50),
      u16(20), // version needed
      u16(0x0800), // general purpose flag: UTF-8 filename
      u16(0), // method: 0 = store
      u16(0),
      u16(0), // mod time / date
      u32(crc),
      u32(size), // compressed size
      u32(size), // uncompressed size
      u16(nameBytes.length),
      u16(0), // extra field length
      nameBytes,
    ]);
    chunks.push(lfh, e.data);

    // Central directory record for this entry.
    const cdr = concat([
      u32(0x02014b50),
      u16(20), // version made by
      u16(20), // version needed
      u16(0x0800), // flag: UTF-8
      u16(0), // method: store
      u16(0),
      u16(0), // mod time / date
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0), // extra
      u16(0), // comment
      u16(0), // disk number
      u16(0), // internal attrs
      u32(0), // external attrs
      u32(offset), // local header offset
      nameBytes,
    ]);
    central.push(cdr);

    offset += lfh.length + e.data.length;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const c of central) {
    chunks.push(c);
    cdSize += c.length;
  }

  const eocd = concat([
    u32(0x06054b50),
    u16(0),
    u16(0), // disk numbers
    u16(central.length),
    u16(central.length),
    u32(cdSize),
    u32(cdStart),
    u16(0), // comment length
  ]);
  chunks.push(eocd);

  return new Blob(chunks as BlobPart[], { type: 'application/zip' });
}
