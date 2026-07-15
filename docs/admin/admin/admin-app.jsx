// admin-app.jsx — Eurostar Sales App Admin Panel. Reads the REAL catalog from app/data.jsx.
const { useState } = React;
const W = window;
const inr = (n)=> W.formatINR ? W.formatINR(n) : '₹'+Number(n||0).toLocaleString('en-IN');
const CATS = (W.CATEGORIES||[]);
const GBY = (W.GRADES_BY_CATEGORY||{});
const CBY = (W.COLORS_BY_CATEGORY||{});
const SBY = (W.SHAPES_BY_CATEGORY||{});
const FULL = (W.FULL_SIZES||{});
const ORD_ALL = Object.values(W.ORDERS||{}).flat();
const adFindShape = (id)=> (W.SHAPES||[]).find((s)=>s.id===id)||{name:id};
const catUnit = W.catUnit || (()=> 'pc');
const unitLong = { ct:'per carat', pc:'per piece', pkt:'per packet', strip:'per strip' };

function PageHead({ title, sub, action }) {
  return <div className="ad-pagehead" style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16}}>
    <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{action}</div>;
}
function Toggle({ on, onClick }) { return <button className={`ad-toggle ${on?'on':''}`} onClick={onClick} aria-label="toggle" />; }

/* ---------------- DASHBOARD ---------------- */
function Dashboard({ go, hidden }) {
  const totalGrades = CATS.reduce((a,c)=>a+((GBY[c.id]||[]).length),0);
  const orders = ORD_ALL;
  const rfq = 3, franchise = 2;
  return (
    <div className="ad-body">
      <PageHead title="Dashboard" sub="Catalog & store overview" />
      <div className="ad-kpis">
        <div className="ad-kpi"><div className="lbl">Live categories</div><div className="val">{CATS.length - hidden.length}</div><div className="sub">{hidden.length} hidden</div></div>
        <div className="ad-kpi"><div className="lbl">Grades / sub-categories</div><div className="val">{totalGrades}</div><div className="sub">across all categories</div></div>
        <div className="ad-kpi"><div className="lbl">Open RFQ enquiries</div><div className="val">{rfq}</div><div className="sub">need a quote</div></div>
        <div className="ad-kpi"><div className="lbl">Franchise enquiries</div><div className="val">{franchise}</div><div className="sub">new</div></div>
      </div>
      <div className="ad-card ad-card-pad">
        <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:18,margin:'0 0 12px'}}>Quick actions</h3>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button className="ad-btn ad-btn-pri" onClick={()=>go('catalog')}>Manage catalog</button>
          <button className="ad-btn ad-btn-ghost" onClick={()=>go('bulk')}>Bulk upload products</button>
          <button className="ad-btn ad-btn-ghost" onClick={()=>go('media')}>Upload product images</button>
          <button className="ad-btn ad-btn-ghost" onClick={()=>go('settings')}>Store settings</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- TWEAKS PANEL ---------------- */
function TweaksPanel() {
  const read = (k,d)=>{ try { return localStorage.getItem('ad-tweak-'+k)||d; } catch(e){ return d; } };
  const [open, setOpen] = useState(false);
  const [skin, setSkin] = useState(()=>read('skin','midnight'));
  const [accent, setAccent] = useState(()=>read('accent','ruby'));
  const [density, setDensity] = useState(()=>read('density','compact'));
  React.useEffect(()=>{
    const r = document.documentElement;
    r.setAttribute('data-skin', skin); r.setAttribute('data-accent', accent); r.setAttribute('data-density', density);
    try { localStorage.setItem('ad-tweak-skin',skin); localStorage.setItem('ad-tweak-accent',accent); localStorage.setItem('ad-tweak-density',density); } catch(e){}
  }, [skin, accent, density]);
  const Seg = ({val,set,opts}) => (
    <div className="tk-seg">{opts.map(([v,l])=>(
      <button key={v} className={`tk-opt ${val===v?'on':''}`} onClick={()=>set(v)}>{l}</button>
    ))}</div>
  );
  const accents = [['emerald','#0E5C4A'],['sapphire','#1E3A8A'],['ruby','#8B1E2E'],['amber','#B7791F']];
  return (
    <React.Fragment>
      <button className="ad-tweak-fab" title="Tweaks" onClick={()=>setOpen((o)=>!o)}>{open?'✕':'✦'}</button>
      {open &&
      <div className="ad-tweak-panel">
        <h4>Tweaks</h4>
        <p className="tk-sub">Reshape the admin's feel.</p>
        <div className="tk-group"><div className="tk-glabel">Chrome skin</div>
          <Seg val={skin} set={setSkin} opts={[['midnight','Midnight'],['emerald','Emerald'],['parchment','Parchment']]} /></div>
        <div className="tk-group"><div className="tk-glabel">Accent palette</div>
          <div className="tk-swatches">{accents.map(([id,hex])=>(
            <button key={id} className={`tk-sw ${accent===id?'on':''}`} style={{background:hex}} title={id} onClick={()=>setAccent(id)} />
          ))}</div></div>
        <div className="tk-group" style={{marginBottom:0}}><div className="tk-glabel">Density</div>
          <Seg val={density} set={setDensity} opts={[['comfortable','Comfortable'],['compact','Compact']]} /></div>
      </div>}
    </React.Fragment>
  );
}

/* ---------------- CREATE CATEGORY WIZARD ---------------- */
function CreateCategory({ onDone }) {
  const [f, setF] = useState({
    name:'', short:'', blurb:'',
    sellUnit:'pc', priceUnit:'pc',
    imgColour:true, imgSizePad:true, imgHero:false,
    layout:'standard', layoutNote:'',
    weightCol:false,
  });
  const [done, setDone] = useState(false);
  const set = (k,v)=>setF((x)=>({...x,[k]:v}));
  const Radio = ({k,opts}) => (
    <div className="ad-chips">{opts.map(([val,lab])=>(
      <button key={val} type="button" className={`ad-chip ${f[k]===val?'sel':''}`} style={f[k]===val?{background:'var(--emerald-soft)',color:'var(--emerald-ink)',borderColor:'#B8D4C6'}:{}} onClick={()=>set(k,val)}>{lab}</button>
    ))}</div>
  );
  const Check = ({k,label}) => (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
      <Toggle on={f[k]} onClick={()=>set(k,!f[k])} /><span style={{fontSize:13.5}}>{label}</span>
    </div>
  );

  if (done) {
    return (
      <div className="ad-body">
        <div className="ad-card ad-card-pad" style={{textAlign:'center',padding:40,maxWidth:560,margin:'0 auto'}}>
          <div style={{width:60,height:60,borderRadius:'50%',background:'var(--emerald)',color:'var(--paper)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',fontSize:28}}>✓</div>
          <h2 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:24,margin:'0 0 8px'}}>“{f.name}” created</h2>
          <p className="ad-muted" style={{fontSize:14,margin:'0 0 20px'}}>Sold by {unitLong[f.sellUnit]} · priced per {unitLong[f.priceUnit]} · {f.layout==='standard'?'standard layout':'custom layout'}. Now add its grades, colours, shapes & pricing from the Catalog.</p>
          <button className="ad-btn ad-btn-acc" onClick={onDone}>Go to Catalog</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-body">
      <PageHead title="Create a new category" sub="Answer a few questions — this defines how the category behaves in the app" />
      <div style={{maxWidth:680,display:'grid',gap:16}}>
        <div className="ad-card ad-card-pad">
          <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:17,margin:'0 0 14px'}}>1 · Basics</h3>
          <div className="ad-grid2">
            <label><span className="ad-label">Category name *</span><input className="ad-input" style={{width:'100%'}} value={f.name} onChange={(e)=>set('name',e.target.value)} placeholder="e.g. Lab Grown Diamonds" /></label>
            <label><span className="ad-label">Short name</span><input className="ad-input" style={{width:'100%'}} value={f.short} onChange={(e)=>set('short',e.target.value)} placeholder="e.g. Lab Diamonds" /></label>
          </div>
          <label style={{display:'block',marginTop:12}}><span className="ad-label">Short description</span><textarea className="ad-input" style={{width:'100%'}} rows="2" value={f.blurb} onChange={(e)=>set('blurb',e.target.value)} placeholder="Shown on the category card" /></label>
        </div>

        <div className="ad-card ad-card-pad">
          <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:17,margin:'0 0 6px'}}>2 · How is it sold?</h3>
          <p className="ad-muted" style={{fontSize:12.5,margin:'0 0 10px'}}>The unit the customer orders in.</p>
          <Radio k="sellUnit" opts={[['pc','By pieces'],['ct','By carat'],['pkt','By packet'],['strip','By strip']]} />
        </div>

        <div className="ad-card ad-card-pad">
          <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:17,margin:'0 0 6px'}}>3 · How is it priced?</h3>
          <p className="ad-muted" style={{fontSize:12.5,margin:'0 0 10px'}}>The unit the price is quoted in (can differ from how it's sold — e.g. sold by packet, priced per piece).</p>
          <Radio k="priceUnit" opts={[['pc','Per piece'],['ct','Per carat'],['pkt','Per packet'],['strip','Per strip'],['gram','Per gram']]} />
        </div>

        <div className="ad-card ad-card-pad">
          <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:17,margin:'0 0 6px'}}>4 · Where do images appear?</h3>
          <p className="ad-muted" style={{fontSize:12.5,margin:'0 0 12px'}}>Choose where you'll add product photos for this category.</p>
          <Check k="imgColour" label="On the colour cards (one photo per colour + shape)" />
          <Check k="imgSizePad" label="As the product hero on the sizes/order screen" />
          <Check k="imgHero" label="A category hero / colour-chart image (like Ice Cut, Bracelets)" />
        </div>

        <div className="ad-card ad-card-pad">
          <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:17,margin:'0 0 6px'}}>5 · Layout</h3>
          <p className="ad-muted" style={{fontSize:12.5,margin:'0 0 10px'}}>Standard is Category → Grade → Colour → Shape → Sizes. Choose custom if this product needs a special flow.</p>
          <Radio k="layout" opts={[['standard','Standard drill-down'],['custom','Custom layout']]} />
          {f.layout==='custom' &&
          <label style={{display:'block',marginTop:12}}><span className="ad-label">Describe the custom layout you need</span>
            <textarea className="ad-input" style={{width:'100%'}} rows="3" value={f.layoutNote} onChange={(e)=>set('layoutNote',e.target.value)} placeholder="e.g. skip grade, single colour, corner-to-corner sizes with a measurement diagram, colour-tier pricing…" /></label>}
          <div style={{marginTop:12}}><Check k="weightCol" label="Show a weight column (e.g. wt per 1000 pcs / per piece)" /></div>
        </div>

        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="ad-btn ad-btn-ghost" onClick={onDone}>Cancel</button>
          <button className="ad-btn ad-btn-acc" onClick={()=>{ if(f.name.trim()) setDone(true); }}>Create category</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- CATALOG ---------------- */
