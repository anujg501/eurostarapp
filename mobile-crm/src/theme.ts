// Eurostar CRM design tokens — the same palette as the web CRM and the sales
// app, so a rep moving between them recognises the same product.
export const theme = {
  paper: '#F5F1E8',
  surface: '#FFFDF8',
  card: '#FBF8F1',
  ink: '#15130F',
  ink2: '#3A342A',
  meta: '#7A6F5C',
  border: '#E6E2D8',
  divider: '#EEEBE3',
  // The CRM's accent is SAPPHIRE, not the storefront's emerald. CrmTweaks in
  // crm-app.jsx ships `accent: 'sapphire'` and `skin: 'indigo'` as its defaults,
  // and [data-accent="sapphire"] in crm.css redefines the emerald custom
  // properties to these three values. The console is therefore blue everywhere
  // the shop is green — active nav pill, Mira's card, primary buttons — so the
  // app follows it. The names are kept because they are what crm.css calls
  // them; only the values differ from the shop's.
  emerald: '#1E3A8A',
  emeraldInk: '#152C66',
  emeraldSoft: '#DDE4F3',
  navy: '#1F3350',
  gold: '#C9A227',
  ruby: '#8B1E2E',
  rubySoft: '#F6E7E7',
  amber: '#7A5214',
  amberSoft: '#F5E7C4',
  amberBorder: '#E6CC7F',
  rubyBorder: '#E6B8BE',
  inputBg: '#FFFDF8',

  // The CRM's dark chrome. On the web this is the sidebar (and, on a phone, the
  // scrolling chip rail above the page); the "indigo" skin is what the office
  // runs, so the app wears the same navy rather than inventing its own.
  side: '#1E2A52',
  sideDeep: '#131B38',
  sideFg: '#FDFAF2',
  sideFgMuted: 'rgba(253,250,242,0.78)',
  sideMeta: 'rgba(253,250,242,0.40)',
  sideBorder: 'rgba(255,255,255,0.12)',
  sideHover: 'rgba(255,255,255,0.10)',

  radius: { sm: 8, md: 12, lg: 18, xl: 26 },
};
