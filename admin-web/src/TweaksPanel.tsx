import { useEffect, useState } from 'react';

// The original panel's ✦ theme tweaker, ported as-is. Skin/accent/density are
// applied as data attributes on <html> (admin.css defines the skins) and kept
// in localStorage under the same keys the old panel used. Defaults match the
// attributes index.html ships with, so there is no restyle flash on load.
const read = (k: string, d: string): string => {
  try {
    return localStorage.getItem('ad-tweak-' + k) || d;
  } catch {
    return d;
  }
};

export function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [skin, setSkin] = useState(() => read('skin', 'midnight'));
  const [accent, setAccent] = useState(() => read('accent', 'ruby'));
  const [density, setDensity] = useState(() => read('density', 'compact'));

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-skin', skin);
    r.setAttribute('data-accent', accent);
    r.setAttribute('data-density', density);
    try {
      localStorage.setItem('ad-tweak-skin', skin);
      localStorage.setItem('ad-tweak-accent', accent);
      localStorage.setItem('ad-tweak-density', density);
    } catch {
      /* storage disabled — tweaks last for this page only */
    }
  }, [skin, accent, density]);

  const Seg = ({ val, set, opts }: { val: string; set: (v: string) => void; opts: [string, string][] }) => (
    <div className="tk-seg">
      {opts.map(([v, l]) => (
        <button key={v} className={`tk-opt ${val === v ? 'on' : ''}`} onClick={() => set(v)}>
          {l}
        </button>
      ))}
    </div>
  );

  const accents: [string, string][] = [
    ['emerald', '#0E5C4A'],
    ['sapphire', '#1E3A8A'],
    ['ruby', '#8B1E2E'],
    ['amber', '#B7791F'],
  ];

  return (
    <>
      <button className="ad-tweak-fab" title="Tweaks" onClick={() => setOpen((o) => !o)}>
        {open ? '✕' : '✦'}
      </button>
      {open && (
        <div className="ad-tweak-panel">
          <h4>Tweaks</h4>
          <p className="tk-sub">Reshape the admin's feel.</p>
          <div className="tk-group">
            <div className="tk-glabel">Chrome skin</div>
            <Seg
              val={skin}
              set={setSkin}
              opts={[
                ['midnight', 'Midnight'],
                ['emerald', 'Emerald'],
                ['parchment', 'Parchment'],
              ]}
            />
          </div>
          <div className="tk-group">
            <div className="tk-glabel">Accent palette</div>
            <div className="tk-swatches">
              {accents.map(([id, hex]) => (
                <button
                  key={id}
                  className={`tk-sw ${accent === id ? 'on' : ''}`}
                  style={{ background: hex }}
                  title={id}
                  onClick={() => setAccent(id)}
                />
              ))}
            </div>
          </div>
          <div className="tk-group" style={{ marginBottom: 0 }}>
            <div className="tk-glabel">Density</div>
            <Seg
              val={density}
              set={setDensity}
              opts={[
                ['comfortable', 'Comfortable'],
                ['compact', 'Compact'],
              ]}
            />
          </div>
        </div>
      )}
    </>
  );
}
