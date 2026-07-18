// icons.jsx — UI icons + gemstone shape SVGs for Eurostar app

const I = ({ children, size = 20, stroke = 'currentColor', fill = 'none', strokeWidth = 1.6, style = {}, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} {...rest}>
    {children}
  </svg>
);

const IconSearch  = (p) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></I>;
const IconFilter  = (p) => <I {...p}><path d="M3 5h18M6 12h12M10 19h4"/></I>;
const IconHeart   = (p) => <I {...p}><path d="M12 21s-7-4.5-7-10.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 7 4.5C19 16.5 12 21 12 21z"/></I>;
const IconHeartFill = (p) => <I {...p} fill="currentColor"><path d="M12 21s-7-4.5-7-10.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 7 4.5C19 16.5 12 21 12 21z"/></I>;
const IconBag     = (p) => <I {...p}><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></I>;
const IconBell    = (p) => <I {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></I>;
const IconGlobe   = (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/></I>;
const IconUser    = (p) => <I {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/></I>;
const IconChev    = (p) => <I {...p}><path d="M9 6l6 6-6 6"/></I>;
const IconArrowLeft = (p) => <I {...p}><path d="M19 12H5M12 5l-7 7 7 7"/></I>;
const IconCheck   = (p) => <I {...p}><path d="M4 12l5 5L20 6"/></I>;
const IconPlus    = (p) => <I {...p}><path d="M12 5v14M5 12h14"/></I>;
const IconMinus   = (p) => <I {...p}><path d="M5 12h14"/></I>;
const IconX       = (p) => <I {...p}><path d="M6 6l12 12M18 6L6 18"/></I>;
const IconMenu    = (p) => <I {...p}><path d="M4 7h16M4 12h16M4 17h16"/></I>;
const IconDrag    = (p) => <I {...p}><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></I>;
const IconDownload = (p) => <I {...p}><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></I>;
const IconTruck   = (p) => <I {...p}><path d="M1 7h13v10H1zM14 10h5l3 3v4h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></I>;
const IconWhats   = (p) => <I {...p}><path d="M20 12a8 8 0 1 1-14.9 4L3 21l5.2-1.3A8 8 0 0 1 20 12z"/></I>;
const IconQr      = (p) => <I {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M20 14v.01M14 20v.01M17 17v4M21 17v4"/></I>;
const IconChevron = (p) => <I {...p}><path d="M6 9l6 6 6-6"/></I>;
const IconPhone   = (p) => <I {...p}><path d="M5 4h3l2 5-2.5 1.5a10 10 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/></I>;
const IconShield  = (p) => <I {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></I>;
const IconBox     = (p) => <I {...p}><path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/></I>;
const IconRefresh = (p) => <I {...p}><path d="M20 8A8 8 0 0 0 6 6M4 4v4h4"/><path d="M4 16a8 8 0 0 0 14 2M20 20v-4h-4"/></I>;
const IconDoc     = (p) => <I {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></I>;
const IconExternal = (p) => <I {...p}><path d="M15 3h6v6M10 14L21 3M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></I>;

// Gemstone shape silhouettes — schematic line drawings (placeholders, intentionally minimal)
const GS = ({ children, size = 64, color = 'currentColor', strokeWidth = 1.2 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
    {children}
  </svg>
);

const ShapeRound = (p) => (
  <GS {...p}>
    <circle cx="32" cy="32" r="22" />
    <circle cx="32" cy="32" r="14" />
    <path d="M14 24 L32 32 L50 24 M14 40 L32 32 L50 40 M32 10 L32 32 L32 54" />
  </GS>
);
const ShapeOval = (p) => (
  <GS {...p}>
    <ellipse cx="32" cy="32" rx="14" ry="22" />
    <ellipse cx="32" cy="32" rx="9" ry="14" />
    <path d="M18 24 L32 32 L46 24 M18 40 L32 32 L46 40 M32 10 L32 54" />
  </GS>
);
const ShapePear = (p) => (
  <GS {...p}>
    <path d="M32 8 C20 20 18 38 22 48 C25 56 39 56 42 48 C46 38 44 20 32 8 Z" />
    <path d="M32 16 L24 32 L32 50 L40 32 Z" />
    <path d="M22 36 L42 36 M32 8 L32 50" />
  </GS>
);
const ShapeEmerald = (p) => (
  <GS {...p}>
    <path d="M18 14 L46 14 L52 20 L52 44 L46 50 L18 50 L12 44 L12 20 Z" />
    <path d="M22 18 L42 18 L46 22 L46 42 L42 46 L22 46 L18 42 L18 22 Z" />
    <path d="M18 22 L12 20 M46 22 L52 20 M18 42 L12 44 M46 42 L52 44" />
  </GS>
);
const ShapeRadiant = (p) => (
  <GS {...p}>
    <path d="M18 10 L46 10 L54 18 L54 46 L46 54 L18 54 L10 46 L10 18 Z" />
    <path d="M22 14 L42 14 L50 22 L50 42 L42 50 L22 50 L14 42 L14 22 Z" />
    <path d="M18 10 L22 14 M46 10 L42 14 M18 54 L22 50 M46 54 L42 50 M10 18 L14 22 M10 46 L14 42 M54 18 L50 22 M54 46 L50 42" />
  </GS>
);
const ShapeMarquise = (p) => (
  <GS {...p}>
    <path d="M32 6 C44 18 44 46 32 58 C20 46 20 18 32 6 Z" />
    <path d="M32 14 L26 32 L32 50 L38 32 Z" />
    <path d="M22 32 L42 32" />
  </GS>
);
const ShapePrincess = (p) => (
  <GS {...p}>
    <path d="M12 12 L52 12 L52 52 L12 52 Z" />
    <path d="M20 20 L44 20 L44 44 L20 44 Z" />
    <path d="M12 12 L20 20 M52 12 L44 20 M12 52 L20 44 M52 52 L44 44" />
    <path d="M32 12 L32 52 M12 32 L52 32" />
  </GS>
);
const ShapeCushion = (p) => (
  <GS {...p}>
    <path d="M18 10 Q10 10 10 18 L10 46 Q10 54 18 54 L46 54 Q54 54 54 46 L54 18 Q54 10 46 10 Z" />
    <path d="M22 16 Q16 16 16 22 L16 42 Q16 48 22 48 L42 48 Q48 48 48 42 L48 22 Q48 16 42 16 Z" />
    <path d="M16 22 L10 18 M16 42 L10 46 M48 22 L54 18 M48 42 L54 46" />
  </GS>
);
const ShapeAsscher = (p) => (
  <GS {...p}>
    <path d="M18 12 L46 12 L52 18 L52 46 L46 52 L18 52 L12 46 L12 18 Z" />
    <path d="M22 16 L42 16 L48 22 L48 42 L42 48 L22 48 L16 42 L16 22 Z" />
    <path d="M28 22 L36 22 L42 28 L42 36 L36 42 L28 42 L22 36 L22 28 Z" />
  </GS>
);
const ShapeHeart = (p) => (
  <GS {...p}>
    <path d="M32 54 C18 42 8 32 8 22 C8 14 14 10 20 10 C26 10 30 14 32 18 C34 14 38 10 44 10 C50 10 56 14 56 22 C56 32 46 42 32 54 Z" />
    <path d="M32 22 L22 30 L32 50 L42 30 Z" />
    <path d="M16 26 L48 26" />
  </GS>
);
const ShapeTrillion = (p) => (
  <GS {...p}>
    <path d="M32 8 L56 50 L8 50 Z" />
    <path d="M32 18 L46 42 L18 42 Z" />
    <path d="M32 8 L32 42 M8 50 L32 32 L56 50" />
  </GS>
);
const ShapeBaguette = (p) => (
  <GS {...p}>
    <path d="M14 18 L50 18 L50 46 L14 46 Z" />
    <path d="M14 22 L50 22 M14 42 L50 42 M22 18 L22 46 M32 18 L32 46 M42 18 L42 46" />
  </GS>
);
const ShapeTapered = (p) => (
  <GS {...p}>
    <path d="M14 16 L50 22 L50 42 L14 48 Z" />
    <path d="M14 21 L50 26 M14 43 L50 38 M26 18 L26 46 M38 20 L38 44" />
  </GS>
);

const ShapeHexagon = (p) => (
  <GS {...p}>
    <path d="M22 16 L42 16 L52 32 L42 48 L22 48 L12 32 Z" />
  </GS>
);

const SHAPE_ICONS = {
  round: ShapeRound, oval: ShapeOval, pear: ShapePear,
  emerald: ShapeEmerald, radiant: ShapeRadiant, marquise: ShapeMarquise,
  princess: ShapePrincess, cushion: ShapeCushion, asscher: ShapeAsscher,
  heart: ShapeHeart, trillion: ShapeTrillion, baguette: ShapeBaguette,
  tapered: ShapeTapered, hexagon: ShapeHexagon,
};

function ShapeIcon({ shape, size = 36, color }) {
  const Cmp = SHAPE_ICONS[shape] || ShapeRound;
  return <Cmp size={size} color={color || 'currentColor'} />;
}

// Eurostar logo — actual brand wordmark (transparent PNG)
function EurostarLogo({ size = 22, dark = false }) {
  return (
    <img
      src={dark ? (window.EUROSTAR_LOGO_WHITE || 'assets/eurostar-logo-white.png') : (window.EUROSTAR_LOGO_PNG || 'assets/eurostar-logo.png')}
      alt="Eurostar"
      style={{
        height: Math.round(size * 1.35) + 'px',
        width: 'auto',
        display: 'block',
        cursor: 'pointer',
      }}
    />
  );
}

Object.assign(window, {
  IconSearch, IconFilter, IconHeart, IconHeartFill, IconBag, IconBell, IconUser, IconGlobe,
  IconChev, IconArrowLeft, IconCheck, IconPlus, IconMinus, IconX, IconMenu, IconDrag,
  IconDownload, IconTruck, IconWhats, IconPhone, IconShield, IconBox,
  IconRefresh, IconDoc, IconExternal,
  ShapeIcon, SHAPE_ICONS, EurostarLogo,
});
