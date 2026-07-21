// product-images.jsx — admin-uploaded product photos, stored in the browser.
// Keyed by category|colour|shape so ONE photo represents that colour+shape
// across every grade and every size. Falls back to the generated gem when empty.

const PIMG_KEY = 'eurostar-product-images-v1';

function pimgLoadAll() {
  try { return JSON.parse(localStorage.getItem(PIMG_KEY) || '{}'); }
  catch (e) { return {}; }
}
function pimgKey(catId, colorId, shape) { return catId + '|' + colorId + '|' + shape; }

function getStoredProductImage(catId, colorId, shape) {
  return pimgLoadAll()[pimgKey(catId, colorId, shape)] || null;
}
function setStoredProductImage(catId, colorId, shape, dataUrl) {
  const all = pimgLoadAll();
  const k = pimgKey(catId, colorId, shape);
  if (dataUrl) all[k] = dataUrl; else delete all[k];
  try {
    localStorage.setItem(PIMG_KEY, JSON.stringify(all));
    return true;
  } catch (e) {
    alert('Could not save — browser storage is full. Try a smaller image.');
    return false;
  }
}

// Compress an uploaded file to a JPEG data URL (max edge ~900px) so many
// images fit comfortably in localStorage.
function fileToCompressedDataUrl(file, maxDim = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w >= h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
        else if (h > w && h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
        else if (w === h && w > maxDim) { w = maxDim; h = maxDim; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Uploadable product hero — shows the stored photo, else the gem render / shape icon.
// `allowUpload` gates the upload control (scoped per-category by the caller).
function ProductHero({ category, color, shape, photo, hex, lightenTone }) {
  const catId = category.id, colorId = color.id;
  const allowUpload = catId === 'alpanite';
  const [img, setImg] = React.useState(() => getStoredProductImage(catId, colorId, shape));
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    setImg(getStoredProductImage(catId, colorId, shape));
  }, [catId, colorId, shape]);

  const onPick = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setBusy(true);
    try {
      const url = await fileToCompressedDataUrl(f);
      if (setStoredProductImage(catId, colorId, shape, url)) setImg(url);
    } catch (err) { alert('Could not read that image.'); }
    setBusy(false);
    e.target.value = '';
  };
  const onRemove = (e) => {
    e.stopPropagation();
    setStoredProductImage(catId, colorId, shape, null);
    setImg(null);
  };

  const shown = img || photo;
  // An image that fails to load (an upload since deleted from storage, a 404,
  // a corrupt data URL) must fall back to the drawn placeholder rather than
  // leaving the browser's broken-image icon in the hero.
  const [broken, setBroken] = React.useState(false);
  React.useEffect(() => { setBroken(false); }, [shown]);
  const showImg = shown && !broken;
  return (
    <div className="pad-header-art" style={{
      background: lightenTone(hex),
      padding: 0, overflow: 'hidden',
      width: 132, height: 132, flex: '0 0 132px',
      position: 'relative',
    }}>
      {showImg
        ? <img src={shown} alt={`${color.name} ${(window.findShape ? window.findShape(shape) : {}).name || ''}`}
               onError={() => setBroken(true)} loading="lazy"
               style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: 'inset 0 0 0 1px rgba(20,40,30,0.14)',
          }}>
            <ShapeIcon shape={shape} size={44} color="rgba(20,40,30,0.42)" />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.09em',
              textTransform: 'uppercase', color: 'rgba(20,40,30,0.45)',
            }}>Photo</span>
          </div>}

      {allowUpload &&
      <React.Fragment>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
        <button type="button" data-no-zoom className="hero-upload-btn"
          onClick={(e) => { e.stopPropagation(); fileRef.current && fileRef.current.click(); }}>
          {busy ? 'Saving…' : img ? 'Change photo' : 'Upload photo'}
        </button>
        {img &&
        <button type="button" data-no-zoom className="hero-remove-btn" title="Remove photo" onClick={onRemove}>×</button>
        }
      </React.Fragment>}
    </div>
  );
}

// Document upload card (warranty card / certificate) — keyed independently of colour/shape.
// storeKey parts are joined the same way as product images, so it persists in the same store.
function DocUploadCard({ catId, gradeId, docId, label, caption }) {
  const [img, setImg] = React.useState(() => getStoredProductImage(catId, '_' + docId, gradeId));
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    setImg(getStoredProductImage(catId, '_' + docId, gradeId));
  }, [catId, gradeId, docId]);

  const onPick = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setBusy(true);
    try {
      const url = await fileToCompressedDataUrl(f, 1100, 0.85);
      if (setStoredProductImage(catId, '_' + docId, gradeId, url)) setImg(url);
    } catch (err) { alert('Could not read that image.'); }
    setBusy(false);
    e.target.value = '';
  };
  const onRemove = (e) => {
    e.stopPropagation();
    setStoredProductImage(catId, '_' + docId, gradeId, null);
    setImg(null);
  };

  return (
    <div className="doc-card">
      <div className="doc-card-art pad-header-art" style={{ position: 'relative' }}>
        {img
          ? <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <div className="doc-card-empty">{label}</div>}
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
        <button type="button" data-no-zoom className="hero-upload-btn"
          onClick={(e) => { e.stopPropagation(); fileRef.current && fileRef.current.click(); }}>
          {busy ? 'Saving…' : img ? 'Change' : 'Upload'}
        </button>
        {img &&
        <button type="button" data-no-zoom className="hero-remove-btn" title="Remove" onClick={onRemove}>×</button>}
      </div>
      <div className="doc-card-label">{label}</div>
      {caption && <div className="doc-card-caption">{caption}</div>}
    </div>
  );
}

Object.assign(window, {
  getStoredProductImage, setStoredProductImage, fileToCompressedDataUrl, ProductHero, DocUploadCard,
});
