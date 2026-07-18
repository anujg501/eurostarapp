import crypto from 'crypto';
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
