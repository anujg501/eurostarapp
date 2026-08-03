import { useCallback, useEffect, useRef, useState } from 'react';

// A square-crop dialog shown right after the operator picks a photo, so they
// can drag + zoom to frame it instead of cropping the file beforehand. It
// returns a fresh square JPEG File; the existing uploadImage() flow then runs
// on that, unchanged. Wire it in with the useImageCropper() hook below.

const STAGE = 280; // on-screen crop square (CSS px)
const OUT = 900; // saved square resolution (px)

function CropModal({
  file,
  onCancel,
  onDone,
}: {
  file: File;
  onCancel: () => void;
  onDone: (f: File) => void;
}) {
  const [url] = useState(() => URL.createObjectURL(file));
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const cover = nat ? Math.max(STAGE / nat.w, STAGE / nat.h) : 1;
  const dispW = nat ? nat.w * cover * zoom : STAGE;
  const dispH = nat ? nat.h * cover * zoom : STAGE;
  const maxX = Math.max(0, (dispW - STAGE) / 2);
  const maxY = Math.max(0, (dispH - STAGE) / 2);

  const clamp = (x: number, y: number) => ({
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  });

  useEffect(() => setOff((o) => clamp(o.x, o.y)), [zoom, nat]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOff(clamp(drag.current.ox + (e.clientX - drag.current.x), drag.current.oy + (e.clientY - drag.current.y)));
  };
  const onUp = () => {
    drag.current = null;
  };

  const confirm = () => {
    const img = imgRef.current;
    if (!img || !nat) return;
    setSaving(true);
    const srcPerScreen = 1 / (cover * zoom);
    const sx = nat.w / 2 + (-STAGE / 2 - off.x) * srcPerScreen;
    const sy = nat.h / 2 + (-STAGE / 2 - off.y) * srcPerScreen;
    const sSize = STAGE * srcPerScreen;
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onDone(file);
      return;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onDone(file);
          return;
        }
        const base = file.name.replace(/\.[^.]+$/, '') || 'image';
        onDone(new File([blob], base + '.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fffdf8',
          color: '#15130f',
          border: '1px solid #e6ddc8',
          borderRadius: 14,
          width: 440,
          maxWidth: '100%',
          padding: '18px 20px',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 16, fontWeight: 600 }}>Crop image</strong>
          <button
            aria-label="Close"
            onClick={onCancel}
            style={{ border: 'none', background: 'none', fontSize: 20, lineHeight: 1, cursor: 'pointer', color: '#6a6253' }}
          >
            ✕
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#6a6253', margin: '4px 0 14px' }}>
          Drag the photo and zoom until it sits nicely in the square. Only the square is saved.
        </p>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            style={{
              position: 'relative',
              width: STAGE,
              height: STAGE,
              flexShrink: 0,
              borderRadius: 8,
              overflow: 'hidden',
              background: '#0f2233',
              cursor: drag.current ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
          >
            <img
              ref={imgRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              // A file the browser cannot decode — a HEIC straight off an
              // iPhone, a RAW, a .jpg that is really something else — used to
              // leave this dialog with an empty stage and a permanently greyed
              // button, which reads as "upload is broken". Say what happened
              // and offer to send the file as it is.
              onError={() => setFailed(true)}
              style={{
                position: 'absolute',
                width: dispW,
                height: dispH,
                left: (STAGE - dispW) / 2 + off.x,
                top: (STAGE - dispH) / 2 + off.y,
                userSelect: 'none',
                pointerEvents: 'none',
                maxWidth: 'none',
              }}
            />
            <div style={{ position: 'absolute', inset: 8, border: '1.5px dashed rgba(255,255,255,0.85)', borderRadius: 4, pointerEvents: 'none' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#9a917c', marginBottom: 6 }}>What gets saved</div>
            <div style={{ fontSize: 13, color: '#6a6253', lineHeight: 1.5 }}>
              A neat square photo — exactly what customers see on the Sales App.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 2px' }}>
          <span aria-hidden style={{ fontSize: 13, color: '#9a917c' }}>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label="Zoom"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>

        {failed && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: '#FBF1F1', border: '1px solid #E6C9C9', color: '#9A3B3B', fontSize: 13, lineHeight: 1.5 }}>
            This browser can’t open “{file.name}” to crop it — phone photos saved as HEIC do this. You can still upload
            it as it is, or cancel and pick a JPG or PNG.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, borderTop: '1px solid #eee6d6', paddingTop: 14 }}>
          {failed && (
            <button
              onClick={() => onDone(file)}
              style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #d8cfb8', background: '#fff', color: '#3a352b', cursor: 'pointer', fontSize: 14, marginRight: 'auto' }}
            >
              Upload without cropping
            </button>
          )}
          <button
            onClick={onCancel}
            style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #d8cfb8', background: '#fff', color: '#3a352b', cursor: 'pointer', fontSize: 14 }}
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!nat || saving}
            style={{
              height: 38,
              padding: '0 18px',
              borderRadius: 8,
              border: 'none',
              background: '#0E5C4A',
              color: '#fff',
              cursor: !nat || saving ? 'default' : 'pointer',
              opacity: !nat || saving ? 0.6 : 1,
              fontSize: 14,
            }}
          >
            {saving ? 'Saving…' : 'Crop and upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook: gives you a node to render, and requestCrop(file) → Promise<File|null>.
// Resolves with the cropped File, or null if the operator cancels.
export function useImageCropper() {
  const [pending, setPending] = useState<{ file: File; resolve: (f: File | null) => void } | null>(null);

  const requestCrop = useCallback(
    (file: File) => new Promise<File | null>((resolve) => setPending({ file, resolve })),
    []
  );

  const cropNode = pending ? (
    <CropModal
      file={pending.file}
      onCancel={() => {
        pending.resolve(null);
        setPending(null);
      }}
      onDone={(f) => {
        pending.resolve(f);
        setPending(null);
      }}
    />
  ) : null;

  return { cropNode, requestCrop };
}
