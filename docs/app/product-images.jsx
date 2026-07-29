// product-images.jsx — admin-uploaded product photos, stored in the browser.
// Keyed by category|colour|shape so ONE photo represents that colour+shape
// across every grade and every size. Falls back to the generated gem when empty.
//
// Some categories show their *grade* as the visual variant while sharing a
// single colour id (e.g. Mother of Pearl: White MOP / Malachite / Black MOP all
// map to colour 'mop'; Multi Sapphires: Natural / Synthetic / Ice Cut all map to
// colour 'multi'). For those, the grade is folded into the key so each grade can
// carry its own photo. See PIMG_GRADE_SCOPED below.

const PIMG_KEY = 'eurostar-product-images-v1';

// Categories whose photo depends on the GRADE, not just colour + shape.
const PIMG_GRADE_SCOPED = { mop: true, multisapphire: true, opaque: true };

function pimgLoadAll() {
  try { return JSON.parse(localStorage.getItem(PIMG_KEY) || '{}'); }
  catch (e) { return {}; }
}
function pimgKey(catId, colorId, shape, gradeId) {
  return (gradeId && PIMG_GRADE_SCOPED[catId])
    ? catId + '|' + gradeId + '|' + colorId + '|' + shape
    : catId + '|' + colorId + '|' + shape;
}

// Server-backed product photos: uploaded in the admin, stored on the API, and
// shown here for EVERY visitor on every device (no per-browser upload needed).
// A tiny manifest (keys only) is fetched on load; each photo then streams from
// the API on demand via <img src>, so nothing bloats this browser's storage.
var PIMG_API_BASE = (function () {
  if (window.EUROSTAR_API) return window.EUROSTAR_API;
  return /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname) ? location.origin : 'https://eurostar-api.onrender.com';
})();
var pimgManifest = null; // map of key -> 1 for photos present on the server
(function fetchPimgManifest() {
  try {
    fetch(PIMG_API_BASE + '/admin/product-images/manifest')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && Array.isArray(d.keys)) {
          pimgManifest = {};
          d.keys.forEach(function (k) { pimgManifest[k] = 1; });
          try { window.dispatchEvent(new Event('eurostar-pimg-ready')); } catch (e) {}
        }
      })
      .catch(function () {});
  } catch (e) {}
})();
function pimgServerUrl(key) {
  return PIMG_API_BASE + '/admin/product-images/item?key=' + encodeURIComponent(key);
}

function getStoredProductImage(catId, colorId, shape, gradeId) {
  var key = pimgKey(catId, colorId, shape, gradeId);
  var local = pimgLoadAll()[key];
  if (local) return local;                                  // instant, same browser
  if (pimgManifest && pimgManifest[key]) return pimgServerUrl(key); // everyone, every device
  return null;
}

// Built-in default product photos shipped with the app (repo assets), so a card
// shows a photo without needing a per-browser admin upload. Keyed exactly like
// the stored map (catId|colorId|shape, with grade folded in only for the
// grade-scoped categories). A stored/admin-uploaded photo always wins over these.
const DEFAULT_PRODUCT_IMAGES = {
  'laser|vgi-alp-blue|radiant': 'assets/products/laser-vgi-alp-blue-radiant.jpg',
};
function getDefaultProductImage(catId, colorId, shape, gradeId) {
  return DEFAULT_PRODUCT_IMAGES[pimgKey(catId, colorId, shape, gradeId)] || null;
}
function setStoredProductImage(catId, colorId, shape, dataUrl, gradeId) {
  const all = pimgLoadAll();
  const k = pimgKey(catId, colorId, shape, gradeId);
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
function ProductHero({ category, color, shape, grade, photo, hex, lightenTone }) {
  const catId = category.id, colorId = color.id;
  const gradeId = grade && grade.id;
  const allowUpload = catId === 'alpanite' || !!PIMG_GRADE_SCOPED[catId];
  const [img, setImg] = React.useState(() => getStoredProductImage(catId, colorId, shape, gradeId));
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    setImg(getStoredProductImage(catId, colorId, shape, gradeId));
  }, [catId, colorId, shape, gradeId]);

  const onPick = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setBusy(true);
    try {
      const url = await fileToCompressedDataUrl(f);
      if (setStoredProductImage(catId, colorId, shape, url, gradeId)) setImg(url);
    } catch (err) { alert('Could not read that image.'); }
    setBusy(false);
    e.target.value = '';
  };
  const onRemove = (e) => {
    e.stopPropagation();
    setStoredProductImage(catId, colorId, shape, null, gradeId);
    setImg(null);
  };

  const shown = img || photo;
  return (
    <div className="pad-header-art" style={{
      background: lightenTone(hex),
      padding: 0, overflow: 'hidden',
      width: 132, height: 132, flex: '0 0 132px',
      position: 'relative',
    }}>
      {shown
        ? <img src={shown} alt={`${color.name} ${(window.findShape ? window.findShape(shape) : {}).name || ''}`}
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
  PIMG_GRADE_SCOPED, pimgKey,
});