function Catalog({ hidden, toggleHidden, openCat }) {
  const [adding, setAdding] = useState(false);
  const [extra, setExtra] = useState([]);
  const [f, setF] = useState({ name:'', short:'', unit:'pc', blurb:'' });
  const allCats = [...CATS, ...extra];
  const create = () => {
    if (!f.name.trim()) return;
    const id = f.name.trim().toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,18) || ('cat'+(extra.length+1));
    setExtra((xs)=>[...xs, { id, name:f.name.trim(), short:(f.short||f.name).trim(), blurb:f.blurb.trim(), unit:f.unit, isNew:true }]);
    setF({ name:'', short:'', unit:'pc', blurb:'' }); setAdding(false);
  };
  return (
    <div className="ad-body">
      <PageHead title="Catalog" sub={`${allCats.length} categories · click to manage grades, colours, shapes & pricing`}
        action={<button className="ad-btn ad-btn-acc" onClick={()=>setAdding(true)}>＋ Create new category</button>} />
      <div className="ad-cats">
        {allCats.map((c)=>{ const u=c.unit||catUnit(c.id); const isHidden=hidden.includes(c.id); return (
          <div key={c.id} className="ad-cat" style={{opacity:isHidden?0.55:1}} onClick={()=>!c.isNew&&openCat(c.id)}>
            <div className="nm">{c.name}{c.isNew && <span className="ad-tag on" style={{marginLeft:8,fontSize:10}}>NEW</span>}</div>
            <div className="bl">{c.blurb||'New category — add grades, colours, shapes & pricing.'}</div>
            <div className="ft">
              <span className={`ad-tag ${u}`}>{u.toUpperCase()} · {unitLong[u]}</span>
              <span className="ct">{(GBY[c.id]||[]).length} grades</span>
            </div>
            <div className="ft" onClick={(e)=>e.stopPropagation()}>
              <Toggle on={!isHidden} onClick={()=>toggleHidden(c.id)} />
              <span className="ad-muted" style={{fontSize:12}}>{isHidden?'Hidden from app':'Live on app'}</span>
            </div>
          </div>); })}
      </div>

      {adding &&
      <div onClick={()=>setAdding(false)} style={{position:'fixed',inset:0,background:'rgba(21,19,15,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div onClick={(e)=>e.stopPropagation()} style={{background:'var(--surface)',borderRadius:'var(--r-lg)',width:'min(480px,96vw)',boxShadow:'var(--shadow-lg)',overflow:'hidden'}}>
          <div style={{padding:'18px 22px',borderBottom:'1px solid var(--divider)',fontFamily:'var(--font-serif)',fontWeight:500,fontSize:20}}>Create new category</div>
          <div style={{padding:'18px 22px',display:'grid',gap:14}}>
            <label><div className="ad-label">Category name *</div><input className="ad-input" style={{width:'100%'}} value={f.name} onChange={(e)=>setF({...f,name:e.target.value})} placeholder="e.g. Lab Grown Diamonds" /></label>
            <label><div className="ad-label">Short name</div><input className="ad-input" style={{width:'100%'}} value={f.short} onChange={(e)=>setF({...f,short:e.target.value})} placeholder="e.g. Lab Diamonds" /></label>
            <label><div className="ad-label">Unit of sale</div>
              <select className="ad-select" style={{width:'100%'}} value={f.unit} onChange={(e)=>setF({...f,unit:e.target.value})}>
                <option value="pc">PC — by piece</option><option value="ct">CT — by carat</option>
                <option value="pkt">PKT — by packet</option><option value="strip">STRIP — by strip</option>
              </select></label>
            <label><div className="ad-label">Short description</div><textarea className="ad-input" style={{width:'100%'}} rows="2" value={f.blurb} onChange={(e)=>setF({...f,blurb:e.target.value})} placeholder="Shown on the category card" /></label>
          </div>
          <div style={{padding:'14px 22px',borderTop:'1px solid var(--divider)',display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={()=>setAdding(false)}>Cancel</button>
            <button className="ad-btn ad-btn-acc ad-btn-sm" onClick={create}>Create category</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

function CatDetail({ catId, onBack }) {
  const cat = CATS.find((c)=>c.id===catId)||{};
  const grades = GBY[catId]||[];
  const colours = CBY[catId]||[];
  const shapes = SBY[catId]||[];
  const u = catUnit(catId);
  const [gr, setGr] = useState(grades.map((g)=>({...g})));
  const [tab, setTab] = useState('grades');
  const [avGrade, setAvGrade] = useState(grades[0]?grades[0].id:'');
  const [avSub, setAvSub] = useState('');
  const [avColour, setAvColour] = useState('');
  const [avShape, setAvShape] = useState(shapes[0]||'');
  const [, setTick] = useState(0);
  const rerender = ()=>setTick((v)=>v+1);
  const sampleShape = shapes[0]||'round';
  const sizes = FULL[sampleShape]||['4.00 mm'];

  // ---- per-item availability (sold-out) helpers ----
  const coloursFor = (gradeId)=>{
    if (catId==='opaque' && W.OPAQUE_COLORS_BY_GRADE && W.OPAQUE_COLORS_BY_GRADE[gradeId]) return W.OPAQUE_COLORS_BY_GRADE[gradeId];
    if (catId==='labgrown' && W.LABGROWN_COLORS_BY_GRADE && W.LABGROWN_COLORS_BY_GRADE[gradeId]) return W.LABGROWN_COLORS_BY_GRADE[gradeId];
    if (catId==='cz' && W.CZ_COLORS_BY_GRADE && W.CZ_COLORS_BY_GRADE[gradeId]) return W.CZ_COLORS_BY_GRADE[gradeId];
    if (catId==='pearls' && W.PEARL_COLORS_BY_GRADE && W.PEARL_COLORS_BY_GRADE[gradeId]) return W.PEARL_COLORS_BY_GRADE[gradeId];
    if (catId==='corundum' && W.CORUNDUM_COLORS_BY_GRADE && W.CORUNDUM_COLORS_BY_GRADE[gradeId]) return W.CORUNDUM_COLORS_BY_GRADE[gradeId];
    if (catId==='rajkot' && W.RAJKOT_COLORS_BY_GRADE && W.RAJKOT_COLORS_BY_GRADE[gradeId]) return W.RAJKOT_COLORS_BY_GRADE[gradeId];
    return CBY[catId]||[];
  };
  const expandShapes = (list)=> list.flatMap((sid)=>{ const m=adFindShape(sid); return (m&&m.subShapes)?m.subShapes:[sid]; });

  // ---- add / remove colour ----
  const [newColName, setNewColName] = useState('');
  const [newColHex, setNewColHex] = useState('#3E8E4F');
  const extraColIds = (loadOverlay(XCOL_KEY)[catId]||[]).map((c)=>c.id);
  const addColour = ()=>{
    const name = newColName.trim(); if(!name) return;
    const id = 'x-' + name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + Math.random().toString(36).slice(2,5);
    const col = { id, name, hex: newColHex };
    const all = loadOverlay(XCOL_KEY); const arr = all[catId]||[]; arr.push(col); all[catId]=arr;
    try { localStorage.setItem(XCOL_KEY, JSON.stringify(all)); } catch(e){ alert('Storage full.'); return; }
    if (!CBY[catId]) CBY[catId]=[]; CBY[catId].push(col);   // reflect live this session
    setNewColName(''); rerender();
  };
  const removeColour = (id)=>{
    const all = loadOverlay(XCOL_KEY); all[catId]=(all[catId]||[]).filter((c)=>c.id!==id);
    try { localStorage.setItem(XCOL_KEY, JSON.stringify(all)); } catch(e){}
    if (CBY[catId]) { const i=CBY[catId].findIndex((c)=>c.id===id); if(i>=0) CBY[catId].splice(i,1); }
    rerender();
  };

  // ---- add / remove shape (pick from the master shape catalog) ----
  const allShapes = (W.SHAPES||[]);
  const available = allShapes.filter((s)=>!shapes.includes(s.id));
  const [newShape, setNewShape] = useState(available[0]?available[0].id:'');
  const extraShapeIds = loadOverlay(XSHP_KEY)[catId]||[];
  const addShape = ()=>{
    const sid = newShape; if(!sid || shapes.includes(sid)) return;
    const all = loadOverlay(XSHP_KEY); const arr = all[catId]||[]; arr.push(sid); all[catId]=arr;
    try { localStorage.setItem(XSHP_KEY, JSON.stringify(all)); } catch(e){ alert('Storage full.'); return; }
    if (!SBY[catId]) SBY[catId]=[]; SBY[catId].push(sid);
    rerender();
  };
  const removeShape = (sid)=>{
    const all = loadOverlay(XSHP_KEY); all[catId]=(all[catId]||[]).filter((x)=>x!==sid);
    try { localStorage.setItem(XSHP_KEY, JSON.stringify(all)); } catch(e){}
    if (SBY[catId]) { const i=SBY[catId].indexOf(sid); if(i>=0) SBY[catId].splice(i,1); }
    rerender();
  };

  return (
    <div className="ad-body">
      <button className="ad-btn ad-btn-ghost ad-btn-sm" style={{marginBottom:14}} onClick={onBack}>← Back to catalog</button>
      <PageHead title={cat.name} sub={`Unit of sale: ${u.toUpperCase()} (${unitLong[u]}) · ${grades.length} grades · ${colours.length} colours · ${shapes.length} shapes`}
        action={<button className="ad-btn ad-btn-acc">＋ Add grade</button>} />

      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {['grades','colours','shapes','pricing','availability'].map((t)=>(
          <button key={t} className={`ad-btn ad-btn-sm ${tab===t?'ad-btn-pri':'ad-btn-ghost'}`} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {tab==='grades' &&
      <div className="ad-card">
        <table className="ad-table">
          <thead><tr><th>Grade / sub-category</th><th>Tier</th><th>Description</th><th>Base ₹</th><th>Unit</th><th></th></tr></thead>
          <tbody>{gr.map((g,i)=>(
            <tr key={g.id}>
              <td><input className="ad-input" style={{width:160}} value={g.name} onChange={(e)=>setGr((x)=>x.map((y,j)=>j===i?{...y,name:e.target.value}:y))} /></td>
              <td><input className="ad-input" style={{width:120}} value={g.tier||''} onChange={(e)=>setGr((x)=>x.map((y,j)=>j===i?{...y,tier:e.target.value}:y))} /></td>
              <td><input className="ad-input" style={{width:'100%',minWidth:200}} value={g.desc||''} onChange={(e)=>setGr((x)=>x.map((y,j)=>j===i?{...y,desc:e.target.value}:y))} /></td>
              <td><input className="ad-input ad-num" value={g.basePrice||0} onChange={(e)=>setGr((x)=>x.map((y,j)=>j===i?{...y,basePrice:parseInt(e.target.value,10)||0}:y))} /></td>
              <td><span className={`ad-tag ${g.unit||u}`}>{(g.unit||u).toUpperCase()}</span></td>
              <td style={{textAlign:'right',whiteSpace:'nowrap'}}>
                {g.subGrades && <span className="ad-muted" style={{fontSize:11,marginRight:8}}>{g.subGrades.length} sub</span>}
                <button className="ad-btn ad-btn-ghost ad-btn-sm" style={{color:'var(--ruby)'}}>Remove</button></td>
            </tr>))}</tbody>
        </table>
        <div className="ad-card-pad" style={{borderTop:'1px solid var(--divider)'}}><button className="ad-btn ad-btn-acc ad-btn-sm">Save grades</button></div>
      </div>}

      {tab==='colours' &&
      <div className="ad-card ad-card-pad">
        <div className="ad-chips" style={{marginBottom:16}}>
          {colours.map((c)=>{ const isExtra=extraColIds.indexOf(c.id)>=0; return (
            <span key={c.id} className="ad-chip"><span className="ad-sw" style={{background:c.hex}} />{c.name}
            {isExtra && <button className="ad-chip-x" title="Remove" onClick={()=>removeColour(c.id)} style={{marginLeft:6,border:'none',background:'none',cursor:'pointer',color:'var(--ruby)',fontWeight:700}}>×</button>}
            </span>); })}
          {colours.length===0 && <span className="ad-muted">No colours configured.</span>}
        </div>
        <div style={{display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap',borderTop:'1px solid var(--divider)',paddingTop:16}}>
          <div className="ad-field"><span className="ad-label">Colour name</span>
            <input className="ad-input" style={{width:200}} placeholder="e.g. Aqua Blue" value={newColName} onChange={(e)=>setNewColName(e.target.value)} /></div>
          <div className="ad-field"><span className="ad-label">Swatch</span>
            <input type="color" value={newColHex} onChange={(e)=>setNewColHex(e.target.value)} style={{width:54,height:38,padding:2,border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',cursor:'pointer'}} /></div>
          <button className="ad-btn ad-btn-acc ad-btn-sm" onClick={addColour}>＋ Add colour</button>
        </div>
        <div className="ad-muted" style={{fontSize:12,marginTop:10}}>Added colours appear in this category on the Sales App immediately. Set their photo in Home thumbnails / Product images.</div>
      </div>}

      {tab==='shapes' &&
      <div className="ad-card ad-card-pad">
        <div className="ad-chips" style={{marginBottom:16}}>
          {shapes.map((s)=>{ const isExtra=extraShapeIds.indexOf(s)>=0; return (
            <span key={s} className="ad-chip">{adFindShape(s).name}
            {isExtra && <button className="ad-chip-x" title="Remove" onClick={()=>removeShape(s)} style={{marginLeft:6,border:'none',background:'none',cursor:'pointer',color:'var(--ruby)',fontWeight:700}}>×</button>}
            </span>); })}
        </div>
        <div style={{display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap',borderTop:'1px solid var(--divider)',paddingTop:16}}>
          {available.length>0 ? <React.Fragment>
            <div className="ad-field"><span className="ad-label">Shape</span>
              <select className="ad-select" style={{width:200}} value={newShape} onChange={(e)=>setNewShape(e.target.value)}>
                {available.map((s)=>(<option key={s.id} value={s.id}>{s.name}</option>))}
              </select></div>
            <button className="ad-btn ad-btn-acc ad-btn-sm" onClick={addShape}>＋ Add shape</button>
          </React.Fragment> : <span className="ad-muted">All standard shapes are already in this category.</span>}
        </div>
        <div className="ad-muted" style={{fontSize:12,marginTop:10}}>Shapes use their standard calibrated size chart. To add a brand-new shape with its own sizes, use the bulk-upload sheet.</div>
      </div>}

      {tab==='pricing' &&
      <div className="ad-card">
        <div className="ad-sechead"><h3>Size × price ({adFindShape(sampleShape).name})</h3><span className="meta">{u==='ct'?'₹ per carat':u==='pkt'?'₹ per piece · packet sold':'₹ per '+u}</span></div>
        <table className="ad-table">
          <thead><tr><th>Size</th><th>Rate ₹</th>{u==='pkt' && <th>Pcs / packet</th>}<th></th></tr></thead>
          <tbody>{sizes.slice(0,16).map((s)=>{ const base=(gr[0]||{}).basePrice||0; const mult=(W.SIZE_PRICE_MULTI&&W.SIZE_PRICE_MULTI[s])||1;
            return (
            <tr key={s}><td>{s}</td>
              <td><input className="ad-input ad-num" defaultValue={Math.round(base*mult)} /></td>
              {u==='pkt' && <td><input className="ad-input ad-num" defaultValue={(W.packetPcs?W.packetPcs(catId,s):144)} /></td>}
              <td className="ad-muted" style={{fontSize:11}}>auto from base × size multiplier</td></tr>); })}</tbody>
        </table>
        <div className="ad-card-pad" style={{borderTop:'1px solid var(--divider)'}}><button className="ad-btn ad-btn-acc ad-btn-sm">Save pricing</button> <span className="ad-muted" style={{fontSize:12,marginLeft:8}}>Bulk-edit all sizes via the upload sheet.</span></div>
      </div>}

      {tab==='availability' &&
      (()=>{ const g=grades.find((x)=>x.id===avGrade)||grades[0]||{};
        const subs=g.subGrades||null; const curSub=subs?(subs.find((s)=>s.id===avSub)||subs[0]):null;
        const effGradeId=curSub?g.id+'-'+curSub.id:g.id;
        const isSeries=!!(curSub&&curSub.directSize); const seriesKey=isSeries?curSub.id:null;
        const designs=isSeries?((W.POLKI_SERIES_DESIGNS||{})[seriesKey]||[]):null;
        const avColours=coloursFor(g.id); const curColour=avColours.find((c)=>c.id===avColour)||avColours[0];
        const rawShapes=(curColour&&curColour.shapes)?curColour.shapes:shapes; const avShapes=expandShapes(rawShapes);
        const curShape=isSeries?'uneven':(avShapes.includes(avShape)?avShape:(avShapes[0]||'round'));
        const colorId=isSeries?((avColours[0]&&avColours[0].id)||'default'):((curColour&&curColour.id)||'');
        const items=isSeries?designs.map((d)=>({key:d.id,label:d.name+' · '+((d.dims||[d.w,d.h]).map((n)=>Number(n).toFixed(2)).join('×'))+' mm'})):(FULL[curShape]||['4.00 mm']).map((s)=>({key:s,label:s}));
        const soCount=(W.soldOutForCat?W.soldOutForCat(catId):[]).length;
        const isSO=(k)=> W.isSoldOut && W.isSoldOut(catId, effGradeId, colorId, curShape, k);
        const toggle=(k)=>{ W.setSoldOutItem(catId, effGradeId, colorId, curShape, k, !isSO(k)); rerender(); };
        return (
      <div className="ad-card ad-card-pad">
        <div className="ad-sechead" style={{padding:0,marginBottom:14}}><h3>Item availability</h3><span className="meta">{soCount} item{soCount===1?'':'s'} sold out in this category</span></div>
        <p className="ad-muted" style={{fontSize:13,margin:'0 0 16px'}}>Mark an individual {isSeries?'design':'size'} <strong>Sold out</strong> to take just that item offline. On the Sales App it stays visible but greyed out and can&rsquo;t be ordered — the rest of the category is unaffected.</p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end',marginBottom:16}}>
          <div className="ad-field"><span className="ad-label">Grade</span>
            <select className="ad-select" style={{minWidth:170}} value={avGrade} onChange={(e)=>{setAvGrade(e.target.value);setAvSub('');setAvColour('');}}>
              {grades.map((gg)=>(<option key={gg.id} value={gg.id}>{gg.name}</option>))}
            </select></div>
          {subs &&
          <div className="ad-field"><span className="ad-label">{isSeries?'Series':'Type'}</span>
            <select className="ad-select" style={{minWidth:150}} value={curSub?curSub.id:''} onChange={(e)=>setAvSub(e.target.value)}>
              {subs.map((s)=>(<option key={s.id} value={s.id}>{s.name}</option>))}
            </select></div>}
          {!isSeries &&
          <div className="ad-field"><span className="ad-label">Colour</span>
            <select className="ad-select" style={{minWidth:170}} value={curColour?curColour.id:''} onChange={(e)=>setAvColour(e.target.value)}>
              {avColours.map((c)=>(<option key={c.id} value={c.id}>{c.name}</option>))}
            </select></div>}
          {!isSeries &&
          <div className="ad-field"><span className="ad-label">Shape</span>
            <select className="ad-select" style={{minWidth:150}} value={curShape} onChange={(e)=>setAvShape(e.target.value)}>
              {avShapes.map((sid)=>(<option key={sid} value={sid}>{adFindShape(sid).name}</option>))}
            </select></div>}
        </div>
        <table className="ad-table">
          <thead><tr><th>{isSeries?'Design':'Size'}</th><th>Status</th><th style={{textAlign:'right'}}>Availability</th></tr></thead>
          <tbody>{items.map((it)=>{ const so=isSO(it.key); return (
            <tr key={it.key} style={so?{background:'#FCEEEE'}:undefined}>
              <td>{it.label}</td>
              <td>{so ? <span className="ad-tag" style={{background:'var(--ruby-soft,#F2DEDE)',color:'var(--ruby,#8B1E2E)'}}>Sold out</span> : <span className="ad-tag on">Online</span>}</td>
              <td style={{textAlign:'right'}}><Toggle on={!so} onClick={()=>toggle(it.key)} /></td>
            </tr>); })}</tbody>
        </table>
        {soCount>0 &&
        <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--divider)'}}>
          <button className="ad-btn ad-btn-ghost ad-btn-sm" style={{color:'var(--ruby)'}} onClick={()=>{ if(!confirm('Bring all sold-out items in '+cat.name+' back online?')) return; (W.soldOutForCat(catId)||[]).forEach((k)=>{ const p=k.split('|'); W.setSoldOutItem(p[0],p[1],p[2],p[3],p[4],false); }); rerender(); }}>Bring all {soCount} back online</button>
        </div>}
      </div>); })()}
    </div>
  );
}

/* ---------------- BULK UPLOAD ---------------- */
const BULK_COLS = ['sku','name','category','sub_category','grade','shape','size','tone','moq','order_unit','price_unit','rate','pcs_per_packet','image_url','description'];
const BULK_REQUIRED = ['name','category','grade','size','moq','order_unit','price_unit','rate'];
const BULK_ORDER_UNITS = ['pc','ct','pkt','strip'];
const BULK_PRICE_UNITS = ['pc','ct','pkt','strip','gram'];

function parseCSV(text){
  const rows=[]; let i=0, field='', row=[], inQ=false; const N=text.length;
  const pushF=()=>{ row.push(field); field=''; };
  const pushR=()=>{ rows.push(row); row=[]; };
  while(i<N){ const c=text[i];
    if(inQ){ if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else inQ=false; } else field+=c; }
    else { if(c==='"') inQ=true; else if(c===','){ pushF(); } else if(c==='\n'){ pushF(); pushR(); } else if(c==='\r'){} else field+=c; }
    i++;
  }
  if(field.length||row.length){ pushF(); pushR(); }
  return rows.filter((r)=>r.some((v)=>String(v).trim()!==''));
}

function validateRows(header, dataRows){
  const idx={}; header.forEach((h,i)=>idx[h.trim().toLowerCase()]=i);
  const catNames = new Set();
  CATS.forEach((c)=>{ if(c.name) catNames.add(c.name.toLowerCase()); if(c.short) catNames.add(c.short.toLowerCase()); });
  return dataRows.map((cells, n)=>{
    const get=(k)=>{ const j=idx[k]; return j==null?'':String(cells[j]==null?'':cells[j]).trim(); };
    const errs=[], warns=[];
    BULK_REQUIRED.forEach((k)=>{ if(!get(k)) errs.push('Missing '+k); });
    const ou=get('order_unit').toLowerCase();
    if(ou && !BULK_ORDER_UNITS.includes(ou)) errs.push('order_unit "'+get('order_unit')+'" not one of '+BULK_ORDER_UNITS.join('/'));
    const pu=get('price_unit').toLowerCase();
    if(pu && !BULK_PRICE_UNITS.includes(pu)) errs.push('price_unit "'+get('price_unit')+'" not one of '+BULK_PRICE_UNITS.join('/'));
    const rate=get('rate').replace(/[₹,\s]/g,'');
    if(get('rate') && isNaN(Number(rate))) errs.push('Rate not a number');
    if(get('moq') && isNaN(Number(get('moq').replace(/[,\s]/g,'')))) errs.push('MOQ not a number');
    if(ou==='pkt' && !get('pcs_per_packet')) warns.push('packet order but no pcs_per_packet');
    const cat=get('category').toLowerCase();
    if(cat && catNames.size && !catNames.has(cat)) warns.push('New category "'+get('category')+'" (will be created)');
    return { line:n+2, name:get('name'), category:get('category'), grade:get('grade'), size:get('size'),
      rate:get('rate'), unit:get('order_unit')+' → '+get('price_unit'), errs, warns,
      status: errs.length?'error':(warns.length?'warn':'ok') };
  });
}

function BulkUpload(){
  const [stage, setStage] = useState('drop'); // drop -> preview -> done
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [committed, setCommitted] = useState(0);
  const inputRef = React.useRef(null);

  const handleText=(name, text)=>{
    const parsed=parseCSV(text);
    if(parsed.length<2){ alert('File looks empty or has no data rows.'); return; }
    const header=parsed[0];
    const validated=validateRows(header, parsed.slice(1));
    setFileName(name); setRows(validated); setStage('preview');
  };
  const onFile=(f)=>{ if(!f) return; const r=new FileReader(); r.onload=()=>handleText(f.name, String(r.result)); r.readAsText(f); };
  const onDrop=(e)=>{ e.preventDefault(); const f=e.dataTransfer.files&&e.dataTransfer.files[0]; onFile(f); };

  const counts = rows.reduce((a,r)=>{ a[r.status]++; a.total++; return a; }, {ok:0,warn:0,error:0,total:0});
  const blocking = counts.error>0;
  const commit=()=>{ setCommitted(counts.ok+counts.warn); setStage('done'); };
  const reset=()=>{ setStage('drop'); setRows([]); setFileName(''); if(inputRef.current) inputRef.current.value=''; };

  const Step=({n,label,on})=>(
    <div style={{display:'flex',alignItems:'center',gap:8,opacity:on?1:0.45}}>
      <span style={{width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:12,fontWeight:700,background:on?'var(--emerald)':'var(--paper-2)',color:on?'#fff':'var(--fg-meta)'}}>{n}</span>
      <span style={{fontSize:13,fontWeight:600,color:on?'var(--fg)':'var(--fg-meta)'}}>{label}</span>
    </div>
  );

  return (
    <div className="ad-body">
      <PageHead title="Bulk upload products" sub="Add or update products in bulk via Excel / CSV" />

      <div style={{display:'flex',gap:18,alignItems:'center',marginBottom:18,flexWrap:'wrap'}}>
        <Step n="1" label="Get template" on={true} />
        <span style={{flex:'0 0 22px',height:1,background:'var(--divider)'}} />
        <Step n="2" label="Upload & validate" on={stage!=='drop'||true} />
        <span style={{flex:'0 0 22px',height:1,background:'var(--divider)'}} />
        <Step n="3" label="Commit" on={stage==='done'} />
      </div>

      {/* Step 1 — template */}
      <div className="ad-card ad-card-pad" style={{marginBottom:18}}>
        <div className="ad-sechead" style={{marginBottom:10}}><h3>1 · Download the template</h3></div>
        <p className="ad-muted" style={{fontSize:13,margin:'0 0 14px',lineHeight:1.55,maxWidth:680}}>
          Fill one row per product. Required: <strong>name, category, grade, size, moq, order_unit, price_unit, rate</strong>.
          <code>order_unit</code> = how the customer buys (pc · ct · pkt · strip); <code>price_unit</code> = how it's priced (pc · ct · pkt · strip · gram). For packet products add <code>pcs_per_packet</code>. Rate is the price per <strong>price_unit</strong>.
        </p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <a className="ad-btn ad-btn-ghost ad-btn-sm" href="../templates/Eurostar Products - One Sheet Per Category.xlsx" download>↓ Workbook — one sheet per category (recommended)</a>
          <a className="ad-btn ad-btn-ghost ad-btn-sm" href="../templates/Eurostar Products Template -sample rows-.xlsx" download>↓ Single sheet with sample rows</a>
          <a className="ad-btn ad-btn-ghost ad-btn-sm" href="../templates/Eurostar Products Template -blank-.xlsx" download>↓ Blank (headers only)</a>
        </div>
        <div className="ad-muted" style={{fontSize:12,marginTop:10}}>The recommended workbook has a separate tab for each of the {CATS.length} categories, pre-filled with its grades, shapes &amp; colours. Every new category you add gets its own tab.</div>
      </div>

      {/* Step 2 — upload */}
      <div className="ad-card ad-card-pad" style={{marginBottom:18}}>
        <div className="ad-sechead" style={{marginBottom:10}}><h3>2 · Upload your file</h3></div>
        <input ref={inputRef} type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={(e)=>onFile(e.target.files&&e.target.files[0])} />
        {stage==='drop' ?
          <div className="ad-drop" onClick={()=>inputRef.current&&inputRef.current.click()}
               onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}>
            <div style={{fontSize:15,fontWeight:600,color:'var(--fg)'}}>Drop your CSV here</div>
            <div style={{marginTop:6}}>or click to browse — we'll validate every row before anything is saved</div>
          </div>
          :
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:14}}>
              <strong style={{fontSize:14}}>📄 {fileName}</strong>
              <span className="ad-muted" style={{fontSize:12.5}}>{counts.total} rows</span>
              <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={reset} style={{marginLeft:'auto'}}>Choose another file</button>
            </div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14}}>
              <span style={{...pillBox,background:'var(--emerald-soft)',color:'var(--emerald-ink)'}}>✓ {counts.ok} ready</span>
              {counts.warn>0 && <span style={{...pillBox,background:'var(--amber-soft)',color:'#7A5214'}}>⚠ {counts.warn} with warnings</span>}
              {counts.error>0 && <span style={{...pillBox,background:'#F6DEDE',color:'#8B1E2E'}}>✕ {counts.error} blocked</span>}
            </div>
            <div className="ad-card" style={{overflowX:'auto',marginBottom:0}}>
              <table className="ad-table" style={{minWidth:760}}>
                <thead><tr><th>Row</th><th>Status</th><th>Name</th><th>Category</th><th>Grade</th><th>Size</th><th>Rate</th><th>Order → Price</th><th>Notes</th></tr></thead>
                <tbody>{rows.slice(0,60).map((r,i)=>(
                  <tr key={i} style={r.status==='error'?{background:'#FCEEEE'}:undefined}>
                    <td className="ad-id">{r.line}</td>
                    <td>{r.status==='ok'?<span style={{color:'var(--emerald-ink)',fontWeight:700}}>✓</span>:r.status==='warn'?<span style={{color:'#B7791F',fontWeight:700}}>⚠</span>:<span style={{color:'#8B1E2E',fontWeight:700}}>✕</span>}</td>
                    <td>{r.name||<em className="ad-muted">—</em>}</td>
                    <td className="ad-muted">{r.category}</td>
                    <td className="ad-muted">{r.grade}</td>
                    <td className="ad-muted">{r.size}</td>
                    <td className="ad-amt">{r.rate}</td>
                    <td className="ad-muted">{r.unit}</td>
                    <td style={{fontSize:12,color:r.errs.length?'#8B1E2E':'#7A5214'}}>{[...r.errs,...r.warns].join(' · ')||<span className="ad-muted">—</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {rows.length>60 && <div className="ad-muted" style={{fontSize:12,marginTop:8}}>Showing first 60 of {rows.length} rows.</div>}
            <div style={{marginTop:16,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <button className="ad-btn ad-btn-pri" disabled={blocking} onClick={commit}
                style={blocking?{opacity:0.45,cursor:'not-allowed'}:undefined}>
                Commit {counts.ok+counts.warn} {counts.warn?'(incl. warnings)':''} products
              </button>
              {blocking && <span style={{fontSize:12.5,color:'#8B1E2E'}}>Fix the {counts.error} blocked row{counts.error>1?'s':''} first, then re-upload.</span>}
            </div>
          </div>
        }
      </div>

      {/* Step 3 — done */}
      {stage==='done' &&
      <div className="ad-card ad-card-pad" style={{borderColor:'var(--emerald)',background:'var(--emerald-soft)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:26}}>✅</span>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:'var(--emerald-ink)'}}>{committed} products committed to the catalog</div>
            <div className="ad-muted" style={{fontSize:12.5,marginTop:3}}>From {fileName}. This upload is versioned — you can roll back within 24h from Settings.</div>
          </div>
          <button className="ad-btn ad-btn-ghost ad-btn-sm" style={{marginLeft:'auto'}} onClick={reset}>Upload another file</button>
        </div>
      </div>}
    </div>
  );
}
const pillBox = { display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:999,fontSize:12.5,fontWeight:700 };

/* ---------------- MEDIA ---------------- */
const XCOL_KEY = 'eurostar-extra-colors-v1';
const XSHP_KEY = 'eurostar-extra-shapes-v1';
function loadOverlay(key){ try { return JSON.parse(localStorage.getItem(key)||'{}')||{}; } catch(e){ return {}; } }
const CAT_THUMB_KEY = 'eurostar-cat-thumbs-v1';
const SHAPE_THUMB_KEY = 'eurostar-shape-thumbs-v1';
function loadThumbStore(key){ try { return JSON.parse(localStorage.getItem(key)||'{}')||{}; } catch(e){ return {}; } }
function saveThumbStore(key, id, url){
  const all = loadThumbStore(key);
  if (url) all[id] = url; else delete all[id];
  try { localStorage.setItem(key, JSON.stringify(all)); return true; }
  catch(e){ alert('Browser storage is full — try a smaller image.'); return false; }
}
function adThumbCompress(file, maxDim=600, q=0.82){
  return new Promise((res, rej)=>{
    const r = new FileReader();
    r.onload = ()=>{ const im = new Image();
      im.onload = ()=>{ let w=im.width,h=im.height;
        if (w>=h && w>maxDim){ h=Math.round(h*maxDim/w); w=maxDim; }
        else if (h>w && h>maxDim){ w=Math.round(w*maxDim/h); h=maxDim; }
        else if (w===h && w>maxDim){ w=maxDim; h=maxDim; }
        const c=document.createElement('canvas'); c.width=w; c.height=h;
        const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.drawImage(im,0,0,w,h);
        res(c.toDataURL('image/jpeg', q)); };
      im.onerror=rej; im.src=r.result; };
    r.onerror=rej; r.readAsDataURL(file);
  });
}
function ThumbCell({ storeKey, id, label, hint, sw }) {
  const [img, setImg] = useState(()=>loadThumbStore(storeKey)[id]||'');
  const [busy, setBusy] = useState(false);
  const ref = React.useRef(null);
  const onPick = async (e)=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; setBusy(true);
    try { const url=await adThumbCompress(f); if(saveThumbStore(storeKey,id,url)) setImg(url); }
    catch(err){ alert('Could not read that image.'); } setBusy(false); e.target.value=''; };
  const onRemove = ()=>{ saveThumbStore(storeKey,id,null); setImg(''); };
  return (
    <div className="ad-thumb-cell">
      <div className="ad-thumb-art">
        {img ? <img src={img} alt={label} /> : <span className="ad-thumb-empty" style={sw?{background:sw}:undefined}></span>}
      </div>
      <div className="ad-thumb-label">{label}</div>
      {hint && <div className="ad-muted" style={{fontSize:11.5}}>{hint}</div>}
      <div style={{display:'flex',gap:6,marginTop:4,flexWrap:'wrap'}}>
        <input ref={ref} type="file" accept="image/*" onChange={onPick} style={{display:'none'}} />
        <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={()=>ref.current&&ref.current.click()}>{busy?'Saving…':img?'Change':'＋ Upload'}</button>
        {img && <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={onRemove}>Remove</button>}
      </div>
    </div>
  );
}
function HomeThumbs() {
  const shapes = (W.SHAPES||[]);
  return (
    <div className="ad-body">
      <PageHead title="Home thumbnails" sub="Set the images customers see on the Sales App home page — one photo per category and one per shape." />
      <div className="ad-card ad-card-pad">
        <div className="ad-sechead"><h3>Category thumbnails</h3><span className="meta">{CATS.length} categories</span></div>
        <div className="ad-thumb-grid">
          {CATS.map((c)=>(<ThumbCell key={c.id} storeKey={CAT_THUMB_KEY} id={c.id} label={c.name} hint="Square image works best" />))}
        </div>
      </div>
      <div className="ad-card ad-card-pad">
        <div className="ad-sechead"><h3>Shape thumbnails</h3><span className="meta">{shapes.length} shapes</span></div>
        <div className="ad-thumb-grid">
          {shapes.map((s)=>(<ThumbCell key={s.id} storeKey={SHAPE_THUMB_KEY} id={s.id} label={s.name} />))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- MEDIA (per-colour product photos) ---------------- */
function Media() {
  const [cat, setCat] = useState(CATS[0]?CATS[0].id:'');
  const colours = CBY[cat]||[];
  const shapes = SBY[cat]||[];
  return (
    <div className="ad-body">
      <PageHead title="Product images" sub="Upload one photo per colour + shape — shows across all grades & sizes" />
      <div className="ad-card ad-card-pad">
        <div className="ad-field" style={{maxWidth:280}}>
          <span className="ad-label">Category</span>
          <select className="ad-select" style={{width:'100%'}} value={cat} onChange={(e)=>setCat(e.target.value)}>
            {CATS.map((c)=>(<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="ad-table" style={{minWidth:480}}>
            <thead><tr><th>Colour</th>{shapes.map((s)=>(<th key={s}>{adFindShape(s).name}</th>))}</tr></thead>
            <tbody>{colours.map((cl)=>(
              <tr key={cl.id}><td><span className="ad-sw" style={{background:cl.hex,marginRight:8}} />{cl.name}</td>
              {shapes.map((s)=>(<td key={s}><button className="ad-btn ad-btn-ghost ad-btn-sm">＋ Upload</button></td>))}</tr>
            ))}</tbody>
          </table>
        </div>
        <div className="ad-muted" style={{fontSize:12,marginTop:12}}>Tip: name files <code>{cat}_colour_shape.jpg</code> and bulk-upload via the image sheet.</div>
      </div>
    </div>
  );
}

/* ---------------- ORDERS / RFQ / FRANCHISE ---------------- */
function Orders() {
  const orders = ORD_ALL;
  return (
    <div className="ad-body">
      <PageHead title="Orders" sub="Orders received from the app (read-only — fulfilment is handled in the CRM)" />
      <div className="ad-card">
        <table className="ad-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th style={{textAlign:'right'}}>Value</th></tr></thead>
          <tbody>{orders.length? orders.map((o,i)=>(
            <tr key={i}><td className="ad-id">{o.id||('SO-'+(1000+i))}</td><td>{o.company||o.customer||'—'}</td><td className="ad-muted">{o.items||o.lines||'—'}</td>
            <td><span className="ad-tag on">{o.status||'received'}</span></td><td className="ad-amt" style={{textAlign:'right'}}>{inr(o.total||o.value||0)}</td></tr>
          )) : <tr><td colSpan="5" className="ad-muted" style={{padding:'16px'}}>Orders placed in the app appear here. Fulfilment & dispatch are managed in the CRM.</td></tr>}</tbody>
        </table>
      </div>
    </div>
  );
}

function Enquiries() {
  return (
    <div className="ad-body">
      <PageHead title="Enquiries" sub="RFQ & franchise requests submitted from the app" />
      <div className="ad-card">
        <div className="ad-sechead"><h3>RFQ enquiries</h3><span className="meta">₹10,000 min order</span></div>
        <table className="ad-table">
          <thead><tr><th>Ref</th><th>Product</th><th>Qty</th><th>City</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td className="ad-id">RFQ-3380</td><td>Moissanite DEF Round 8.00 mm</td><td className="ad-muted">500 pcs</td><td className="ad-muted">Hyderabad</td><td><span className="ad-tag pkt">open</span></td></tr>
            <tr><td className="ad-id">RFQ-3376</td><td>Lab Sapphire Oval (IGI)</td><td className="ad-muted">200 pcs</td><td className="ad-muted">Mumbai</td><td><span className="ad-tag pkt">open</span></td></tr>
          </tbody>
        </table>
      </div>
      <div className="ad-card">
        <div className="ad-sechead"><h3>Franchise enquiries</h3></div>
        <table className="ad-table">
          <thead><tr><th>Name</th><th>City</th><th>Investment</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Suresh Traders</td><td className="ad-muted">Indore</td><td className="ad-muted">₹10–25 lakh</td><td><span className="ad-tag on">new</span></td></tr>
            <tr><td>Gem Palace</td><td className="ad-muted">Nagpur</td><td className="ad-muted">₹25 lakh+</td><td><span className="ad-tag on">new</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- SPLASH / POP-UP ---------------- */
function SplashAdmin() {
  const read = ()=>{ try { return localStorage.getItem('eurostar-splash-image')||''; } catch(e){ return ''; } };
  const [img, setImg] = useState(read);
  const [active, setActive] = useState(()=>{ try { return localStorage.getItem('eurostar-splash-active')!=='0'; } catch(e){ return true; } });
  const fileRef = React.useRef(null);
  const onFile = (e)=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader();
    r.onload=()=>{ setImg(r.result); try { localStorage.setItem('eurostar-splash-image',r.result); } catch(err){ alert('Image too large for browser storage — use a smaller file.'); } };
    r.readAsDataURL(f); };
  const remove = ()=>{ setImg(''); try { localStorage.removeItem('eurostar-splash-image'); } catch(e){} };
  const toggle = ()=>{ const v=!active; setActive(v); try { localStorage.setItem('eurostar-splash-active', v?'1':'0'); } catch(e){} };
  const [preview, setPreview] = useState(false);
  return (
    <div className="ad-body">
      <PageHead title="Pop-up window" sub="Upload the splash image shown once after a customer signs in — new categories, offers & discounts" />
      <div className="ad-card ad-card-pad" style={{maxWidth:560}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <Toggle on={active} onClick={toggle} />
          <span style={{fontSize:14,fontWeight:600}}>{active?'Pop-up is ON — shown to customers':'Pop-up is OFF'}</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:'none'}} />
        {img ?
        <div>
          <div style={{borderRadius:'var(--r-lg)',overflow:'hidden',border:'1px solid var(--border)',marginBottom:14,maxWidth:360}}>
            <img src={img} alt="Pop-up preview" style={{width:'100%',display:'block'}} />
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={()=>fileRef.current&&fileRef.current.click()}>Replace image</button>
            <button className="ad-btn ad-btn-ghost ad-btn-sm" style={{color:'var(--ruby)'}} onClick={remove}>Remove</button>
          </div>
        </div> :
        <button onClick={()=>fileRef.current&&fileRef.current.click()} style={{
          width:'100%',maxWidth:360,padding:'40px 16px',background:'var(--surface-2)',
          border:'1.5px dashed var(--border-strong)',borderRadius:'var(--r-lg)',cursor:'pointer',
          display:'flex',flexDirection:'column',alignItems:'center',gap:8,color:'var(--fg-muted)',fontFamily:'inherit'}}>
          <span style={{fontSize:30}}>⬆</span>
          <span style={{fontSize:14,fontWeight:600,color:'var(--fg)'}}>Upload pop-up image</span>
          <span style={{fontSize:12}}>Portrait (4:5) works best · PNG or JPG</span>
        </button>}
        <div className="ad-muted" style={{fontSize:12.5,marginTop:16,lineHeight:1.55}}>
          Shown once per session, centred, and must be dismissed before the customer can browse. Recommended size 1080 × 1350 px.
        </div>
        <button className="ad-btn ad-btn-pri ad-btn-sm" style={{marginTop:14}} onClick={()=>setPreview(true)}>👁 Preview pop-up</button>
      </div>

      {preview &&
      <div onClick={()=>setPreview(false)} style={{position:'fixed',inset:0,zIndex:300,background:'rgba(21,19,15,0.74)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div onClick={(e)=>e.stopPropagation()} style={{position:'relative',width:'min(440px,92vw)',maxHeight:'88vh',background:'var(--surface)',borderRadius:'var(--r-xl)',overflow:'hidden',boxShadow:'var(--shadow-lg)'}}>
          <button onClick={()=>setPreview(false)} aria-label="Close" style={{position:'absolute',top:12,right:12,zIndex:2,width:36,height:36,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(21,19,15,0.55)',color:'#fff',fontSize:20,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          {img ?
          <img src={img} alt="Pop-up" style={{width:'100%',display:'block',maxHeight:'82vh',objectFit:'contain',background:'var(--paper-2)'}} /> :
          <div style={{aspectRatio:'4 / 5',background:'linear-gradient(150deg,#0E5C4A,#0A3F33)',color:'var(--paper)',padding:'44px 36px',display:'flex',flexDirection:'column',justifyContent:'center',textAlign:'center'}}>
            <div style={{fontSize:12,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(245,231,196,0.85)',fontWeight:600,marginBottom:16}}>What's new</div>
            <div style={{fontFamily:'var(--font-serif)',fontSize:34,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:16}}>New arrivals,<br/><em style={{color:'#F5E7C4'}}>fresh offers</em> &amp; deals</div>
            <p style={{fontSize:14,color:'rgba(253,250,242,0.78)',lineHeight:1.55,margin:'0 auto',maxWidth:'32ch'}}>Upload an image above to replace this placeholder.</p>
          </div>}
        </div>
      </div>}
    </div>
  );
}

/* ---------------- REP BROADCAST (once-a-day pop-up for sales reps) ---------------- */
function RepBroadcast() {
  const readImg = ()=>{ try { return localStorage.getItem('eurostar-rep-announce-image')||''; } catch(e){ return ''; } };
  const [img, setImg] = useState(readImg);
  const [active, setActive] = useState(()=>{ try { return localStorage.getItem('eurostar-rep-announce-active')==='1'; } catch(e){ return false; } });
  const [updated, setUpdated] = useState(()=>{ try { return localStorage.getItem('eurostar-rep-announce-updated')||''; } catch(e){ return ''; } });
  const [title, setTitle] = useState(()=>{ try { return localStorage.getItem('eurostar-rep-announce-title')||''; } catch(e){ return ''; } });
  const [msg, setMsg] = useState(()=>{ try { return localStorage.getItem('eurostar-rep-announce-msg')||''; } catch(e){ return ''; } });
  const [badge, setBadge] = useState(()=>{ try { return localStorage.getItem('eurostar-rep-announce-badge')||''; } catch(e){ return ''; } });
  const saveText = ()=>{ try {
      localStorage.setItem('eurostar-rep-announce-title', title);
      localStorage.setItem('eurostar-rep-announce-msg', msg);
      localStorage.setItem('eurostar-rep-announce-badge', badge);
    } catch(e){} stamp(); alert('Saved & pushed. Reps will see this message once on their next visit today.'); };
  const [preview, setPreview] = useState(false);
  const fileRef = React.useRef(null);
  const stamp = ()=>{ const t=String(Date.now()); setUpdated(t); try { localStorage.setItem('eurostar-rep-announce-updated',t); } catch(e){} };
  const onFile = async (e)=>{ const f=e.target.files&&e.target.files[0]; if(!f) return;
    try { const data = await adThumbCompress(f, 1100, 0.85); setImg(data);
      localStorage.setItem('eurostar-rep-announce-image', data); stamp();
    } catch(err){ alert('Could not read that image — try a smaller file.'); } };
  const remove = ()=>{ setImg(''); try { localStorage.removeItem('eurostar-rep-announce-image'); } catch(e){} };
  const toggle = ()=>{ const v=!active; setActive(v); try { localStorage.setItem('eurostar-rep-announce-active', v?'1':'0'); } catch(e){} if(v) stamp(); };
  const pushAgain = ()=>{ stamp(); alert('Pushed. Every rep will see this banner once on their next visit today.'); };
  const fmt = (t)=>{ if(!t) return '—'; try { return new Date(Number(t)).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); } catch(e){ return '—'; } };
  return (
    <div className="ad-body">
      <PageHead title="Rep broadcast" sub="Upload a single image shown once a day to every sales rep in their CRM — new products, push items & announcements" />
      <div className="ad-card ad-card-pad" style={{maxWidth:560}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <Toggle on={active} onClick={toggle} />
          <span style={{fontSize:14,fontWeight:600}}>{active?'Broadcast is ON — reps will see it':'Broadcast is OFF'}</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:'none'}} />
        {img ?
        <div>
          <div style={{borderRadius:'var(--r-lg)',overflow:'hidden',border:'1px solid var(--border)',marginBottom:14,maxWidth:360}}>
            <img src={img} alt="Broadcast preview" style={{width:'100%',display:'block'}} />
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={()=>fileRef.current&&fileRef.current.click()}>Replace image</button>
            <button className="ad-btn ad-btn-pri ad-btn-sm" onClick={pushAgain}>Push again today</button>
            <button className="ad-btn ad-btn-ghost ad-btn-sm" style={{color:'var(--ruby)'}} onClick={remove}>Remove</button>
          </div>
        </div> :
        <button onClick={()=>fileRef.current&&fileRef.current.click()} style={{
          width:'100%',maxWidth:360,padding:'40px 16px',background:'var(--surface-2)',
          border:'1.5px dashed var(--border-strong)',borderRadius:'var(--r-lg)',cursor:'pointer',
          display:'flex',flexDirection:'column',alignItems:'center',gap:8,color:'var(--fg-muted)',fontFamily:'inherit'}}>
          <span style={{fontSize:30}}>⬆</span>
          <span style={{fontSize:14,fontWeight:600,color:'var(--fg)'}}>Upload broadcast image</span>
          <span style={{fontSize:12}}>New product flyer, offer or notice · PNG or JPG</span>
        </button>}
        <div className="ad-muted" style={{fontSize:12.5,marginTop:16,lineHeight:1.55}}>
          Each rep sees this <strong>once a day</strong> when they open their CRM — they can dismiss it and carry on. Use <strong>Push again today</strong> after replacing the image to re-show it the same day. Last pushed: <strong>{fmt(updated)}</strong>.
        </div>
        <button className="ad-btn ad-btn-pri ad-btn-sm" style={{marginTop:14}} onClick={()=>setPreview(true)}>👁 Preview what reps see</button>
      </div>

      <div className="ad-card ad-card-pad" style={{maxWidth:560}}>
        <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:17,margin:'0 0 4px'}}>Message to reps</h3>
        <p className="ad-muted" style={{fontSize:12.5,margin:'0 0 16px'}}>Shown as a styled card in the rep pop-up. Use this on its own, or together with an image above.</p>
        <div className="ad-field"><span className="ad-label">Headline</span>
          <input className="ad-input" style={{width:'100%'}} value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="New Laser Engraved products added" /></div>
        <div className="ad-field" style={{marginTop:12}}><span className="ad-label">Message</span>
          <textarea className="ad-input" style={{width:'100%',minHeight:80,resize:'vertical',fontFamily:'inherit',lineHeight:1.5}} value={msg} onChange={(e)=>setMsg(e.target.value)} placeholder="Please offer these to your customers this month." /></div>
        <div className="ad-field" style={{marginTop:12}}><span className="ad-label">Highlight badge (optional)</span>
          <input className="ad-input" style={{width:'100%'}} value={badge} onChange={(e)=>setBadge(e.target.value)} placeholder="Special extra 2% commission this month" /></div>
        <button className="ad-btn ad-btn-acc ad-btn-sm" style={{marginTop:14}} onClick={saveText}>Save &amp; push message</button>
      </div>

      {preview &&
      <div onClick={()=>setPreview(false)} style={{position:'fixed',inset:0,zIndex:300,background:'rgba(21,19,15,0.74)',backdropFilter:'blur(5px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <div onClick={(e)=>e.stopPropagation()} style={{position:'relative',width:'min(440px,92vw)',maxHeight:'88vh',background:'var(--surface)',borderRadius:'var(--r-xl)',overflow:'hidden',boxShadow:'var(--shadow-lg)'}}>
          <button onClick={()=>setPreview(false)} aria-label="Close" style={{position:'absolute',top:12,right:12,zIndex:2,width:36,height:36,borderRadius:'50%',border:'none',cursor:'pointer',background:'rgba(21,19,15,0.55)',color:'#fff',fontSize:20,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          {img ?
          <img src={img} alt="Broadcast" style={{width:'100%',display:'block',maxHeight:'52vh',objectFit:'cover',background:'var(--paper-2)'}} /> : null}
          {(title||msg||badge) ?
          <div style={{background:'linear-gradient(155deg,#0E5C4A,#0A3F33)',color:'#FDFAF2',padding:'30px 30px 26px'}}>
            <div style={{fontSize:11,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(245,231,196,0.9)',fontWeight:700,marginBottom:12}}>📣 For the team</div>
            {title && <div style={{fontFamily:'var(--font-serif)',fontSize:25,lineHeight:1.18,marginBottom:msg?12:0}}>{title}</div>}
            {msg && <p style={{fontSize:15,lineHeight:1.6,color:'rgba(253,250,242,0.9)',margin:0,whiteSpace:'pre-line'}}>{msg}</p>}
            {badge && <div style={{marginTop:18,display:'inline-flex',alignItems:'center',gap:10,background:'rgba(245,231,196,0.14)',border:'1px solid rgba(245,231,196,0.4)',borderRadius:12,padding:'12px 16px'}}><span style={{fontSize:26,lineHeight:1}}>🎉</span><span style={{fontSize:15,fontWeight:700,color:'#F5E7C4'}}>{badge}</span></div>}
          </div> : null}
          {!img && !title && !msg && !badge &&
          <div style={{aspectRatio:'4 / 5',background:'linear-gradient(150deg,#0E5C4A,#0A3F33)',color:'var(--paper)',padding:'44px 36px',display:'flex',flexDirection:'column',justifyContent:'center',textAlign:'center'}}>
            <div style={{fontSize:12,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(245,231,196,0.85)',fontWeight:600,marginBottom:16}}>For the team</div>
            <div style={{fontFamily:'var(--font-serif)',fontSize:32,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:16}}>Today's push</div>
            <p style={{fontSize:14,color:'rgba(253,250,242,0.78)',lineHeight:1.55,margin:'0 auto',maxWidth:'32ch'}}>Upload an image or write a message above.</p>
          </div>}
        </div>
      </div>}
    </div>
  );
}

/* ---------------- CONTENT ---------------- */
function Content() {
  return (
    <div className="ad-body">
      <PageHead title="Content" sub="Home hero, testimonials, franchise page & footer" />
      <div className="ad-card ad-card-pad">
        <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:18,margin:'0 0 12px'}}>Home hero</h3>
        <div className="ad-grid2">
          <div className="ad-field"><span className="ad-label">Headline</span><input className="ad-input" style={{width:'100%'}} defaultValue="Makes true beauty, by the lot." /></div>
          <div className="ad-field"><span className="ad-label">Sub-text</span><input className="ad-input" style={{width:'100%'}} defaultValue="Moissanite, lab-grown gems, cubic zirconia & more." /></div>
        </div>
        <button className="ad-btn ad-btn-acc ad-btn-sm">Save hero</button>
      </div>
      <div className="ad-card ad-card-pad">
        <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:18,margin:'0 0 12px'}}>Testimonials</h3>
        <div className="ad-muted" style={{fontSize:13,marginBottom:10}}>6 testimonials live (Tanvi Gold Cast, Malabar Gold, Tanishq vendor network, + 3 independents).</div>
        <button className="ad-btn ad-btn-ghost ad-btn-sm">Manage testimonials</button>
      </div>
      <div className="ad-card ad-card-pad">
        <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:18,margin:'0 0 12px'}}>Footer</h3>
        <div className="ad-field"><span className="ad-label">Footer line</span><input className="ad-input" style={{width:'100%'}} defaultValue="Eurostar Technologies Inc. · Estd 1980 · Authorised Distributor for Asia-Pacific: Ganesh Jewellery I Pvt Ltd · Mumbai, Jaipur" /></div>
        <div className="ad-field"><span className="ad-label">Business hours</span><input className="ad-input" style={{width:280}} defaultValue="Mon–Sat 10:00–20:00 IST" /></div>
        <button className="ad-btn ad-btn-acc ad-btn-sm">Save footer</button>
      </div>
    </div>
  );
}

/* ---------------- SETTINGS ---------------- */
function Settings() {
  const [langs] = useState(['English','हिन्दी','मराठी','ગુજરાતી','தமிழ்','తెలుగు','ಕನ್ನಡ']);
  return (
    <div className="ad-body">
      <PageHead title="Store settings" sub="Commerce rules, taxes, languages & access" />
      <div className="ad-card ad-card-pad">
        <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:18,margin:'0 0 14px'}}>Commerce rules</h3>
        <div className="ad-grid2">
          <div className="ad-field"><span className="ad-label">Minimum order value (₹)</span><input className="ad-input ad-num" style={{width:120}} defaultValue={5000} /></div>
          <div className="ad-field"><span className="ad-label">Courier charge below min-free (₹)</span><input className="ad-input ad-num" style={{width:120}} defaultValue={300} /></div>
          <div className="ad-field"><span className="ad-label">Free courier above (₹)</span><input className="ad-input ad-num" style={{width:120}} defaultValue={5000} /></div>
          <div className="ad-field"><span className="ad-label">RFQ minimum (₹)</span><input className="ad-input ad-num" style={{width:120}} defaultValue={10000} /></div>
          <div className="ad-field"><span className="ad-label">GST %</span><input className="ad-input ad-num" style={{width:120}} defaultValue={3} /></div>
          <div className="ad-field"><span className="ad-label">Default payment</span><select className="ad-select" style={{width:160}}><option>Cash (until CRM sets credit)</option></select></div>
        </div>
        <button className="ad-btn ad-btn-acc ad-btn-sm">Save rules</button>
      </div>
      <div className="ad-card ad-card-pad">
        <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:18,margin:'0 0 12px'}}>Languages</h3>
        <div className="ad-chips">{langs.map((l)=>(<span key={l} className="ad-chip">{l}</span>))}</div>
      </div>
      <div className="ad-card ad-card-pad">
        <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:18,margin:'0 0 12px'}}>Access & security</h3>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}><Toggle on={true} onClick={()=>{}} /><span style={{fontSize:13.5}}>Invite-only — catalog hidden until login</span></div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}><Toggle on={true} onClick={()=>{}} /><span style={{fontSize:13.5}}>Watermark price sheets with customer code</span></div>
        <div style={{display:'flex',alignItems:'center',gap:10}}><Toggle on={true} onClick={()=>{}} /><span style={{fontSize:13.5}}>Hidden from search engines (noindex)</span></div>
      </div>
    </div>
  );
}

/* ---------------- USERS & ACCESS ---------------- */
const USERS_KEY = 'eurostar-users-v1';
const ROLE_META = {
  admin:  { label:'Admin',       hint:'Full access to this console' },
  office: { label:'Back Office', hint:'Quotations, payments, QR collections' },
  rep:    { label:'Sales Rep',   hint:'Quotations · treated as cash customer' },
};
// Users & access is backed by the real /users API (hashed passwords server-side).
function usersApiBase(){ return window.EUROSTAR_API || (/^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname) ? location.origin : 'https://eurostar-api.onrender.com'); }
function usersAuthToken(){ try { return localStorage.getItem('eurostar-admin-token') || ''; } catch(e){ return ''; } }
function usersApi(path, opts){
  opts = opts || {};
  opts.headers = Object.assign({ 'content-type':'application/json', authorization:'Bearer '+usersAuthToken() }, opts.headers||{});
  return fetch(usersApiBase()+'/users'+path, opts).then(function(r){
    return r.json().then(function(d){ return { ok:r.ok, status:r.status, d:d }; }, function(){ return { ok:r.ok, status:r.status, d:null }; });
  });
}
function genPassword(){ return 'ES' + Math.random().toString(36).slice(2,7) + Math.floor(10+Math.random()*89); }

function UsersAccess() {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('all');
  const [reveal, setReveal] = useState({}); // id -> plaintext password (only for logins we just issued this session)
  const [editing, setEditing] = useState(null); // user id or 'new'
  const [draft, setDraft] = useState(null);

  const refresh = ()=> usersApi('').then(function(r){
    if (r.ok && Array.isArray(r.d)) setUsers(r.d.map(function(u){ return Object.assign({ password:'' }, u); }));
    else if (r.status===401 || r.status===403) alert('Please sign in as an administrator to manage users.');
  });
  React.useEffect(function(){ refresh(); }, []);

  const startNew = (role)=>{ setEditing('new'); setDraft({ id:'new', role:role||'rep', name:'', username:'', password:genPassword(), active:true, phone:'' }); };
  const startEdit = (u)=>{ setEditing(u.id); setDraft(Object.assign({}, u)); };
  const cancel = ()=>{ setEditing(null); setDraft(null); };
  const saveDraft = ()=>{
    if (!draft.name.trim() || !draft.username.trim()){ alert('Name and username are required.'); return; }
    const isNew = editing==='new';
    const body = isNew
      ? { role:draft.role, name:draft.name.trim(), username:draft.username.trim(), password:draft.password, phone:draft.phone||'' }
      : { role:draft.role, name:draft.name.trim(), phone:draft.phone||'' };
    usersApi(isNew?'':'/'+draft.id, { method:isNew?'POST':'PUT', body:JSON.stringify(body) }).then(function(r){
      if (!r.ok){ alert((r.d&&r.d.error)||'Could not save the user.'); return; }
      if (isNew && r.d && r.d.password){
        setReveal(function(x){ var n=Object.assign({},x); n[r.d.id]=r.d.password; return n; });
        alert('User created.\n\nUsername: '+r.d.username+'\nPassword: '+r.d.password+'\n\nShare these — they can change the password after signing in.');
      }
      cancel(); refresh();
    });
  };
  const toggleActive = (u)=> usersApi('/'+u.id, { method:'PUT', body:JSON.stringify({ active:!u.active }) }).then(function(r){ if(!r.ok){ alert((r.d&&r.d.error)||'Could not update.'); } refresh(); });
  const resetPw = (id)=> usersApi('/'+id+'/reset-password', { method:'POST' }).then(function(r){ if(!r.ok){ alert((r.d&&r.d.error)||'Could not reset the password.'); return; } setReveal(function(x){ var n=Object.assign({},x); n[id]=r.d.password; return n; }); alert('New password set: '+r.d.password+'\n\nShare it with the user — they can change it after signing in.'); });
  const removeUser = (u)=>{ if(u.isOwner){ alert('You cannot delete the primary owner account.'); return; } if(confirm('Remove this login? They will no longer be able to sign in.')) usersApi('/'+u.id, { method:'DELETE' }).then(function(r){ if(!r.ok){ alert((r.d&&r.d.error)||'Could not remove the user.'); } refresh(); }); };

  const changeMyPassword = ()=>{
    var oldPw = prompt('Enter your current password:'); if(!oldPw) return;
    var newPw = prompt('Enter your new password (at least 4 characters):'); if(!newPw) return;
    fetch(usersApiBase()+'/auth/change-password', { method:'POST', headers:{ 'content-type':'application/json', authorization:'Bearer '+usersAuthToken() }, body:JSON.stringify({ oldPassword:oldPw, newPassword:newPw }) })
      .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,d:d}; }); })
      .then(function(res){ alert(res.ok ? 'Password changed. Use the new one next time you sign in.' : ((res.d&&res.d.error)||'Could not change the password.')); });
  };

  const filtered = tab==='all' ? users : users.filter((u)=>u.role===tab);
  const count = (r)=> users.filter((u)=>u.role===r).length;
  const me = users.find((u)=>u.isOwner) || users.find((u)=>u.username==='admin');

  const Field = ({label, children})=> <label style={{display:'block',marginBottom:12}}><span style={{display:'block',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--fg-meta)',marginBottom:5}}>{label}</span>{children}</label>;
  const inp = { width:'100%', padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--r-md)', fontFamily:'inherit', fontSize:14, background:'var(--surface)', color:'var(--fg)' };

  return (
    <div>
      <PageHead title="Users & access" sub="Create and manage logins for admins, back office and sales reps. Customers sign in with mobile OTP and are not listed here."
        action={<button className="ad-btn ad-btn-acc" onClick={()=>startNew('rep')}>＋ Add user</button>} />

      {/* My account */}
      {me && <div className="ad-card ad-card-pad" style={{marginBottom:22}}>
        <div className="ad-sechead" style={{padding:0,marginBottom:12}}><h3>Your account</h3><span className="meta">Owner · admin</span></div>
        <div style={{display:'flex',flexWrap:'wrap',gap:16,alignItems:'flex-end'}}>
          <Field label="Username"><input style={Object.assign({},inp,{minWidth:180})} value={me.username} readOnly /></Field>
          <Field label="Password"><input style={Object.assign({},inp,{minWidth:180})} type="password" value="********" readOnly /></Field>
          <button className="ad-btn ad-btn-pri" style={{marginBottom:12}} onClick={changeMyPassword}>Change password</button>
        </div>
        <p className="ad-muted" style={{fontSize:12,marginTop:6}}>Passwords are stored securely (hashed) and can’t be displayed. Use “Change password”, or “Reset password” for a teammate.</p>
      </div>}

      {/* Role tabs */}
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        {[['all','All'],['admin','Admins'],['office','Back office'],['rep','Sales reps']].map(([id,lbl])=>(
          <button key={id} className={`ad-btn ${tab===id?'ad-btn-pri':'ad-btn-ghost'}`} onClick={()=>setTab(id)}>
            {lbl}{id!=='all' && <span style={{opacity:.6,marginLeft:6}}>{count(id)}</span>}
          </button>
        ))}
      </div>

      <div className="ad-card">
        <table className="ad-table">
          <thead><tr><th>Name</th><th>Role</th><th>Username</th><th>Password</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
          <tbody>
            {filtered.length===0 && <tr><td colSpan={6} className="ad-muted" style={{padding:'26px 16px',textAlign:'center'}}>No users in this group yet.</td></tr>}
            {filtered.map((u)=>(
              <tr key={u.id} style={{opacity:u.active?1:0.5}}>
                <td style={{fontWeight:600}}>{u.name||'—'}</td>
                <td>{ROLE_META[u.role]?.label||u.role}</td>
                <td className="ad-id">{u.username}</td>
                <td className="ad-id">
                  <span>{reveal[u.id] ? reveal[u.id] : '••••••••'}</span>
                </td>
                <td>{u.active ? <span className="ad-pill">Active</span> : <span style={{fontSize:12,color:'var(--fg-meta)',fontWeight:600}}>Disabled</span>}</td>
                <td style={{textAlign:'right',whiteSpace:'nowrap'}}>
                  <button className="ad-btn ad-btn-ghost" style={{padding:'5px 10px',fontSize:12,marginLeft:6}} onClick={()=>resetPw(u.id)}>Reset password</button>
                  <button className="ad-btn ad-btn-ghost" style={{padding:'5px 10px',fontSize:12,marginLeft:6}} onClick={()=>startEdit(u)}>Edit</button>
                  <button className="ad-btn ad-btn-ghost" style={{padding:'5px 10px',fontSize:12,marginLeft:6}} onClick={()=>toggleActive(u)}>{u.active?'Disable':'Enable'}</button>
                  <button className="ad-btn ad-btn-ghost" style={{padding:'5px 10px',fontSize:12,marginLeft:6,color:'var(--ruby)'}} onClick={()=>removeUser(u)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="ad-muted" style={{fontSize:12.5,marginTop:14,lineHeight:1.6,maxWidth:640}}>
        Logins are stored securely on the back room (hashed passwords) and shared across all apps. Customers sign in with mobile OTP and are not listed here. Reps onboarded from the LMS appear here automatically.
      </p>

      {/* Editor drawer */}
      {editing && draft && <div style={{position:'fixed',inset:0,background:'rgba(20,18,15,0.44)',zIndex:200,display:'flex',justifyContent:'flex-end'}} onClick={cancel}>
        <div style={{width:400,maxWidth:'92vw',height:'100%',background:'var(--surface)',boxShadow:'var(--shadow-lg)',padding:'26px 26px 30px',overflowY:'auto'}} onClick={(e)=>e.stopPropagation()}>
          <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:22,margin:'0 0 4px'}}>{editing==='new'?'Add user':'Edit user'}</h3>
          <p className="ad-muted" style={{fontSize:13,margin:'0 0 20px'}}>{ROLE_META[draft.role]?.hint}</p>
          <Field label="Role">
            <select style={inp} value={draft.role} onChange={(e)=>setDraft(Object.assign({},draft,{role:e.target.value}))}>
              <option value="rep">Sales Rep</option><option value="office">Back Office</option><option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Full name"><input style={inp} value={draft.name} onChange={(e)=>setDraft(Object.assign({},draft,{name:e.target.value}))} placeholder="e.g. Ramesh K." /></Field>
          <Field label="Phone (optional)"><input style={inp} value={draft.phone} onChange={(e)=>setDraft(Object.assign({},draft,{phone:e.target.value}))} placeholder="+91 …" /></Field>
          <Field label="Username"><input style={inp} value={draft.username} onChange={(e)=>setDraft(Object.assign({},draft,{username:e.target.value}))} placeholder="e.g. ramesh" autoComplete="off" /></Field>
          <Field label="Password">
            <div style={{display:'flex',gap:8}}>
              <input style={inp} value={draft.password} onChange={(e)=>setDraft(Object.assign({},draft,{password:e.target.value}))} />
              <button className="ad-btn ad-btn-ghost" onClick={()=>setDraft(Object.assign({},draft,{password:genPassword()}))}>Generate</button>
            </div>
          </Field>
          <label style={{display:'flex',alignItems:'center',gap:9,margin:'8px 0 24px',cursor:'pointer'}}>
            <input type="checkbox" checked={draft.active} onChange={(e)=>setDraft(Object.assign({},draft,{active:e.target.checked}))} style={{accentColor:'var(--emerald)'}} />
            <span style={{fontSize:13.5}}>Account active (can sign in)</span>
          </label>
          <div style={{display:'flex',gap:10}}>
            <button className="ad-btn ad-btn-acc" onClick={saveDraft}>Save user</button>
            <button className="ad-btn ad-btn-ghost" onClick={cancel}>Cancel</button>
          </div>
        </div>
      </div>}
    </div>
  );
}

/* ---------------- SHELL ---------------- */
const NAV = [
  { id:'dashboard', label:'Dashboard' },
  { id:'catalog', label:'Catalog' },
  { id:'newcat', label:'＋ Add category' },
  { id:'bulk', label:'Bulk upload' },
  { id:'media', label:'Product images' },
  { id:'homethumbs', label:'Home thumbnails' },
  { id:'splash', label:'Pop-up window' },
  { id:'repbroadcast', label:'Rep broadcast' },
  { id:'users', label:'Users & access' },
  { id:'content', label:'Content' },
  { id:'settings', label:'Settings' },
];

function Admin() {
  const [page, setPage] = useState('dashboard');
  const [catId, setCatId] = useState(null);
  const [hidden, setHidden] = useState(['hotfix'].filter((id)=>CATS.some((c)=>c.id===id)));
  const toggleHidden = (id)=> setHidden((h)=> h.includes(id) ? h.filter((x)=>x!==id) : [...h,id]);
  const go = (p)=>{ setPage(p); setCatId(null); };

  let screen;
  if (page==='catalog' && catId) screen = <CatDetail catId={catId} onBack={()=>setCatId(null)} />;
  else screen = ({
    dashboard:<Dashboard go={go} hidden={hidden} />,
    catalog:<Catalog hidden={hidden} toggleHidden={toggleHidden} openCat={setCatId} />,
    newcat:<CreateCategory onDone={()=>go('catalog')} />,
    bulk:<BulkUpload />, media:<Media />, homethumbs:<HomeThumbs />, splash:<SplashAdmin />,    content:<Content />, settings:<Settings />,
    repbroadcast:<RepBroadcast />,
    users:<UsersAccess />,
  })[page];

  const cur = NAV.find((n)=>n.id===page)||{};
  return (
    <div className="ad-shell">
      <aside className="ad-side">
        <div className="ad-brand"><img src={window.EUROSTAR_LOGO || 'assets/eurostar-logo.jpeg'} alt="Eurostar" /><div><b>Eurostar</b><small>Admin</small></div></div>
        <nav className="ad-nav">
          <div className="ad-nav-label">Sales App Admin</div>
          {NAV.map((n)=>(<button key={n.id} className={`ad-nav-item ${page===n.id?'active':''}`} onClick={()=>go(n.id)}>{n.label}</button>))}
        </nav>
        <div className="ad-side-foot"><a className="ad-applink" href="Eurostar Sales website.html">↗ Open Sales App</a></div>
      </aside>
      <main className="ad-main">
        <header className="ad-top"><h1>{catId? (CATS.find((c)=>c.id===catId)||{}).name : cur.label}</h1><span className="ad-pill">Live catalog</span></header>
        {screen}
      </main>
      <TweaksPanel />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Admin />);
