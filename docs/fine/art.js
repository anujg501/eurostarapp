/*
 * Eurostar Fine — jewellery illustrations.
 *
 * Every piece is drawn from its own data (metal colour, gem colours, shapes,
 * stone count), so the picture follows the customer's choices live. These are
 * stand-ins until CAD renders / photography exist; product images uploaded
 * later replace them without touching the layout.
 */
(function (root) {
  let uid = 0;

  function hexToRgb(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // amt > 0 lightens toward white, < 0 darkens toward black.
  function shade(h, amt) {
    const [r, g, b] = hexToRgb(h);
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    const c = (v) => Math.round((t - v) * p + v).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  }

  // One drawing context: collects <defs> while shapes are emitted.
  function Ctx(metal) {
    const id = 'j' + (++uid);
    const defs = [];
    const grads = {};
    const m = metal;
    defs.push(`<linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${m.light}"/><stop offset=".45" stop-color="${m.mid}"/>
      <stop offset=".7" stop-color="${m.light}"/><stop offset="1" stop-color="${m.dark}"/></linearGradient>`);
    defs.push(`<radialGradient id="${id}sh"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`);
    const ctx = {
      metal: `url(#${id}m)`, m,
      shadow: `url(#${id}sh)`,
      gem(hex) {
        if (grads[hex]) return grads[hex];
        const gid = id + 'g' + Object.keys(grads).length;
        const pale = hexToRgb(hex).reduce((a, b) => a + b, 0) > 650;
        const hi = pale ? '#FFFFFF' : shade(hex, 0.55);
        const lo = pale ? '#B9C4CF' : shade(hex, -0.45);
        defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="${hex}"/><stop offset="1" stop-color="${lo}"/></linearGradient>`);
        grads[hex] = { fill: `url(#${gid})`, line: pale ? '#8D99A6' : shade(hex, -0.6), facet: pale ? '#7F8C99' : '#FFFFFF', pale };
        return grads[hex];
      },
      def(s) { defs.push(s); },
      id,
      svg(body, vb = '0 0 400 400') {
        return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img"><defs>${defs.join('')}</defs>${body}</svg>`;
      },
    };
    return ctx;
  }

  // ---------- faceted stones ----------
  function facetsRound(cx, cy, r, g) {
    const n = 8, tr = r * 0.52;
    let pts = [], lines = '';
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.PI / 8;
      pts.push([cx + tr * Math.cos(a), cy + tr * Math.sin(a)]);
    }
    const table = pts.map((p) => p.join(',')).join(' ');
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.PI / 8, b = a + Math.PI / 8;
      lines += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}"/>`;
      lines += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${cx + r * Math.cos(b)}" y2="${cy + r * Math.sin(b)}"/>`;
    }
    return `<g stroke="${g.facet}" stroke-opacity="${g.pale ? 0.55 : 0.35}" stroke-width="${Math.max(0.5, r / 30)}" fill="none"><polygon points="${table}"/>${lines}</g>`;
  }

  function stone(ctx, cx, cy, shape, w, h, hex, opts = {}) {
    const g = ctx.gem(hex);
    const sw = Math.max(0.6, w / 40);
    let body = '', clip = '';
    if (shape === 'round') {
      const r = w / 2;
      body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${g.fill}" stroke="${g.line}" stroke-width="${sw}"/>`;
      if (r > 5) body += facetsRound(cx, cy, r, g);
    } else if (shape === 'oval') {
      body = `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="${g.fill}" stroke="${g.line}" stroke-width="${sw}"/>`;
      if (w > 10) body += `<g transform="translate(${cx} ${cy}) scale(1 ${h / w}) translate(${-cx} ${-cy})">${facetsRound(cx, cy, w / 2, g)}</g>`;
    } else if (shape === 'pear') {
      const x0 = cx, top = cy - h / 2, bot = cy + h / 2, r = w / 2;
      const d = `M${x0} ${top} C${x0 + r * 0.35} ${top + h * 0.2} ${x0 + r} ${bot - r * 1.4} ${x0 + r} ${bot - r} A${r} ${r} 0 0 1 ${x0 - r} ${bot - r} C${x0 - r} ${bot - r * 1.4} ${x0 - r * 0.35} ${top + h * 0.2} ${x0} ${top}Z`;
      body = `<path d="${d}" fill="${g.fill}" stroke="${g.line}" stroke-width="${sw}"/>`;
      if (w > 10) body += `<g stroke="${g.facet}" stroke-opacity=".35" stroke-width="${sw}" fill="none"><path d="M${x0} ${top + h * 0.22} L${x0 + r * 0.45} ${bot - r * 0.9} L${x0} ${bot - r * 0.35} L${x0 - r * 0.45} ${bot - r * 0.9}Z"/><line x1="${x0}" y1="${top}" x2="${x0}" y2="${top + h * 0.22}"/><line x1="${x0}" y1="${bot}" x2="${x0}" y2="${bot - r * 0.35}"/><line x1="${x0 + r}" y1="${bot - r}" x2="${x0 + r * 0.45}" y2="${bot - r * 0.9}"/><line x1="${x0 - r}" y1="${bot - r}" x2="${x0 - r * 0.45}" y2="${bot - r * 0.9}"/></g>`;
    } else if (shape === 'cushion') {
      const rr = w * 0.22;
      body = `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${rr}" fill="${g.fill}" stroke="${g.line}" stroke-width="${sw}"/>`;
      if (w > 10) body += facetsRound(cx, cy, w / 2, g);
    } else if (shape === 'polki') {
      const pts = [];
      const n = 11;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        const j = 0.86 + 0.14 * Math.abs(Math.sin(i * 2.3 + w));
        pts.push(`${cx + (w / 2) * j * Math.cos(a)},${cy + (h / 2) * j * Math.sin(a)}`);
      }
      body = `<polygon points="${pts.join(' ')}" fill="${g.fill}" stroke="${ctx.metal}" stroke-width="${Math.max(2, w / 9)}" stroke-linejoin="round"/>`
        + `<polygon points="${pts.join(' ')}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${sw}" transform="translate(${cx} ${cy}) scale(.6) translate(${-cx} ${-cy})"/>`;
    }
    // Small specular highlight sells "faceted gem" at every size.
    const hl = shape === 'polki' ? '' : `<ellipse cx="${cx - w * 0.16}" cy="${cy - h * 0.2}" rx="${w * 0.12}" ry="${h * 0.06}" fill="#fff" opacity=".55" transform="rotate(-30 ${cx - w * 0.16} ${cy - h * 0.2})"/>`;
    let prongs = '';
    if (opts.prongs) {
      const pr = Math.max(2, w * 0.07);
      const pts = opts.prongs === 6
        ? [0, 60, 120, 180, 240, 300].map((a) => a * Math.PI / 180)
        : [45, 135, 225, 315].map((a) => a * Math.PI / 180);
      prongs = pts.map((a) => `<circle cx="${cx + (w / 2) * Math.cos(a) * 0.98}" cy="${cy + (h / 2) * Math.sin(a) * 0.98}" r="${pr}" fill="${ctx.metal}" stroke="${ctx.m.dark}" stroke-width=".6"/>`).join('');
    }
    let bezel = '';
    if (opts.bezel) {
      const bw = Math.max(3, w * 0.09);
      if (shape === 'round') bezel = `<circle cx="${cx}" cy="${cy}" r="${w / 2 + bw / 2}" fill="none" stroke="${ctx.metal}" stroke-width="${bw}"/>`;
      else bezel = `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2 + bw / 2}" ry="${h / 2 + bw / 2}" fill="none" stroke="${ctx.metal}" stroke-width="${bw}"/>`;
    }
    return `<g${opts.opacity ? ` opacity="${opts.opacity}"` : ''}>${body}${clip}${hl}${bezel}${prongs}</g>`;
  }

  // ---------- motifs ----------
  function evilEye(ctx, cx, cy, r) {
    return `<circle cx="${cx}" cy="${cy}" r="${r + r * 0.12}" fill="${ctx.metal}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#1D4BB2"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.64}" fill="#FBFAF6"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="#78B4EE"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="#121212"/>
      <ellipse cx="${cx - r * 0.3}" cy="${cy - r * 0.38}" rx="${r * 0.22}" ry="${r * 0.1}" fill="#fff" opacity=".5" transform="rotate(-30 ${cx - r * 0.3} ${cy - r * 0.38})"/>`;
  }

  function clover(ctx, cx, cy, r, hex, nacre) {
    const lobe = r / 2, f = Math.max(2.5, r * 0.13);
    const pos = [[0, -lobe], [lobe, 0], [0, lobe], [-lobe, 0]];
    const gold = pos.map(([x, y]) => `<circle cx="${cx + x}" cy="${cy + y}" r="${lobe + f}" fill="${ctx.metal}"/>`).join('');
    const g = ctx.gem(hex);
    const inner = pos.map(([x, y]) => `<circle cx="${cx + x}" cy="${cy + y}" r="${lobe}" fill="${nacre ? hex : g.fill}"/>`).join('');
    let sheen = '';
    if (nacre) {
      const sid = ctx.id + 'n' + Math.round(cx) + Math.round(cy);
      ctx.def(`<linearGradient id="${sid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="#F6D9E4" stop-opacity=".35"/><stop offset=".6" stop-color="#D6E9F2" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
      sheen = pos.map(([x, y]) => `<circle cx="${cx + x}" cy="${cy + y}" r="${lobe}" fill="url(#${sid})"/>`).join('');
    }
    const dot = `<circle cx="${cx}" cy="${cy}" r="${f * 1.1}" fill="${ctx.metal}"/>`;
    return `<g>${gold}${inner}${sheen}${dot}</g>`;
  }

  function pearl(ctx, cx, cy, r, hex = '#F6F1E7') {
    const pid = ctx.id + 'p' + Math.round(cx) + Math.round(cy);
    ctx.def(`<radialGradient id="${pid}" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="${hex}"/><stop offset=".85" stop-color="${shade(hex, -0.14)}"/><stop offset="1" stop-color="${shade(hex, -0.25)}"/></radialGradient>`);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${pid})"/><circle cx="${cx - r * 0.32}" cy="${cy - r * 0.36}" r="${r * 0.16}" fill="#fff" opacity=".85"/>`;
  }

  function disc(ctx, cx, cy, r, hex) {
    const did = ctx.id + 'd' + Math.round(cx);
    const dark = hexToRgb(hex).reduce((a, b) => a + b, 0) < 300;
    ctx.def(`<linearGradient id="${did}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${dark ? '#5A5F6E' : '#FFFFFF'}"/><stop offset=".3" stop-color="${dark ? '#3B4558' : '#F3E3EA'}"/><stop offset=".55" stop-color="${hex}"/><stop offset=".78" stop-color="${dark ? '#2E4A4A' : '#DCEBF0'}"/><stop offset="1" stop-color="${shade(hex, dark ? 0.1 : -0.1)}"/></linearGradient>`);
    return `<circle cx="${cx}" cy="${cy}" r="${r + Math.max(3, r * 0.08)}" fill="${ctx.metal}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${did})"/>`;
  }

  function opal(ctx, cx, cy, rx, ry) {
    const oid = ctx.id + 'o' + Math.round(cx) + Math.round(cy);
    ctx.def(`<clipPath id="${oid}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>`);
    ctx.def(`<filter id="${oid}b"><feGaussianBlur stdDeviation="${Math.max(1.5, rx / 7)}"/></filter>`);
    const blobs = [['#F6A7C1', -0.4, -0.3], ['#7FD6C8', 0.35, -0.2], ['#9DB8F2', -0.1, 0.35], ['#B8E28E', 0.4, 0.4], ['#F2C98A', -0.45, 0.3], ['#C9A6F0', 0.05, -0.45]];
    const b = blobs.map(([c, x, y]) => `<ellipse cx="${cx + x * rx}" cy="${cy + y * ry}" rx="${rx * 0.38}" ry="${ry * 0.3}" fill="${c}" opacity=".75"/>`).join('');
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#EFEBE3"/><g clip-path="url(#${oid})"><g filter="url(#${oid}b)">${b}</g></g>
      <ellipse cx="${cx - rx * 0.3}" cy="${cy - ry * 0.4}" rx="${rx * 0.25}" ry="${ry * 0.1}" fill="#fff" opacity=".6"/>`;
  }

  const NAV = ['#F6F1E7', '#E06A4C', '#0F6B52', '#E5C232', '#EEF2F6', '#1F3C93', '#C8742A', '#B9A26A'];
  function navratna(ctx, cx, cy, R, s) {
    let out = `<circle cx="${cx}" cy="${cy}" r="${R + s * 0.9}" fill="${ctx.metal}"/>`;
    out += stone(ctx, cx, cy, 'round', s * 1.3, s * 1.3, '#9B1B30');
    NAV.forEach((c, i) => {
      const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      out += i === 0 ? pearl(ctx, x, y, s / 2, c) : stone(ctx, x, y, 'round', s, s, c);
    });
    return out;
  }

  // ---------- metal forms ----------
  function shadow(ctx, cx, cy, rx, ry) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ctx.shadow}"/>`;
  }

  function ringBand(ctx, cx, cy, rx, ry, w) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${ctx.m.dark}" stroke-width="${w + 1.5}" opacity=".5"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${ctx.metal}" stroke-width="${w}"/>
      <ellipse cx="${cx}" cy="${cy - w * 0.18}" rx="${rx - w * 0.2}" ry="${ry - w * 0.2}" fill="none" stroke="${ctx.m.light}" stroke-width="${Math.max(1, w * 0.12)}" opacity=".9"/>`;
  }

  // Points along an ellipse arc (angles in degrees, 90 = front/bottom).
  function arcPoints(cx, cy, rx, ry, from, to, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? (from + to) / 2 : from + ((to - from) * i) / (n - 1);
      const a = (t * Math.PI) / 180;
      out.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), depth: Math.sin(a) });
    }
    return out;
  }

  function chain(ctx, x1, y1, x2, y2, cy) {
    return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${cy} ${x2} ${y2}" fill="none" stroke="${ctx.m.mid}" stroke-width="2.6" stroke-dasharray="5 2.2" stroke-linecap="round"/>`;
  }

  // Front-arc stones: bigger at the front (perspective), back ones faded.
  function bandStones(ctx, cx, cy, rx, ry, from, to, n, size, colours, shape = 'round') {
    return arcPoints(cx, cy, rx, ry, from, to, n).map((p, i) => {
      const s = size * (0.72 + 0.28 * Math.max(0, p.depth));
      return stone(ctx, p.x, p.y, shape, s, s, colours[i % colours.length], { opacity: p.depth < 0 ? 0.55 : null });
    }).join('');
  }

  // ---------- compositions, by art type ----------
  const T = {
    solitaire(ctx, a) {
      const s = a.shape || 'round';
      const [w, h] = s === 'round' ? [86, 86] : s === 'cushion' ? [82, 82] : [70, 96];
      // Stone sits on the far rim of the band, held by a small gold gallery.
      const top = 252 - 48, cy = top - h * 0.38;
      const gallery = `<path d="M${200 - w * 0.34} ${cy + h * 0.32} L${200 + w * 0.34} ${cy + h * 0.32} L${200 + w * 0.14} ${top + 10} L${200 - w * 0.14} ${top + 10}Z" fill="${ctx.metal}" stroke="${ctx.m.dark}" stroke-width=".8"/>`;
      return shadow(ctx, 200, 318, 150, 18) + ringBand(ctx, 200, 252, 122, 48, 14) + gallery
        + (a.halo ? bandStones(ctx, 200, cy, w / 2 + 9, h / 2 + 9, 0, 360, 18, 10, [a.accent]) : '')
        + stone(ctx, 200, cy, s, w, h, a.gem, { prongs: s === 'round' ? 6 : 4 });
    },
    trilogy(ctx, a) {
      return shadow(ctx, 200, 318, 150, 18) + ringBand(ctx, 200, 252, 122, 48, 14)
        + stone(ctx, 138, 196, 'pear', 40, 58, a.accent, { prongs: 4 })
        + stone(ctx, 262, 196, 'pear', 40, 58, a.accent, { prongs: 4 })
        + stone(ctx, 200, 182, 'oval', 64, 88, a.gem, { prongs: 4 });
    },
    bezelring(ctx, a) {
      return shadow(ctx, 200, 318, 150, 18) + ringBand(ctx, 200, 252, 122, 48, 18)
        + `<ellipse cx="200" cy="196" rx="54" ry="66" fill="${ctx.metal}" stroke="${ctx.m.dark}" stroke-width="1"/>`
        + stone(ctx, 200, 196, 'oval', 84, 108, a.gem, {});
    },
    navring(ctx, a) {
      return shadow(ctx, 200, 318, 150, 18) + ringBand(ctx, 200, 252, 122, 48, 16) + navratna(ctx, 200, 186, 50, 28);
    },
    signet(ctx, a) {
      return shadow(ctx, 200, 318, 150, 18) + ringBand(ctx, 200, 252, 122, 48, 22)
        + `<ellipse cx="200" cy="196" rx="74" ry="56" fill="${ctx.metal}" stroke="${ctx.m.dark}" stroke-width="1.2"/>`
        + (a.motif === 'opal' ? opal(ctx, 200, 196, 52, 38) : stone(ctx, 200, 196, 'oval', 104, 76, a.gem));
    },
    eternity(ctx, a) {
      const cols = a.mix || [a.gem];
      return shadow(ctx, 200, 318, 150, 18) + ringBand(ctx, 200, 230, 130, 58, 18)
        + (a.full ? bandStones(ctx, 200, 230, 130, 58, 200, 340, 9, 15, cols) : '')
        + bandStones(ctx, 200, 230, 130, 58, a.full ? 5 : 30, a.full ? 175 : 150, a.full ? 13 : 11, a.size || 22, cols, a.stoneShape);
    },
    stack(ctx, a) {
      return shadow(ctx, 200, 330, 150, 16)
        + [0, 1, 2].map((i) => ringBand(ctx, 200, 160 + i * 62, 124, 44, 11)
          + bandStones(ctx, 200, 160 + i * 62, 124, 44, 45, 135, 9, 15, [a.mix[i % a.mix.length]])).join('');
    },
    studs(ctx, a) {
      const s = a.size || 80;
      const one = (x) => {
        if (a.motif === 'evileye') return evilEye(ctx, x, 200, s / 2);
        if (a.motif === 'clover') return clover(ctx, x, 200, s, a.gem, a.nacre);
        if (a.motif === 'opal') return `<circle cx="${x}" cy="200" r="${s / 2 + 6}" fill="${ctx.metal}"/>` + opal(ctx, x, 200, s / 2, s / 2);
        if (a.motif === 'polki') return stone(ctx, x, 200, 'polki', s, s, a.gem);
        return stone(ctx, x, 200, a.shape || 'round', s, s, a.gem, { prongs: 4 });
      };
      return shadow(ctx, 135, 262, 60, 10) + shadow(ctx, 265, 262, 60, 10) + one(135) + one(265);
    },
    huggies(ctx, a) {
      const cols = a.mix || [a.accent || a.gem];
      const one = (x, off) => `<ellipse cx="${x}" cy="190" rx="56" ry="66" fill="none" stroke="${ctx.m.dark}" stroke-width="15" opacity=".45"/>
        <ellipse cx="${x}" cy="190" rx="56" ry="66" fill="none" stroke="${ctx.metal}" stroke-width="13"/>`
        + (a.plain ? '' : bandStones(ctx, x, 190, 56, 66, 15, 165, 7, 13, cols.slice(off).concat(cols.slice(0, off))))
        + (a.drop ? `<line x1="${x}" y1="256" x2="${x}" y2="276" stroke="${ctx.metal}" stroke-width="3"/>` + pearl(ctx, x, 300, 26) : '');
      return shadow(ctx, 200, 350, 150, 12) + one(132, 0) + one(268, 2);
    },
    climbers(ctx, a) {
      const one = (x, dir) => {
        let out = `<path d="M${x} 300 Q${x + dir * 40} 200 ${x + dir * 10} 90" fill="none" stroke="${ctx.metal}" stroke-width="10" stroke-linecap="round"/>`;
        for (let i = 0; i < 5; i++) {
          const t = i / 4, s = 30 - i * 4;
          const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * (x + dir * 40) + t * t * (x + dir * 10);
          const py = (1 - t) * (1 - t) * 300 + 2 * (1 - t) * t * 200 + t * t * 90;
          out += stone(ctx, px, py, 'round', s, s, a.mix[i % a.mix.length], { prongs: 4 });
        }
        return out;
      };
      return one(150, -1) + one(250, 1);
    },
    drops(ctx, a) {
      const one = (x) => stone(ctx, x, 120, 'round', 36, 36, a.accent, { prongs: 4 })
        + `<line x1="${x}" y1="140" x2="${x}" y2="210" stroke="${ctx.metal}" stroke-width="3"/><circle cx="${x}" cy="214" r="5" fill="${ctx.metal}"/>`
        + pearl(ctx, x, 252, 36);
      return shadow(ctx, 200, 330, 150, 10) + one(140) + one(260);
    },
    pendant(ctx, a) {
      let motif = '';
      const y = 236;
      if (a.motif === 'evileye') motif = evilEye(ctx, 200, y, 46) + (a.halo ? bandStones(ctx, 200, y, 62, 62, 0, 360, 16, 9, [a.accent]) : '');
      else if (a.motif === 'clover') motif = clover(ctx, 200, y, 104, a.gem, a.nacre);
      else if (a.motif === 'pearl') motif = pearl(ctx, 200, y, 40);
      else if (a.motif === 'disc') motif = disc(ctx, 200, y + 8, 58, a.gem);
      else if (a.motif === 'navratna') motif = navratna(ctx, 200, y + 4, 46, 26);
      else if (a.motif === 'polki') motif = stone(ctx, 200, y + 8, 'polki', 76, 96, a.gem);
      else motif = stone(ctx, 200, y, a.shape || 'round', 64, a.shape === 'pear' ? 88 : 64, a.gem, { prongs: 4 });
      return chain(ctx, 30, 0, 370, 0, 330) + `<rect x="193" y="160" width="14" height="22" rx="7" fill="none" stroke="${ctx.metal}" stroke-width="5"/>` + motif;
    },
    bar(ctx, a) {
      let out = chain(ctx, 30, 0, 370, 0, 300) + `<rect x="193" y="146" width="14" height="20" rx="7" fill="none" stroke="${ctx.metal}" stroke-width="5"/>`;
      out += `<rect x="180" y="166" width="40" height="190" rx="20" fill="${ctx.metal}" stroke="${ctx.m.dark}" stroke-width="1"/>`;
      for (let i = 0; i < 5; i++) out += stone(ctx, 200, 186 + i * 37.5, 'round', 28, 28, a.mix[i % a.mix.length]);
      return out;
    },
    letter(ctx, a) {
      return chain(ctx, 30, 0, 370, 0, 300) + `<rect x="193" y="146" width="14" height="20" rx="7" fill="none" stroke="${ctx.metal}" stroke-width="5"/>`
        + `<text x="200" y="290" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="150" font-weight="500" fill="${ctx.metal}" stroke="${ctx.m.dark}" stroke-width="1">${a.letter || 'A'}</text>`
        + stone(ctx, 248, 186, 'round', 20, 20, a.gem, { bezel: true });
    },
    mangal(ctx, a) {
      return chain(ctx, 20, 0, 380, 0, 300) + `<line x1="200" y1="150" x2="200" y2="176" stroke="${ctx.metal}" stroke-width="3"/>`
        + disc(ctx, 158, 154, 15, '#2B2D33') + disc(ctx, 242, 154, 15, '#2B2D33')
        + stone(ctx, 200, 200, 'round', 44, 44, a.gem, { prongs: 4 });
    },
    tennis(ctx, a) {
      const cols = a.mix || [a.gem];
      return shadow(ctx, 200, 330, 170, 18)
        + `<ellipse cx="200" cy="210" rx="160" ry="96" fill="none" stroke="${ctx.metal}" stroke-width="24"/>`
        + bandStones(ctx, 200, 210, 160, 96, 190, 350, 14, 16, cols)
        + bandStones(ctx, 200, 210, 160, 96, 0, 180, 18, 22, cols);
    },
    station(ctx, a) {
      let out = shadow(ctx, 200, 330, 170, 18)
        + `<ellipse cx="200" cy="210" rx="160" ry="96" fill="none" stroke="${ctx.m.mid}" stroke-width="3" stroke-dasharray="6 2.5"/>`;
      arcPoints(200, 210, 160, 96, 25, 155, 5).forEach((p) => {
        out += a.motif === 'evileye' ? evilEye(ctx, p.x, p.y, 20) : clover(ctx, p.x, p.y, 38, a.gem, a.nacre);
      });
      return out;
    },
    nosepin(ctx, a) {
      return shadow(ctx, 200, 330, 70, 10)
        + `<path d="M200 214 L200 280 Q200 312 228 306 Q248 300 236 286" fill="none" stroke="${ctx.metal}" stroke-width="7" stroke-linecap="round"/>`
        + stone(ctx, 200, 172, 'round', 70, 70, a.gem, { bezel: true });
    },
    // Uncut polki read better than brilliants on a wide band.
    polkiband(ctx, a) {
      return shadow(ctx, 200, 318, 150, 18) + ringBand(ctx, 200, 232, 128, 56, 24)
        + arcPoints(200, 232, 128, 56, 35, 145, 9).map((p) => {
          const s = 26 * (0.75 + 0.25 * p.depth);
          return stone(ctx, p.x, p.y, 'polki', s, s, a.gem);
        }).join('');
    },
  };

  function render(art, metal) {
    const ctx = Ctx(metal);
    const fn = T[art.type] || T.solitaire;
    return ctx.svg(fn(ctx, art));
  }

  root.FineArt = { render, shade };
})(typeof window !== 'undefined' ? window : globalThis);
