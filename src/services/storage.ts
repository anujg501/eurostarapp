import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config';

// Object storage for admin-uploaded images (DigitalOcean Spaces, S3-compatible).
//
// Before this, images were kept as base64 data URLs inside Setting rows. That
// works, but the bytes then travel through the API on every catalogue sync and
// the database grows with each upload — a handful of product photos is megabytes
// of JSON on every page load. Here the bytes go to object storage and only a
// short URL is stored, so the app server never carries them again.

let client: S3Client | null = null;

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'us-east-1', // Spaces ignores this, but the SDK insists on one
      endpoint: `https://${config.spaces.region}.digitaloceanspaces.com`,
      credentials: {
        accessKeyId: config.spaces.key,
        secretAccessKey: config.spaces.secret,
      },
      forcePathStyle: false,
    });
  }
  return client;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

export const ALLOWED_IMAGE_MIME = Object.keys(EXT_BY_MIME);

/** Public URL for a stored object — the CDN base when set, else the origin. */
function publicUrl(key: string): string {
  const base =
    config.spaces.publicBase ||
    `https://${config.spaces.bucket}.${config.spaces.region}.digitaloceanspaces.com`;
  return `${base.replace(/\/+$/, '')}/${key}`;
}

/**
 * Store an image and return its public URL.
 *
 * `folder` groups objects (e.g. "product-images", "thumbs"). The filename is
 * randomised rather than taken from the upload: a caller-supplied name is a path
 * traversal risk and would also let one upload silently overwrite another.
 */
export async function putImage(
  buffer: Buffer,
  mime: string,
  folder = 'misc'
): Promise<{ url: string; key: string; bytes: number }> {
  if (!config.spaces.configured) throw new Error('Object storage is not configured');

  const ext = EXT_BY_MIME[mime] ?? '.bin';
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'misc';
  const key = path.posix.join(
    config.spaces.prefix,
    safeFolder,
    `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
  );

  await s3().send(
    new PutObjectCommand({
      Bucket: config.spaces.bucket,
      Key: key,
      Body: buffer,
      ContentType: mime,
      // Images are referenced by URL from the storefront, so they must be
      // readable without credentials. The random key is what keeps them
      // unguessable; nothing private is ever put here.
      ACL: 'public-read',
      // Content-addressed names never change, so they can be cached hard.
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return { url: publicUrl(key), key, bytes: buffer.length };
}

// --- Private documents (candidate CVs) --------------------------------------
// A CV is personal data belonging to a job applicant, so unlike product images
// these are never public-read and never handed out as a plain URL. They are
// stored under an unguessable key and can only be read back through an
// authenticated endpoint.

const DOC_EXT_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

export const ALLOWED_DOC_MIME = Object.keys(DOC_EXT_BY_MIME);
export const MAX_DOC_BYTES = 100 * 1024 * 1024; // the form promises "Max 100MB"

// Where private files live when object storage is not configured (local dev).
// Deliberately outside docs/, which is served statically — a CV must never be
// reachable by guessing a URL.
const LOCAL_DIR = path.join(process.cwd(), 'var', 'uploads');

/** Store a private document. Returns an opaque key, not a URL. */
export async function putPrivateFile(
  buffer: Buffer,
  mime: string,
  folder = 'docs'
): Promise<{ key: string; bytes: number }> {
  const ext = DOC_EXT_BY_MIME[mime] ?? '.bin';
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'docs';
  const name = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`;

  if (config.spaces.configured) {
    const key = path.posix.join(config.spaces.prefix, safeFolder, name);
    await s3().send(
      new PutObjectCommand({
        Bucket: config.spaces.bucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
        ACL: 'private',
      })
    );
    return { key: `s3:${key}`, bytes: buffer.length };
  }

  const dir = path.join(LOCAL_DIR, safeFolder);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, name), buffer);
  return { key: `local:${safeFolder}/${name}`, bytes: buffer.length };
}

// --- Training media (video + audio) -----------------------------------------
// These are far too big to hold in memory like an image or a CV, so they are
// streamed to disk by multer and moved into place here, never buffered.

const VIDEO_EXT_BY_MIME: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-m4v': '.m4v',
};

// Audio lessons (a recorded briefing, a pitch to listen to on the road) are
// training material just as much as video, and the office should be able to
// upload them the same way.
const AUDIO_EXT_BY_MIME: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/aac': '.aac',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/webm': '.weba',
};

const MEDIA_EXT_BY_MIME: Record<string, string> = { ...VIDEO_EXT_BY_MIME, ...AUDIO_EXT_BY_MIME };

export const ALLOWED_VIDEO_MIME = Object.keys(MEDIA_EXT_BY_MIME);
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2GB — a real training video can run long

// Videos live under var/ alongside the other uploads — outside docs/, which is
// served statically, so nothing here is reachable by guessing a path.
const VIDEO_DIR = path.join(LOCAL_DIR, 'videos');

export function videoUploadDir(): string {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  return VIDEO_DIR;
}

export function videoExtFor(mime: string): string {
  return MEDIA_EXT_BY_MIME[mime] ?? '.mp4';
}

/**
 * Take a video multer has already written to disk and put it where it belongs.
 *
 * With object storage configured the file is streamed up and its public CDN URL
 * returned. Without it the file simply stays on disk and is served back through
 * the app (with range support) — which is what makes upload work at all on a
 * box with no Spaces credentials.
 */
export async function putVideoFile(
  tempPath: string,
  mime: string
): Promise<{ url: string; bytes: number }> {
  const bytes = (await fs.promises.stat(tempPath)).size;
  const name = path.basename(tempPath);

  if (config.spaces.configured) {
    const key = path.posix.join(config.spaces.prefix, 'training-videos', name);
    await s3().send(
      new PutObjectCommand({
        Bucket: config.spaces.bucket,
        Key: key,
        Body: fs.createReadStream(tempPath),
        ContentLength: bytes,
        ContentType: mime,
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    await fs.promises.unlink(tempPath).catch(() => {});
    return { url: publicUrl(key), bytes };
  }

  // Already in the right directory — multer wrote it straight there.
  return { url: `/media/training-video/${name}`, bytes };
}

/** Resolve a stored video name to a path on disk, refusing anything outside. */
export function localVideoPath(name: string): string {
  const full = path.resolve(VIDEO_DIR, name);
  if (!full.startsWith(path.resolve(VIDEO_DIR))) throw new Error('Invalid video name');
  return full;
}

/** Read a private document back for an authorised caller. */
export async function getPrivateFile(key: string): Promise<Buffer> {
  if (key.startsWith('s3:')) {
    if (!config.spaces.configured) throw new Error('Object storage is not configured');
    const out = await s3().send(
      new GetObjectCommand({ Bucket: config.spaces.bucket, Key: key.slice(3) })
    );
    const chunks: Buffer[] = [];
    for await (const chunk of out.Body as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  if (key.startsWith('local:')) {
    const rel = key.slice('local:'.length);
    // The key is generated here, never supplied by a caller, but resolve and
    // check anyway so a malformed one can never escape the uploads directory.
    const full = path.resolve(LOCAL_DIR, rel);
    if (!full.startsWith(path.resolve(LOCAL_DIR))) throw new Error('Invalid file key');
    return fs.promises.readFile(full);
  }

  throw new Error('Unknown file key');
}
