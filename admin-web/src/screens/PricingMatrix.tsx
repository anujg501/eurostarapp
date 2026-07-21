import { useEffect, useState } from 'react';
import { adminApi, type Category, type PricingMatrix, type PricingRow } from '../lib/api';

/** Pricing tab — the size × price matrix from the original panel.
 *
 *  The prototype's version was a mockup: uncontrolled inputs, a "Save pricing"
 *  button with no onClick, and numbers computed in the browser from constants.
 *  This keeps that layout but every row is backed by the database. A size with
 *  no SKU yet shows the chart's base × multiplier suggestion and becomes a real
 *  SKU the first time it is saved, so the table lists the full calibrated chart
 *  without inventing stored data.
 */
export function PricingMatrixEditor({ cat }: { cat: Category }) {
  const [data, setData] = useState<PricingMatrix | null>(null);
  const [shape, setShape] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  // Keyed by shape|size, so switching shape and coming back keeps unsaved edits.
  const [draft, setDraft] = useState<Record<string, { rate?: number; pcsPerPacket?: number }>>({});

  const activeShape = shape || data?.shape || '';

  useEffect(() => {
    let stale = false;
    setLoading(true);
    (async () => {
      try {
        const d = await adminApi.pricing(cat.key, shape || undefined);
        // A slower earlier request must not overwrite a newer shape's rows.
        if (stale) return;
        setData(d);
        if (!shape && d.shape) setShape(d.shape);
        setError('');
      } catch (e) {
        if (!stale) setError(e instanceof Error ? e.message : 'Could not load pricing.');
      } finally {
        if (!stale) setLoading(false);
      }
    })();
    return () => {
      stale = true;
    };
  }, [cat.key, shape]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const key = (size: string) => `${activeShape}|${size}`;
  const rateOf = (r: PricingRow) => draft[key(r.size)]?.rate ?? r.rate;
  const pcsOf = (r: PricingRow) => draft[key(r.size)]?.pcsPerPacket ?? r.pcsPerPacket;
  const isDirty = (r: PricingRow) => {
    const d = draft[key(r.size)];
    if (!d) return false;
    return (
      (d.rate !== undefined && d.rate !== r.rate) ||
      (d.pcsPerPacket !== undefined && d.pcsPerPacket !== r.pcsPerPacket)
    );
  };

  const edit = (size: string, patch: { rate?: number; pcsPerPacket?: number }) =>
    setDraft((d) => ({ ...d, [key(size)]: { ...d[key(size)], ...patch } }));

  const rows = data?.rows ?? [];
  const dirtyRows = rows.filter(isDirty);
  // The column is shown whenever the backend supplies a count for these rows,
  // rather than being gated on the unit of sale. Packet-sold categories are
  // where it changes the price maths; on a per-piece category it still records
  // how many pieces make up a packet, which the storefront ignores when pricing
  // by the piece.
  const showPacketPcs = rows.some((r) => Number.isFinite(r.pcsPerPacket) && r.pcsPerPacket > 0);

  const unitMeta = !data
    ? ''
    : data.unit === 'ct'
      ? '₹ per carat'
      : data.unit === 'pkt'
        ? '₹ per piece · packet sold'
        : `₹ per ${data.unit}`;

  const title = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

  const saveAll = async () => {
    if (!data || !dirtyRows.length || saving) return;

    // Whole, non-negative rates; a packet must hold at least one piece.
    for (const r of dirtyRows) {
      const rate = rateOf(r);
      const pcs = pcsOf(r);
      if (!Number.isFinite(rate) || rate < 0) {
        setToast({ kind: 'err', text: `${r.size}: rate must be 0 or more.` });
        return;
      }
      if (showPacketPcs && (!Number.isFinite(pcs) || pcs < 1)) {
        setToast({ kind: 'err', text: `${r.size}: pieces per packet must be at least 1.` });
        return;
      }
    }

    setSaving(true);
    try {
      // Only edited rows are sent: an untouched chart suggestion must not
      // silently become a stored SKU.
      const saved = await Promise.all(
        dirtyRows.map((r) =>
          adminApi.savePricingRow({
            cat: cat.key,
            shape: activeShape,
            size: r.size,
            rate: Math.round(rateOf(r)),
            ...(showPacketPcs ? { pcsPerPacket: Math.round(pcsOf(r)) } : {}),
          })
        )
      );

      // Patch the saved rows in place rather than refetching the whole table.
      const bySize = new Map(dirtyRows.map((r, i) => [r.size, saved[i].row] as const));
      setData((d) =>
        d
          ? {
              ...d,
              rows: d.rows.map((r) => {
                const s = bySize.get(r.size);
                return s
                  ? {
                      ...r,
                      skuId: s.id,
                      name: s.name,
                      rate: s.price,
                      pcsPerPacket: s.pcsPerPacket ?? r.pcsPerPacket,
                      saved: true,
                    }
                  : r;
              }),
            }
          : d
      );
      setDraft((d) => {
        const next = { ...d };
        dirtyRows.forEach((r) => delete next[key(r.size)]);
        return next;
      });

      const created = saved.filter((s) => s.created).length;
      setToast({
        kind: 'ok',
        text:
          `Saved ${saved.length} ${saved.length === 1 ? 'size' : 'sizes'}` +
          (created ? ` · ${created} new SKU${created === 1 ? '' : 's'} created` : '') +
          '.',
      });
    } catch (e) {
      setToast({ kind: 'err', text: e instanceof Error ? e.message : 'Could not save pricing.' });
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="ad-error">{error}</div>;
  if (!data && loading) return <div className="ad-card ad-card-pad ad-muted">Loading pricing…</div>;
  if (data && !data.shapes.length) {
    return (
      <div className="ad-card ad-card-pad ad-muted">
        This category has no shapes with SKUs yet. Add products via Bulk upload, then price them here.
      </div>
    );
  }

  return (
    <>
      {(data?.shapes.length ?? 0) > 1 && (
        <div className="cd-tabs">
          {data!.shapes.map((s) => (
            <button key={s} className={`cd-tab ${s === activeShape ? 'on' : ''}`} onClick={() => setShape(s)}>
              {title(s)}
            </button>
          ))}
        </div>
      )}

      <div className="ad-card">
        <div className="ad-sechead">
          <h3>Size × price ({title(activeShape)})</h3>
          <span className="meta">{unitMeta}</span>
        </div>

        <div className="cd-scroll">
          <table className="ad-table cd-table">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Size</th>
                <th style={{ width: 200 }}>Rate ₹</th>
                {showPacketPcs && <th style={{ width: 200 }}>Pcs / packet</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.size}>
                  <td style={{ fontWeight: 600 }}>{r.size}</td>
                  <td>
                    <input
                      className="ad-input ad-num"
                      type="number"
                      min={0}
                      step={1}
                      value={rateOf(r)}
                      onChange={(e) => edit(r.size, { rate: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </td>
                  {showPacketPcs && (
                    <td>
                      <input
                        className="ad-input ad-num"
                        type="number"
                        min={1}
                        step={1}
                        value={pcsOf(r)}
                        onChange={(e) => edit(r.size, { pcsPerPacket: Math.max(1, Number(e.target.value) || 1) })}
                      />
                    </td>
                  )}
                  <td className="ad-muted" style={{ fontSize: 11 }}>
                    {isDirty(r) ? 'unsaved' : r.saved ? `saved · ${r.skuId}` : 'auto from base × size multiplier'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ad-card-pad" style={{ borderTop: '1px solid var(--divider)' }}>
          <button className="ad-btn ad-btn-acc ad-btn-sm" disabled={!dirtyRows.length || saving} onClick={saveAll}>
            {saving ? 'Saving…' : 'Save pricing'}
          </button>
          <span className="ad-muted" style={{ fontSize: 12, marginLeft: 8 }}>
            {dirtyRows.length
              ? `${dirtyRows.length} unsaved ${dirtyRows.length === 1 ? 'change' : 'changes'}`
              : 'Bulk-edit all sizes via the upload sheet.'}
          </span>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 22,
            left: 22,
            zIndex: 200,
            maxWidth: 380,
            padding: '12px 16px',
            borderRadius: 'var(--r-md)',
            background: toast.kind === 'ok' ? 'var(--emerald)' : 'var(--ruby)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {toast.text}
        </div>
      )}
    </>
  );
}
