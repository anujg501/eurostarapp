// screen-browse.jsx — Guided drill-down:
// Category → Grade → Colour → Shape → Size/Carat pad

function BrowseScreen({ route, setRoute, addToCart, wishlist, toggleWishlist, persona }) {
  // Interface copy follows the language picker. Trade terms (grade names, DEF,
  // carat, mm …) intentionally stay in English — see i18n-strings.jsx.
  const lang = (window.currentLang ? window.currentLang() : 'en');
  const T = (k, fb) => (window.t ? window.t(k, lang) : fb);
  const custCode = persona && persona.code || '';
  const custCompany = persona && persona.company || '';
  const category = findCategory(route.cat);
  const grades = GRADES_BY_CATEGORY[route.cat] || [];
  const baseShapeIds = SHAPES_BY_CATEGORY[route.cat] || ['round'];

  const [gradeId, setGradeId] = React.useState(null);
  const [subGradeId, setSubGradeId] = React.useState(null);
  const [colorId, setColorId] = React.useState(null);
  const [subShadeId, setSubShadeId] = React.useState(null);
  const [shape, setShape] = React.useState(null);
  const [subShape, setSubShape] = React.useState(null);
  const [qtyBySize, setQtyBySize] = React.useState({});

  const colors = (route.cat === 'opaque' && gradeId && OPAQUE_COLORS_BY_GRADE[gradeId]) ?
    OPAQUE_COLORS_BY_GRADE[gradeId] :
    (route.cat === 'pearls' && gradeId && PEARL_COLORS_BY_GRADE[gradeId]) ?
    PEARL_COLORS_BY_GRADE[gradeId] :
    (route.cat === 'corundum' && gradeId && CORUNDUM_COLORS_BY_GRADE[gradeId]) ?
    CORUNDUM_COLORS_BY_GRADE[gradeId] :
    (route.cat === 'labgrown' && gradeId && LABGROWN_COLORS_BY_GRADE[gradeId]) ?
    LABGROWN_COLORS_BY_GRADE[gradeId] :
    (route.cat === 'cz' && gradeId && CZ_COLORS_BY_GRADE[gradeId]) ?
    CZ_COLORS_BY_GRADE[gradeId] :
    (route.cat === 'rajkot' && gradeId && RAJKOT_COLORS_BY_GRADE[gradeId]) ?
    RAJKOT_COLORS_BY_GRADE[gradeId] :
    COLORS_BY_CATEGORY[route.cat] || [{ id: 'white', name: 'White', hex: '#F2EFE8' }];

  const baseGrade = grades.find((g) => g.id === gradeId) || null;
  // Some grades have sub-types (e.g. White Round CZ → Elements → Thin/Normal/H/HEA).
  const subGrades = baseGrade && baseGrade.subGrades ? baseGrade.subGrades : null;
  const subGrade = subGrades ? subGrades.find((s) => s.id === subGradeId) || null : null;
  const needsSub = !!subGrades && !subGrade;
  // Effective grade used downstream: merges the chosen sub-type's name + id.
  const grade = !baseGrade ? null :
  subGrade ? { ...baseGrade, id: baseGrade.id + '-' + subGrade.id, name: subGrade.name, baseName: baseGrade.name } :
  baseGrade;
  const baseColor = colors.find((c) => c.id === colorId) || null;
  // Some colours have sub-shades (e.g. CZ → Aqua Blue → #37/#38/#39).
  const subShades = baseColor && baseColor.subShades ? baseColor.subShades : null;
  const subShade = subShades ? subShades.find((s) => s.id === subShadeId) || null : null;
  const needsSubShade = !!subShades && !subShade;
  const color = !baseColor ? null :
  subShade ? { ...baseColor, id: baseColor.id + '-' + subShade.id, name: baseColor.name + ' ' + subShade.name, hex: subShade.hex, baseName: baseColor.name } :
  baseColor;
  // Pearls: drilling options depend on the selected grade (Natural vs Created).
  // Per-grade shape options: Pearls (drilling) and Navratna (Natural vs Created).
  const shapeIds = baseColor && baseColor.shapes ?
  baseColor.shapes :
  route.cat === 'pearls' && grade && PEARL_SHAPES_BY_GRADE[grade.id] ?
  PEARL_SHAPES_BY_GRADE[grade.id] :
  route.cat === 'navratna' && grade && NAVRATNA_SHAPES_BY_GRADE[grade.id] ?
  NAVRATNA_SHAPES_BY_GRADE[grade.id] :
  route.cat === 'whitefancy' && grade && window.WHITEFANCY_SHAPES_BY_GRADE && window.WHITEFANCY_SHAPES_BY_GRADE[grade.id] ?
  window.WHITEFANCY_SHAPES_BY_GRADE[grade.id] :
  route.cat === 'polki' && grade && window.POLKI_SHAPES_BY_GRADE && window.POLKI_SHAPES_BY_GRADE[grade.id] ?
  window.POLKI_SHAPES_BY_GRADE[grade.id] :
  baseShapeIds;
  // Some shapes (e.g. Opaque · Cut Stones) open a second grid of cut shapes.
  const baseShapeMeta = shape ? findShape(shape) : null;
  const shapeSubs = baseShapeMeta && baseShapeMeta.subShapes ? baseShapeMeta.subShapes : null;
  const needsSubShape = !!shapeSubs && !subShape;
  const effShape = shapeSubs && subShape ? subShape : shape;

  const pickGrade = (id) => {
    setGradeId(id);setSubGradeId(null);setQtyBySize({});
    const g = grades.find((x) => x.id === id);
    if (id && !(g && g.subGrades)) {
      setColorId(colors.length === 1 ? colors[0].id : null);
      setShape(baseShapeIds.length === 1 ? baseShapeIds[0] : null);
    } else {setColorId(null);setShape(null);}
  };
  const pickSubGrade = (id) => {
    setSubGradeId(id);setQtyBySize({});
    if (id) {
      const sg = subGrades && subGrades.find((s) => s.id === id);
      setColorId(colors.length === 1 ? colors[0].id : null);
      // Series sub-grades (e.g. White Polki Z/B/C…) skip shape → straight to the size list.
      if (sg && sg.directSize) {setShape(baseShapeIds[0]);} else
      {setShape(baseShapeIds.length === 1 ? baseShapeIds[0] : null);}
    } else {setColorId(null);setShape(null);}
  };
  const pickColor = (id) => {
    setColorId(id);
    const c = colors.find((x) => x.id === id);
    const hasSub = c && c.subShades;
    // Auto-select sub-shade when there is only one (e.g. Ice Cut White → G40).
    const autoSub = hasSub && c.subShades.length === 1 ? c.subShades[0].id : null;
    setSubShadeId(autoSub);
    // A colour may restrict its own shapes (e.g. Alpanite Yellow → round only).
    const effShapes = c && c.shapes ? c.shapes : shapeIds;
    if (id && (!hasSub || autoSub) && effShapes.length === 1) {setShape(effShapes[0]);} else
    {setShape(null);}
    setQtyBySize({});
  };
  const pickSubShade = (id) => {
    setSubShadeId(id);
    if (id && shapeIds.length === 1) {setShape(shapeIds[0]);} else {setShape(null);}
    setQtyBySize({});
  };
  const pickShape = (s) => {setShape(s);setSubShape(null);setQtyBySize({});};
  const pickShapeSub = (s) => {setSubShape(s);setQtyBySize({});};

  // Categories flagged skipGrade jump straight to colour (single grade auto-selected).
  React.useEffect(() => {
    if (category && category.skipGrade && grades.length === 1 && !gradeId) {
      pickGrade(grades[0].id);
    }
  }, [route.cat]);
  const skipGrade = !!(category && category.skipGrade);

  if (!category) {
    return (
      <div className="page">
        <div className="empty"><h3>Category not found</h3>
          <button className="btn btn-secondary" onClick={() => setRoute({ name: 'home' })}>Home</button>
        </div>
      </div>);

  }

  // Step: 1 grade · 2 colour · 3 shape · 4 sizes
  const step = !grade || needsSub ? 1 : !color || needsSubShade ? 2 : (!shape || needsSubShape) ? 3 : 4;

  return (
    <div className="page">
      {/* Breadcrumb trail */}
      <div className="browse-trail">
        <span className="trail-crumb" onClick={() => setRoute({ name: 'home' })}>Home</span>
        <IconChev size={13} />
        <span className={`trail-crumb ${step === 1 ? 'current' : 'done'}`}
        onClick={() => pickGrade(null)}>{category.short}</span>
        {grade && !needsSub && !skipGrade && <>
          <IconChev size={13} />
          <span className={`trail-crumb ${step === 2 ? 'current' : 'done'}`}
          onClick={() => pickColor(null)}>{grade.name}</span>
        </>}
        {color && colors.length > 1 && <>
          <IconChev size={13} />
          <span className={`trail-crumb ${step === 3 ? 'current' : shapeIds.length > 1 ? 'done' : 'current'}`}
          onClick={() => shapeIds.length > 1 ? setShape(null) : null}>{color.name}</span>
        </>}
        {shape && shapeIds.length > 1 && <>
          <IconChev size={13} />
          <span className="trail-crumb current">{findShape(shape)?.name}</span>
        </>}
      </div>

      {/* Step rail — built from the steps this category actually needs */}
      {(() => {
        const showColor = colors.length > 1;
        const showShape = shapeIds.length > 1;
        const railSteps = [
        !skipGrade && { label: T('step_grade', 'Grade'), n: 1 },
        showColor && { label: T('step_colour', 'Colour'), n: 2 },
        showShape && { label: T('step_shape', 'Shape'), n: 3 },
        { label: grade && grade.unit === 'strip' ? T('step_strips', 'Strips') : T('step_sizes', 'Sizes & carats'), n: 4 }].
        filter(Boolean);
        return (
          <div className={`step-rail step-rail-${railSteps.length}`}>
            {railSteps.map((rs, i) =>
            <React.Fragment key={rs.n}>
                {i > 0 && <span className="step-line" />}
                <StepDot n={i + 1} label={rs.label} active={step === rs.n} done={step > rs.n} />
              </React.Fragment>
            )}
          </div>);

      })()}

      {/* ===== STEP 1: GRADE ===== */}
      {step === 1 && !needsSub &&
      <div className="browse-step">
          <div className="page-head" style={{ marginBottom: 20 }}>
            <div>
              <div className="crumb">{category.name}</div>
              <h1>{category.id === 'laser' ? 'Laser Engraved Gemstones' :
              category.id === 'moissanite' ? 'Precision High Quality Moissanite Gemstones' :
              category.id === 'alpanite' ? 'Guaranteed Wax Castable Color Stones' :
              category.id === 'multisapphire' ? 'Multi rainbow coloured strips' :
              category.id === 'pearls' ? 'Eurostar Pearls' :
              category.id === 'highdensity' ? 'HD Zirconia' :
              category.id === 'corundum' ? 'Synthetic Lab Grown Corrundums' :
              category.id === 'labgrown' ? 'Lab Grown & Created Gemstones' :
              category.id === 'opaque' ? 'Opaque Colour Created Stones' :
              category.id === 'cz' ? 'Various Colour Cubic Zirconia' :
              category.id === 'whitecz' ? 'White Round Cubic Zirconia' :
              category.id === 'whitefancy' ? 'White Fancy Shapes' :
              category.id === 'mop' ? 'Mother of Pearl' :
              category.id === 'icecut' ? 'Ice Cut Stones' :
              category.id === 'ourosa' ? 'Ourosa' :
              category.id === 'polki' ? 'Polki' :
              category.id === 'evileye' ? 'Real MOP Evil Eye' :
              category.id === 'bracelet' ? 'Fancy Jewellery Bracelets' :
              category.id === 'hollowmop' ? 'Hollow Shapes MOP' :
              category.id === 'labwhitecorundum' ? 'Lab White Corundum' :
              category.id === 'alex' ? 'Lab Grown Alexandrite' :
              category.id === 'coral' ? 'Heavy and Castable' :
              category.id === 'beads' ? 'Choose your bead type' :
              'Heighted or flat ?'}</h1>
              <p>{category.id === 'beads' ?
              'Select the bead variety — each has Plain, Faceted, Oval Maniya and Drops sub-types. Pricing differs by grade.' :
              category.id === 'laser' ?
              'Laser Engraved Premium Quality Cubic Zirconia & Color Stones' :
              category.id === 'multisapphire' ?
              'Corundum across the full sapphire spectrum. Pick the grade you want to order from — pricing differs by grade. You can choose between natural & lab-grown.' :
              category.id === 'pearls' ?
              'Pearls made for all types of jewellery. We have varieties like string or half-drilled. Pick the grade you want to order from — pricing differs by grade.' :
              category.id === 'highdensity' ?
              'New technology developed, most suitable for gold jewellery sold by gross weight only. With this technology we can provide 25% more weight for the same height — achieved by binding the molecules more closely. The result is higher lustre, stronger and shinier diamonds.' :
              <React.Fragment>{category.blurb} Pick the grade you want to order from — pricing differs by grade.</React.Fragment>}</p>
            </div>
          </div>
          <div className="grade-grid">
            {grades.map((g) => {
            const unit = g.unit === 'strip' ? 'strip' : catUnit(route.cat);
            const sample = makeBrowseProduct(route.cat, g, colors[0], shapeIds[0]);
            const sizes = FULL_SIZES[shapeIds[0]] || ['4.00 mm'];
            const from = g.unit === 'strip' ?
            sample.price :
            unit === 'pkt' ?
            catPacketPriced(route.cat) || g.packetPriced ?
            Math.min(...sizes.map((s) => unitRate(sample, s, 'pkt', route.cat))) :
            Math.min(...sizes.map((s) => sizeUnitPrice(sample, s))) :
            Math.min(...sizes.map((s) => unitRate(sample, s, unit)));
            const isPremium = /high|top|premium/i.test(g.tier);
            const origin = g.origin || catOrigin(route.cat);
            const showOrigin = origin && !origin.includes('/');
            return (
              <button key={g.id} className="grade-card" onClick={() => pickGrade(g.id)}>
                  <div className="grade-card-top">
                    <span className={`grade-tier ${isPremium ? 'premium' : ''}`}>{g.tier}</span>
                    {showOrigin && <span className="grade-origin">{origin}</span>}
                  </div>
                  <div className="grade-name">{g.name}</div>
                  <div className="grade-desc">{g.desc}</div>
                  {category.id === 'bracelet' && BRACELET_HERO[g.id] &&
                <div className="grade-bracelet-hero">
                    <img src={BRACELET_HERO[g.id]} alt={g.name + ' bracelet colours'} />
                  </div>
                }
                  <div className="grade-foot">
                    <span className="grade-from">{g.fromText ?
                    <React.Fragment>{g.fromText}<span className="grade-unit">/{g.fromUnit || unit}</span></React.Fragment> :
                    <React.Fragment>from {formatINR(from)}<span className="grade-unit">/{unit === 'pkt' ? catPacketPriced(route.cat) || g.packetPriced ? 'packet' : 'pc' : unit}</span></React.Fragment>}</span>
                    <span className="grade-go">Select <IconChev size={14} /></span>
                  </div>
                </button>);

          })}
          </div>
        </div>
      }

      {/* ===== STEP 1b: SUB-GRADE ===== */}
      {step === 1 && needsSub &&
      <div className="browse-step">
          <div className="page-head" style={{ marginBottom: 20 }}>
            <div>
              <div className="crumb">{category.short}</div>
              <h1>{baseGrade.name}</h1>
              <p>{baseGrade.desc}. Choose the {baseGrade.name} type you want to order.</p>
            </div>
            <button className="btn btn-ghost" onClick={() => pickGrade(null)}>
              <IconArrowLeft size={16} /> Change grade
            </button>
          </div>
          <div className="grade-grid">
            {subGrades.map((sg) =>
          category.id === 'rajkot' ?
          <div key={sg.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <button className="grade-card" onClick={() => pickSubGrade(sg.id)}>
                  <div className="grade-card-top">
                    <span className="grade-tier">{baseGrade.tier}</span>
                    <span className="grade-origin">{baseGrade.name}</span>
                  </div>
                  <div className="grade-name">{sg.name}</div>
                  <div className="grade-desc">{sg.desc}</div>
                  <div className="grade-foot">
                    <span className="grade-go">Select <IconChev size={14} /></span>
                  </div>
                </button>
                <div style={{ maxWidth: 200 }}>
                  <DocUploadCard catId={category.id} gradeId={sg.id} docId="packet"
                    label={sg.name + ' photo'} caption="Packet image shown to customers" />
                </div>
              </div> :
          <button key={sg.id} className="grade-card" onClick={() => pickSubGrade(sg.id)}>
                <div className="grade-card-top">
                  <span className="grade-tier">{baseGrade.tier}</span>
                  <span className="grade-origin">{baseGrade.name}</span>
                </div>
                <div className="grade-name">{sg.name}</div>
                <div className="grade-desc">{sg.desc}</div>
                <div className="grade-foot">
                  <span className="grade-go">Select <IconChev size={14} /></span>
                </div>
              </button>
          )}
          </div>
        </div>
      }

      {/* ===== STEP 2: COLOUR ===== */}
      {step === 2 && category.id === 'bracelet' &&
      <div className="pricepad-wrap"><PriceWatermark code={custCode} company={custCompany} />
      <BraceletOrderPad grade={grade}
        colors={(BRACELET_BY_GRADE[grade.id] || {}).colors || colors}
        imgPrefix={(BRACELET_BY_GRADE[grade.id] || {}).imgPrefix || 'assets/products/bracelet-'}
        category={category}
        qtyBySize={qtyBySize} setQtyBySize={setQtyBySize}
        onBack={() => pickGrade(null)} addToCart={addToCart} setRoute={setRoute} />
      </div>
      }
      {step === 2 && category.id !== 'bracelet' &&
      <div className="browse-step">
          <div className="page-head" style={{ marginBottom: 20 }}>
            <div>
              <div className="crumb">{category.short} · {grade.name}{needsSubShade ? ' · ' + baseColor.name : ''}</div>
              <h1>{needsSubShade ? (category.id === 'icecut' ? 'Choose your G-code' : T('choose_shade', 'Choose a shade')) : T('choose_colour', 'Choose a colour')}</h1>
              <p>{needsSubShade ?
              (category.id === 'icecut'
              ? <React.Fragment>Select the specific G-code for <strong>{baseColor.name}</strong> from the colour chart above.</React.Fragment>
              : <React.Fragment>{subShades.length} shades available in {baseColor.name}. Pick the exact shade you want.</React.Fragment>) :
              category.id === 'labgrown' ?
              'Various lab-created gemstones to choose from — all 100% wax castable. IGI certifies it as "Lab Grown Corundum".' :
              category.id === 'cz' ?
              'Multiple colours to choose from. Castable premium cubic zirconia.' :
              category.id === 'icecut' ?
              'Pick the price tier for your colour — use the colour card above to find which tier it falls in.' :
              <React.Fragment>{colors.length} {T('colours_available', 'colours available in this grade.')}{' '}
                 {T('pick_colour_hint', 'Select the tone you want to order.')}</React.Fragment>}</p>
            </div>
            <button className="btn btn-ghost" onClick={() => needsSubShade ? pickColor(null) : pickGrade(null)}>
              <IconArrowLeft size={16} /> {needsSubShade ? 'Change colour' : 'Change grade'}
            </button>
          </div>
          {/* Ice Cut colour chart — always visible on colour step */}
          {category.id === 'icecut' &&
          <div className="icecut-hero">
            <img src="assets/products/icecut-colorchart.jpeg" alt="Ice Cut CZ colour card — full colour range with G-codes" />
            <div className="icecut-hero-cap">
              {needsSubShade
                ? <React.Fragment><strong>Step 2:</strong> Now select your specific G-code from the chart above.</React.Fragment>
                : <React.Fragment><strong>Crushed Ice Cutting — colour card.</strong> Find your colour and its G-code, then pick its price tier below.</React.Fragment>}
            </div>
          </div>
          }
          {needsSubShade ?
          (category.id === 'icecut' ?
          <div className="icecut-gcode-grid">
            {subShades.map((s) =>
              <button key={s.id} className="icecut-gcode-chip" onClick={() => pickSubShade(s.id)}>
                <span className="icecut-gcode-dot" style={{background: s.hex}} />
                {s.name}
              </button>
            )}
          </div> :
          <div className="color-pick-grid">
            {subShades.map((s) =>
              <button key={s.id} className="color-pick-card" onClick={() => pickSubShade(s.id)}>
                <div className="color-pick-swatch" style={{ background: s.hex }} />
                <div className="color-pick-name">{s.name}</div>
              </button>
            )}
          </div>) : null}
          {!needsSubShade && (category.id === 'icecut' ?
        <div className="icecut-tier-grid">
            {colors.map((c) =>
          <button key={c.id} className={`icecut-tier-card tier-${c.id}`} onClick={() => pickColor(c.id)}>
                <div className="icecut-tier-swatch" />
                <div className="icecut-tier-name">{c.name}</div>
                {c.codes && <div className="icecut-tier-codes">{c.codes}</div>}
              </button>
          )}
          </div> :

        <div className="color-pick-grid">
            {colors.map((c) =>
          <button key={c.id} className="color-pick-card" onClick={() => pickColor(c.id)}>
                {productPhoto(c.id) ?
            <img className="color-pick-swatch" src={productPhoto(c.id)} alt={c.name}
            loading="lazy"
            /* A missing file must leave the plain colour swatch behind, not a
               broken-image icon. */
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            style={{ objectFit: 'cover', background: c.hex }} /> :
            <div className="color-pick-swatch" style={{ background: c.hex }} />}
                <div className="color-pick-name">{c.name}</div>
                {c.subShades && category.id !== 'icecut' && <div className="color-pick-meta">{c.subShades.length} shades</div>}
                {c.mult && c.mult > 1 && category.id !== 'laser' &&
            <div className="color-pick-meta">+{Math.round((c.mult - 1) * 100)}% fancy</div>
            }
              </button>
          )}
          </div>)
        }

          {category.id === 'labgrown' && grade.id === 'labgrown' &&
        <div className="moiss-docs" style={{ marginTop: 24 }}>
            <div className="moiss-docs-head">
              <div className="moiss-docs-eyebrow">Optional add-on · ₹2,000 / piece</div>
              <h3>IGI certificate available for every stone</h3>
              <p>Add a genuine IGI certificate to any stone for <strong>₹2,000 per piece</strong> —
                 issued individually and provided with your order.</p>
            </div>
            <div className="moiss-docs-cards" style={{ gridTemplateColumns: '1fr' }}>
              <DocUploadCard catId="labgrown" gradeId="labgrown" docId="igi"
            label="IGI Certificate" caption="Sample IGI certificate" />
            </div>
          </div>
        }

          {category.id === 'laser' && !needsSubShade &&
        <div className="laser-auth" style={{ marginTop: 24 }}>
            <div className="laser-auth-img">
              <img src="assets/products/laser-packet.png" alt="Genuine Eurostar sealed laser-engraved packet — Cubic Zirconia White Round" />
            </div>
            <div className="laser-auth-body">
              <div className="laser-auth-eyebrow">{T('what_receive', "What you'll receive")}</div>
              <h3>Genuine sealed Eurostar packets</h3>
              <p>Every order ships in factory-sealed, barcoded Eurostar packets — each stone
                 laser-marked and graded for <em>Pure Brilliance</em>. Made in Austria.</p>
              <div className="laser-auth-tags">
                <span className="chip chip-accent chip-dot">Laser-marked</span>
                <span className="chip">Sealed &amp; barcoded</span>
                <span className="chip">Made in Austria</span>
              </div>
            </div>
          </div>
        }
        </div>
      }
      {step === 3 &&
      <div className="browse-step">
          <div className="page-head" style={{ marginBottom: 20 }}>
            <div>
              <div className="crumb">{category.short} · {grade.name} · {color.name}{needsSubShape ? ' · ' + (baseShapeMeta && baseShapeMeta.name || '') : ''}</div>
              <h1>{needsSubShape ? T('choose_cut', 'Choose a cut shape') : T('choose_shape', 'Choose a shape')}</h1>
              <p>{needsSubShape
                ? 'Pick the exact cut — then choose your sizes and quantities.'
                : 'Pick a shape to see its sizes and pricing.'}</p>
            </div>
            {needsSubShape ? <button className="btn btn-ghost" onClick={() => setShape(null)}>
                  <IconArrowLeft size={16} /> Change shape
                </button> : colors.length > 1 ? <button className="btn btn-ghost" onClick={() => pickColor(null)}>
                  <IconArrowLeft size={16} /> Change colour
                </button> : <button className="btn btn-ghost" onClick={() => subGrades ? pickSubGrade(null) : pickGrade(null)}>
                  <IconArrowLeft size={16} /> Change grade
                </button>}
          </div>
          <div className="shape-pick-grid">
            {(needsSubShape ? shapeSubs : shapeIds).map((s) => {
            const meta = findShape(s);
            // Count the sizes actually uploaded for this shape; only fall back
            // to the built-in chart when nothing was uploaded, otherwise every
            // shape card reads a flat "1 sizes".
            const skuSizesForCard = (window.uploadedSizesFor ? uploadedSizesFor(category.id, s, grade) : []);
            // Reflect uploaded price-sheet sizes on the shape card count (else it reads the built-in chart).
            const _gid = grade && grade.id, _cid = color && color.id;
            const sheetSizesForCard =
              category.id === 'pearls' && window.pearlSheetSizes ? window.pearlSheetSizes(_gid, _cid, s) :
              category.id === 'cz' && window.colorCzSizes ? window.colorCzSizes(_gid, _cid, s) :
              category.id === 'cabochon' && window.cabSizes ? window.cabSizes(_gid, _cid, s) :
              category.id === 'coral' && window.coralSizes ? window.coralSizes(_gid, s) :
              category.id === 'opaque' && window.opaqueNatSizes && window.opaqueNatSizes(_gid, _cid, s).length ? window.opaqueNatSizes(_gid, _cid, s) :
              category.id === 'opaque' && window.opaqueSizes ? window.opaqueSizes(_gid, s) :
              category.id === 'polki' && window.polkiSizes ? window.polkiSizes(_gid, s) :
              category.id === 'labopal' && window.labopalSizes ? window.labopalSizes(_gid, _cid, s) :
              category.id === 'hollowmop' && window.hollowmopSizes ? window.hollowmopSizes(_gid, s) :
              category.id === 'rajkot' && window.rajkotSizes ? window.rajkotSizes(_gid, _cid, s) :
              category.id === 'alex' && window.alexSizes ? window.alexSizes(s) :
              category.id === 'evileye' && window.evileyeSizes ? window.evileyeSizes(s) :
              category.id === 'corundum' && window.corSizes ? window.corSizes(_gid, _cid, s) :
              category.id === 'whitecz' && window.czSizes ? window.czSizes(_gid, s) :
              category.id === 'whitefancy' && window.wfSizes ? window.wfSizes(_gid, s) :
              category.id === 'highdensity' && window.hdSizes ? window.hdSizes(_gid, s) :
              category.id === 'alpanite' && window.alpSheetSizes && window.alpSheetSizes(_cid, s).length ? window.alpSheetSizes(_cid, s) :
              [];
            const sizes = sheetSizesForCard.length ? sheetSizesForCard : skuSizesForCard.length ? skuSizesForCard : category.id === 'mop' ? window.MOP_PRICES[s] || [] : FULL_SIZES[s] || ['4.00 mm'];
            const shapeImg = productImageFor(category.id, color.id, s, grade && grade.id);
            return (
              <button key={s} className="shape-pick-card" onClick={() => needsSubShape ? pickShapeSub(s) : pickShape(s)}>
                  <div className="shape-pick-art" style={{ background: lightenTone(color.hex),
                  padding: shapeImg ? 0 : undefined, overflow: 'hidden' }}>
                    {shapeImg ?
                  <img src={shapeImg} alt={`${color.name} ${meta?.name}`} loading="lazy"
                  /* Hide a failed image so the drawn shape icon behind it shows
                     through, instead of a broken-image icon on the card. */
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                  <ShapeIcon shape={s} size={56} color={color.hex} />}
                  </div>
                  <div className="shape-pick-name">{meta?.name || s}</div>
                  {/* Only join the note with a separator when there is one —
                      a custom shape has no note and used to render "2 sizes ·". */}
                  <div className="shape-pick-meta">
                    {sizes.length} {sizes.length === 1 ? 'size' : 'sizes'}{meta?.note ? ' · ' + meta.note : ''}
                  </div>
                </button>);

          })}
          </div>

          {category.id === 'moissanite' && grade.id === 'def' &&
        <div className="moiss-docs">
            <div className="moiss-docs-head">
              <div className="moiss-docs-eyebrow">Included when you order a certificate</div>
              <h3>Every certified DEF stone ships with a warranty card &amp; certificate</h3>
              <p>Order the optional certificate on any size and you'll receive the genuine Eurostar
                 warranty card and the stone's certificate alongside your goods.</p>
            </div>
            <div className="moiss-docs-cards">
              <DocUploadCard catId="moissanite" gradeId="def" docId="warranty"
            label="Warranty Card" caption="Eurostar warranty card" />
              <DocUploadCard catId="moissanite" gradeId="def" docId="certificate"
            label="Certificate" caption="Stone certificate" />
            </div>
          </div>
        }
        </div>
      }

      {/* ===== STEP 4: SIZE / CARAT ORDER PAD ===== */}
      {step === 4 &&
      <div className="pricepad-wrap"><PriceWatermark code={custCode} company={custCompany} />
      <SizeOrderPad
          product={makeBrowseProduct(route.cat, grade, color, effShape)}
          grade={grade}
          color={color}
          shape={effShape}
          category={category}
          qtyBySize={qtyBySize}
          setQtyBySize={setQtyBySize}
          onBack={() => {
            if (shapeSubs) {setSubShape(null);} else
            if (shapeIds.length > 1) {setShape(null);} else
            if (colors.length > 1) {pickColor(null);} else
            if (subGrades) {setSubGradeId(null);setColorId(null);setShape(null);} else
            {pickGrade(null);}
          }}
          onChangeColor={() => pickColor(null)}
          onChangeGrade={() => pickGrade(null)}
          addToCart={addToCart}
          setRoute={setRoute} />
      </div>
      }
    </div>);

}

// Faint repeating customer-code watermark over price tables (traceability on leaked screenshots).
function PriceWatermark({ code, company }) {
  if (!code) return null;
  const txt = (company ? company + ' · ' : '') + code;
  return (
    <div className="price-wm" aria-hidden="true">
      {Array.from({ length: 80 }).map((_, i) => <span key={i}>{txt}</span>)}
    </div>);

}

function StepDot({ n, label, active, done }) {
  return (
    <div className={`step-dot ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
      <span className="step-dot-circle">{done ? <IconCheck size={14} strokeWidth={2.5} /> : n}</span>
      <span className="step-dot-label">{label}</span>
    </div>);

}

// Sample product photos (round-brilliant renders) keyed by colour id.
// In production this is the SKU's image_url from the bulk-upload sheet.
const GEM_PHOTOS = {
  white: 'white', yellow: 'yellow', blue: 'blue', royal: 'royal', green: 'green',
  pink: 'pink', red: 'red', purple: 'purple', aqua: 'aqua', black: 'black',
  // nearest-match fallbacks for the other tones
  corn: 'aqua', padpar: 'red', turq: 'aqua', lapis: 'blue', milky: 'white',
  olive: 'green', fire: 'red', crystal: 'white', ab: 'purple', cream: 'white',
  grey: 'black', champagne: 'yellow', multi: 'royal'
};
const productPhoto = (colorId) =>
  /^op\d/.test(colorId) ? `assets/products/opal-${colorId}.png` :
  GEM_PHOTOS[colorId] ? `assets/products/gem-${GEM_PHOTOS[colorId]}.png` : null;

// Shared so productImageFor() (product-images.jsx) resolves the stock photo the
// same way everywhere, instead of each screen reimplementing the fallback.
window.productPhoto = productPhoto;

// Pearls: custom header title + subtitle per (grade | drilling). Keyed "gradeId|shape".
const PEARL_HEADERS = {
  'natural|fulldrilled': { title: 'Pearl Strings',
    sub: 'Natural full-drilled pearl strings · premium look · China freshwater pearls' }
};

// ===== Bracelet order pad — one page: pick colour (real photo) + set quantity (per piece) =====
function BraceletOrderPad({ grade, colors, imgPrefix, category, qtyBySize, setQtyBySize, onBack, addToCart, setRoute }) {
  const fmt = (n) => window.formatINR ? window.formatINR(n) : '₹' + Number(n).toLocaleString('en-IN');
  const price = grade.basePrice || 0;
  const [selId, setSelId] = React.useState(colors[0].id);
  const sel = colors.find((c) => c.id === selId) || colors[0];
  // Prefer an admin-uploaded photo, keyed per style (grade) so Rolex and Cartier
  // keep separate images even for shared colour names; fall back to the built-in
  // bracelet asset for that style.
  const img = (id) =>
    (window.getStoredProductImage && window.getStoredProductImage('bracelet', id, 'round', grade.id)) ||
    (imgPrefix || 'assets/products/bracelet-') + id + '.jpg';
  const q = qtyBySize[selId] || 0;
  const setQ = (v) => setQtyBySize((p) => ({ ...p, [selId]: Math.max(0, parseInt(v, 10) || 0) }));
  const bump = (d) => setQtyBySize((p) => ({ ...p, [selId]: Math.max(0, (p[selId] || 0) + d) }));

  const lines = Object.entries(qtyBySize).filter(([, n]) => n > 0);
  const totalPcs = lines.reduce((s, [, n]) => s + n, 0);
  const totalAmt = totalPcs * price;

  const onAddAll = () => {
    if (lines.length === 0) return;
    lines.forEach(([cid, n]) => {
      const c = colors.find((x) => x.id === cid) || sel;
      addToCart({
        pid: 'bracelet-' + grade.id + '-' + cid,
        name: grade.name + ' Bracelet — ' + c.name,
        shape: 'round', size: c.name, quality: grade.name,
        color: c.name, colorHex: c.hex,
        // ct carries the quantity in this line's unit — pieces here — so the
        // cart shows what was actually selected instead of a hardcoded 0.
        qty: n, ct: n, unitMode: 'pc', pcsPerUnit: 1,
        unitPrice: price, perCtPrice: price, certFee: 0,
        lineTotal: n * price, tone: 'def-white', toneHex: c.hex,
        imageUrl: img(cid)
      });
    });
    setQtyBySize({});
  };

  return (
    <div className="browse-step">
      <div className="page-head" style={{ marginBottom: 18 }}>
        <div>
          <div className="crumb">{category.short} · {grade.name}</div>
          <h1>{grade.name} Bracelet</h1>
          <p>Stainless steel band · sold by the piece. Pick a colour, see the band, set your quantity.</p>
        </div>
        <button className="btn btn-ghost" onClick={onBack}>
          {window.IconArrowLeft ? <window.IconArrowLeft size={16} /> : null} Change style
        </button>
      </div>

      <div className="brc-layout">
        {/* Left: live preview + quantity for the selected colour */}
        <div className="brc-preview card">
          <div className="brc-preview-img">
            <img src={img(sel.id)} alt={sel.name + ' bracelet'} />
          </div>
          <div className="brc-preview-body">
            <div className="brc-preview-name">{sel.name}</div>
            <div className="brc-preview-price">{fmt(price)} <span>/ piece</span></div>
            <div className="brc-qty-row">
              <div className="size-pad-stepper">
                <button onClick={() => bump(-1)} disabled={q <= 0} aria-label="decrease">
                  {window.IconMinus ? <window.IconMinus size={13} /> : '−'}
                </button>
                <input type="number" value={q || ''} placeholder="0" min={0}
                onChange={(e) => setQ(e.target.value)} onFocus={(e) => e.target.select()} />
                <button onClick={() => bump(1)} aria-label="increase">
                  {window.IconPlus ? <window.IconPlus size={13} /> : '+'}
                </button>
              </div>
              <div className="brc-line-total">{q > 0 ? fmt(q * price) : '—'}</div>
            </div>
          </div>
        </div>

        {/* Right: colour grid (cropped real photos) */}
        <div className="brc-colors">
          {colors.map((c) => {
            const cq = qtyBySize[c.id] || 0;
            return (
              <button key={c.id} className={`brc-swatch ${c.id === selId ? 'active' : ''}`}
              onClick={() => setSelId(c.id)}>
                <div className="brc-swatch-img"><img src={img(c.id)} alt={c.name} /></div>
                <div className="brc-swatch-name">{c.name}</div>
                {cq > 0 && <span className="brc-swatch-badge">{cq}</span>}
              </button>);

          })}
        </div>
      </div>

      <div className="order-summary" style={{ marginTop: 20 }}>
        <div className="order-summary-stats">
          <div><div className="stat-label">Colours chosen</div><div className="stat-value">{lines.length}</div></div>
          <div><div className="stat-label">Total pieces</div><div className="stat-value">{totalPcs.toLocaleString('en-IN')}</div></div>
          <div><div className="stat-label">Order total</div><div className="stat-value money">{fmt(totalAmt)}</div></div>
        </div>
        <button className="btn btn-accent btn-lg" disabled={lines.length === 0} onClick={onAddAll}>Add to cart</button>
      </div>
    </div>);

}

// ===== Ourosa PP sizes (PP 0–10 with approx mm reference) =====
const OUROSA_SIZES = [
['PP 0', '0.90 mm'], ['PP 1', '0.95 mm'], ['PP 2', '1.05 mm'], ['PP 3', '1.15 mm'],
['PP 4', '1.25 mm'], ['PP 5', '1.35 mm'], ['PP 6', '1.45 mm'], ['PP 7', '1.55 mm'],
['PP 8', '1.65 mm'], ['PP 9', '1.75 mm'], ['PP 10', '1.85 mm']];

const ourosaMM = (label) => (OUROSA_SIZES.find((x) => x[0] === label) || [null, ''])[1];

// ===== White Polki series design pad (B/C/X/Z/PCJ/GJ — design-based ordering) =====
// Each series is a set of named designs with their own W×H footprint (mm).
// Ordered by the packet; pieces = packets × pcs-per-packet; priced per piece.
function PolkiSeriesPad({ product, grade, color, category, seriesKey, designs,
  qtyBySize, setQtyBySize, onBack, addToCart, setRoute }) {
  const updateQty = (id, value) => {
    const v = Math.max(0, Math.floor(parseFloat(value) || 0));
    setQtyBySize((prev) => ({ ...prev, [id]: v }));
  };
  const bumpQty = (id, delta) => {
    setQtyBySize((prev) => {
      const cur = prev[id] || 0;
      return { ...prev, [id]: Math.max(0, cur + delta) };
    });
  };
  const dim = (d) => (d.dims || [d.w, d.h]).map((n) => n.toFixed(2)).join(' × ') + ' mm';
  const soldOutMap = (window.loadSoldOut ? window.loadSoldOut() : {});
  const dSoldOut = (d) => !!soldOutMap[window.soldOutKey(category.id, grade.id, color.id, 'uneven', d.id)];
  const lines = designs.filter((d) => (qtyBySize[d.id] || 0) > 0 && !dSoldOut(d));
  const totalPackets = lines.reduce((s, d) => s + (qtyBySize[d.id] || 0), 0);
  const totalPcs = lines.reduce((s, d) => s + (qtyBySize[d.id] || 0) * d.pcsPerPacket, 0);
  const FOIL_FEE = product.foilCharge || 0;
  const totalFoil = lines.reduce((s, d) => s + (qtyBySize[d.id] || 0) * d.pcsPerPacket * FOIL_FEE, 0);
  const grandTotal = lines.reduce((s, d) => s + (qtyBySize[d.id] || 0) * d.pcsPerPacket * (d.price + FOIL_FEE), 0);

  const onAddAll = () => {
    if (lines.length === 0) return;
    lines.forEach((d) => {
      const pkts = qtyBySize[d.id] || 0;
      const pcs = pkts * d.pcsPerPacket;
      addToCart({
        pid: product.id, name: product.name,
        shape: 'uneven', size: `${d.name} · ${dim(d)}`,
        quality: grade.name, color: color.name, colorHex: color.hex,
        qty: pcs, packets: pkts,
        unitMode: 'pkt', unitPrice: d.price, perCtPrice: d.price,
        foilFee: pcs * FOIL_FEE,
        lineTotal: pcs * (d.price + FOIL_FEE), tone: product.tone, toneHex: color.hex,
      });
    });
    setQtyBySize({});
  };

  const COLS = '290px 140px 110px 120px 1fr 120px';
  return (
    <div className="browse-step">
      <div className="pad-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="crumb">{category.short} · {grade.baseName || 'White Polki'} · {grade.name}</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
            letterSpacing: '-0.02em', margin: '4px 0 6px', lineHeight: 1.05 }}>
            {grade.name} — Uneven Polki
          </h1>
          <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
            Each design has its own shape &amp; footprint (W × H in mm). Order by the
            packet · pieces per packet vary by design · priced per piece.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <IconArrowLeft size={14} /> Change series
          </button>
        </div>
      </div>

      {FOIL_FEE > 0 &&
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 16,
        background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ flex: '0 0 auto', width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg,#e7e9ec,#b9bdc4)', border: '1px solid var(--border-strong)' }}></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>Double foiling · 92.5% silver</div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
            Every piece is double-foiled in 92.5% silver. A compulsory foiling charge of
            ₹{FOIL_FEE}/pc is added on top of the stone price.</div>
        </div>
        <div style={{ flex: '0 0 auto', fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600,
          color: 'var(--fg)', whiteSpace: 'nowrap' }}>+₹{FOIL_FEE}<span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 400 }}>/pc</span></div>
      </div>
      }

      <div className="size-pad polki-pad" style={{ marginTop: 4 }}>
        <div className="size-pad-head">
          <span>Design</span>
          <span style={{ textAlign: 'center' }}>Dimensions</span>
          <span style={{ textAlign: 'right' }}>₹ / pc</span>
          <span style={{ textAlign: 'center' }}>Pcs / packet</span>
          <span style={{ textAlign: 'center' }}>Packets</span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {designs.map((d) => {
          const q = qtyBySize[d.id] || 0;
          const isFilled = q > 0;
          const so = dSoldOut(d);
          const img = getStoredProductImage(category.id, seriesKey + '-' + d.id, 'uneven');
          return (
            <div key={d.id} className={`size-pad-row ${isFilled ? 'filled' : ''} ${so ? 'soldout' : ''}`} style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, gridArea: 'design' }}>
                <div className="polki-design-thumb">
                  {img
                    ? <img src={img} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span className="polki-design-thumb-ph">IMG</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="size-pad-mm" style={{ fontSize: 17 }}>{d.name}</div>
                  <div className="size-pad-unit">design · uneven</div>
                </div>
              </div>
              <div className="size-pad-pcs polki-dim" style={{ textAlign: 'center', gridArea: 'dim' }}>{dim(d)}</div>
              <div className="size-pad-price" style={{ gridArea: 'price' }}>{formatINR(d.price)} <span className="size-pad-unit-sfx">/pc</span>{FOIL_FEE > 0 && <span className="size-pad-unit" style={{ display: 'block', fontSize: 11 }}>+{formatINR(FOIL_FEE)} foil</span>}</div>
              <div className="size-pad-pcs polki-ppp" style={{ textAlign: 'center', gridArea: 'ppp' }}>{d.pcsPerPacket.toLocaleString('en-IN')}</div>
              <div className="size-pad-input-wrap" style={{ gridArea: 'input' }}>
                <div className="size-pad-stepper">
                  <button onClick={() => bumpQty(d.id, -1)} disabled={q <= 0} aria-label="decrease"><IconMinus size={12} /></button>
                  <input type="number" value={q || ''} placeholder="0" min={0} step={1}
                    onChange={(e) => updateQty(d.id, e.target.value)} onFocus={(e) => e.target.select()} />
                  <button onClick={() => bumpQty(d.id, 1)} aria-label="increase"><IconPlus size={12} /></button>
                </div>
                {q === 0 && <button className="size-pad-add" onClick={() => bumpQty(d.id, 1)}>+ Add 1 pkt</button>}
                {isFilled && <div className="size-pad-pcs-note">= {(q * d.pcsPerPacket).toLocaleString('en-IN')} pcs</div>}
              </div>
              <div className="size-pad-total" style={{ gridArea: 'total' }}>
                {isFilled ? formatINR(q * d.pcsPerPacket * (d.price + FOIL_FEE)) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </div>
            </div>);
        })}
      </div>

      <div style={{ fontSize: 12, color: 'var(--fg-meta)', margin: '12px 2px 0', fontStyle: 'italic' }}>
        * Dimensions are W × H in mm. Prices &amp; pieces-per-packet are indicative and finalised from the current price list.
      </div>

      <div className="order-summary">
        <div className="order-summary-stats">
          <div><div className="stat-label">Designs selected</div><div className="stat-value">{lines.length}</div></div>
          <div><div className="stat-label">Total packets</div><div className="stat-value">{totalPackets.toLocaleString('en-IN')} pkt</div></div>
          <div><div className="stat-label">Approx pieces</div><div className="stat-value">{totalPcs.toLocaleString('en-IN')}</div></div>
          {totalFoil > 0 && <div><div className="stat-label">Foiling ({formatINR(FOIL_FEE)}/pc)</div><div className="stat-value money">{formatINR(totalFoil)}</div></div>}
          <div><div className="stat-label">Order total</div><div className="stat-value money">{formatINR(grandTotal)}</div></div>
        </div>
        <div className="pdp-cta">
          <button className="btn btn-accent btn-lg btn-block" onClick={onAddAll} disabled={lines.length === 0}
            style={{ opacity: lines.length === 0 ? 0.45 : 1, cursor: lines.length === 0 ? 'not-allowed' : 'pointer' }}>
            <IconBag size={18} />
            {lines.length === 0 ? 'Enter packets to continue' : `Add ${lines.length} design${lines.length > 1 ? 's' : ''} to order`}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => setQtyBySize({})} disabled={lines.length === 0}>Clear</button>
        </div>
      </div>
    </div>);
}

// ===== Reusable size/carat order pad =====
function SizeOrderPad({ product, grade, color, shape, category, qtyBySize, setQtyBySize,
  onBack, onChangeColor, onChangeGrade, addToCart, setRoute }) {
  // White Polki series (B/C/X/Z/PCJ/GJ) use a design-based pad, not a size list.
  if (category.id === 'polki') {
    const sk = (grade.id.match(/-(b|c|x|z|pcj|gj)$/) || [])[1];
    const designs = sk && window.POLKI_SERIES_DESIGNS[sk];
    if (designs) {
      return <PolkiSeriesPad product={product} grade={grade} color={color} category={category}
        seriesKey={sk} designs={designs} qtyBySize={qtyBySize} setQtyBySize={setQtyBySize}
        onBack={onChangeGrade} addToCart={addToCart} setRoute={setRoute} />;
    }
  }
  if (category.id === 'mop') {
    return <MopOrderPad grade={grade} shape={shape} category={category}
    qtyBySize={qtyBySize} setQtyBySize={setQtyBySize}
    onBack={onBack} onChangeGrade={onChangeGrade} addToCart={addToCart} setRoute={setRoute} />;
  }
  if (category.id === 'icecut') {
    return <IceCutOrderPad grade={grade} color={color} shape={shape} category={category}
    qtyBySize={qtyBySize} setQtyBySize={setQtyBySize}
    onBack={onBack} onChangeColor={onChangeColor} addToCart={addToCart} setRoute={setRoute} />;
  }
  if (category.id === 'hollowmop') {
    return <HollowMopOrderPad grade={grade} shape={shape} category={category}
    qtyBySize={qtyBySize} setQtyBySize={setQtyBySize}
    onBack={onBack} addToCart={addToCart} setRoute={setRoute} />;
  }
  if (category.id === 'laser') {
    return <LaserOrderPad grade={grade} color={color} shape={shape} category={category}
    qtyBySize={qtyBySize} setQtyBySize={setQtyBySize}
    onBack={onBack} onChangeColor={onChangeColor} addToCart={addToCart} setRoute={setRoute} />;
  }
  if (category.id === 'bracelet') {
    return <BraceletOrderPad grade={grade} color={color} category={category}
    qtyBySize={qtyBySize} setQtyBySize={setQtyBySize}
    onBack={onChangeColor} addToCart={addToCart} setRoute={setRoute} />;
  }
  const unit = grade.unit === 'strip' ? 'strip' : catUnit(category.id); // 'ct' | 'pc' | 'pkt' | 'strip'
  const unitWord = unitLabel(unit); // ct / pc / pkt / strip
  const unitName = unitLabelLong(unit); // carat / piece / packet / strip
  const byCarat = unit === 'ct';
  const byStrip = unit === 'strip';
  // Natural Multi Sapphires: strip-sold AND shows a carats-per-strip column.
  const natStrip = category.id === 'multisapphire' && grade.id === 'aaa';
  const stripCols = natStrip ? '120px 120px 130px 1fr 120px' : '120px 140px 1fr 130px';
  const moqUnits = category.id === 'beads' ? 100 : (category.id === 'moissanite' || category.id === 'labgrown' ? 1 : unitMoq(unit));
  // Moissanite: 6.50 mm+ is sold per piece (MOQ 1 pc); below that, per carat (MOQ 1 ct).
  // Lab Grown reuses the same chart-driven carat-weight model (no ₹80 certificate).
  const mixedMoiss = category.id === 'moissanite' || category.id === 'labgrown';
  // Moissanite: chart-driven. Below the per-shape threshold → carat input;
  // at/above → entered in PIECES but billed by carat.
  const pieceInput = (size) => mixedMoiss && moissIsPiece(shape, size);
  const rowUnit = (size) => pieceInput(size) ? 'pc' : unit;
  // An uploaded SKU carries its own MOQ from the CSV.
  const sizeMoq = (size) => {
    if (pieceInput(size)) return 1;
    const s = window.uploadedSkuFor ? uploadedSkuFor(category.id, shape, size, grade) : null;
    return s && Number(s.moq) > 0 ? Number(s.moq) : moqUnits;
  };
  const stepUnits = category.id === 'beads' ? 100 : 1;
  // Moissanite: optional ₹80/pc certificate, offered from the same per-shape size.
  const [certOff, setCertOff] = React.useState({});
  const certEligible = (size) => (category.id === 'moissanite' || (category.id === 'labgrown' && grade.id === 'labgrown')) && moissIsPiece(shape, size);
  // Moissanite per-carat rate — per size, per grade, from the uploaded price
  // sheet (window.moissRate). Falls back to the grade's flat basePrice when a
  // size/grade isn't in the sheet (and for Lab Grown, which has no sheet).
  const moissPerCt = (size) => {
    if (category.id === 'moissanite') {
      const r = window.moissRate ? window.moissRate(shape, size, grade.id) : null;
      if (r != null) return r;
    }
    return product.price;
  };
  const moissCt = (size) => moissCtEach(shape, size);
  const billedCt = (size, q) => pieceInput(size) ? q * moissCt(size) : q;
  const hex = color.hex;
  // Full resolution (uploaded image first), so the hero, the line added to the
  // cart and every later screen all show the same picture.
  const photo = productImageFor(category.id, color.id, shape, grade && grade.id);
  const soldOutMap = (window.loadSoldOut ? window.loadSoldOut() : {});
  // Sold out either because the Admin marked this exact combination, or
  // because the uploaded SKU itself says the stock is out.
  const sizeSoldOut = (s) => {
    if (soldOutMap[window.soldOutKey(category.id, grade.id, color.id, shape, s)]) return true;
    const sku = window.uploadedSkuFor ? uploadedSkuFor(category.id, shape, s, grade) : null;
    return !!(sku && sku.stock === 'out');
  };
  // On-hand pieces for a row, from the uploaded SKU's stockCount. The pad used
  // to read only stock === 'out', so a row with 110 in stock happily accepted
  // 126 pieces. Infinity means "no known limit" — leave those rows unclamped
  // rather than blocking an order on missing data.
  //
  // Only rows entered in PIECES are capped: stockCount is a piece count, and a
  // carat or packet row would be clamping against a different unit.
  const sizeStock = (s) => {
    // Sold out is a hard zero. Routing it through the cap means the quantity
    // box, the steppers and the "Add" button are all limited to 0 in every row
    // variant, instead of a sold-out row accepting input that is silently
    // dropped when the cart is built.
    if (sizeSoldOut(s)) return 0;
    const sku = window.uploadedSkuFor ? uploadedSkuFor(category.id, shape, s, grade) : null;
    const n = sku ? Number(sku.stockCount) : NaN;
    // 0 is the schema default and means "not tracked", not "none left" — a
    // genuinely exhausted SKU is flagged stock === 'out' and handled by
    // sizeSoldOut above. Capping on 0 here would block every untracked SKU.
    if (!isFinite(n) || n <= 0) return Infinity;
    return rowUnit(s) === 'pc' ? n : Infinity;
  };
  const capQty = (s, v) => Math.min(v, sizeStock(s));
  // Show the weight column for weight-priced categories, or for an Alpanite
  // colour whose uploaded price sheet carries a real grams/1000-pc figure.
  const alpHasWt = category.id === 'alpanite' && color && window.alpSheetHasWeight && window.alpSheetHasWeight(color.id, shape);
  const hdHasWt = category.id === 'highdensity' && grade && window.hdHasWeight && window.hdHasWeight(grade.id, shape);
  const czHasWt = category.id === 'whitecz' && grade && window.czHasWeight && window.czHasWeight(grade.id, shape);
  const labopalHasWt = category.id === 'labopal' && grade && color && window.labopalHasWeight && window.labopalHasWeight(grade.id, color.id, shape);
  const polkiHasWt = category.id === 'polki' && grade && window.polkiHasWeight && window.polkiHasWeight(grade.id, shape);
  const cabHasWt = category.id === 'cabochon' && grade && color && window.cabHasWeight && window.cabHasWeight(grade.id, color.id, shape);
  const pearlHasWt = category.id === 'pearls' && grade && color && window.pearlSheetHasWeight && window.pearlSheetHasWeight(grade.id, color.id, shape);
  const coralHasWt = category.id === 'coral' && grade && window.coralHasWeight && window.coralHasWeight(grade.id, shape);
  const showWt = catShowWeight(category.id) || alpHasWt || hdHasWt || czHasWt || labopalHasWt || polkiHasWt || cabHasWt || pearlHasWt || coralHasWt;
  const navMode = category.id === 'navratna'; // sold by packet, one flat price per packet, no pcs/packet
  const showPieceWt = false;
  // Pearls are per-packet priced, EXCEPT Natural Cabs which are priced per piece (ordered in packets).
  const packetPriced = (catPacketPriced(category.id) || grade.packetPriced) &&
  !(category.id === 'pearls' && grade.id === 'natural' && shape === 'cabs');
  // Packet-priced sheets that carry weight (e.g. full-drilled pearls) show weight PER PACKET,
  // matching the price sheet, instead of the per-1000-pcs normalisation used elsewhere.
  const packetWtMode = showWt && packetPriced && !navMode;
  const pearlHdr = category.id === 'pearls' ? PEARL_HEADERS[grade.id + '|' + shape] : null;
  // Natural full-drilled pearls: ordered by STRING, with weight & price per string.
  const stringMode = category.id === 'pearls' && grade.id === 'natural' && shape === 'fulldrilled';
  // Natural undrilled & half-drilled pearls: each packet is a fixed 50 g lot, priced ₹250/gram.
  // Half-drilled / undrilled naturals normally sell as a fixed 50 g lot — unless an
  // uploaded per-piece price sheet exists for this colour+shape, which prices per packet.
  const hasPearlSheet = category.id === 'pearls' && grade && color && window.pearlSheetSizes && window.pearlSheetSizes(grade.id, color.id, shape).length > 0;
  const lotMode = category.id === 'pearls' && grade.id === 'natural' && (shape === 'undrilled' || shape === 'halfdrilled') && !hasPearlSheet;
  const LOT_GRAMS = 50,LOT_RATE_G = 250,LOT_PRICE = LOT_GRAMS * LOT_RATE_G;
  // Opaque · Natural-look: each packet is a fixed 100 ct lot, priced per carat.
  // Opal-look is per-piece/packet (its own price sheet), so it uses the normal pad.
  const ctLotMode = category.id === 'opaque' && grade && grade.id !== 'opal';
  const OP_LOT_CT = 100,OP_RATE_CT = product.price,OP_PRICE = OP_LOT_CT * OP_RATE_CT;
  // Per-size ₹/ct from an uploaded natural-opaque sheet, falling back to the flat rate.
  const opRowRate = (size) => (window.opaqueNatRate && color ? window.opaqueNatRate(grade.id, color.id, shape, size) : null) || OP_RATE_CT;
  const ourosaMode = category.id === 'ourosa';
  // Sizes actually uploaded for this category + shape win over the built-in
  // charts: a bulk-uploaded category has no chart entry, which is why every
  // shape used to show a single hardcoded "4.00 mm" row.
  const skuSizes = (window.uploadedSizesFor ? uploadedSizesFor(category.id, shape, grade) : []);
  // Moissanite is fully chart + price-sheet driven: always use the full size
  // chart, and never let a stray uploaded/sample SKU (which would otherwise
  // collapse the pad to just its 1-2 sizes at the flat price) take over.
  const alpGreen = category.id === 'alpanite' && color && color.id === 'green' && window.alpGreenSizes && window.alpGreenSizes(shape).length ? window.alpGreenSizes(shape) : null;
  const alpBlue = category.id === 'alpanite' && color && color.id === 'blue' && window.alpBlueSizes && window.alpBlueSizes(shape).length ? window.alpBlueSizes(shape) : null;
  // Alpanite colours with an uploaded round price chart (Yellow / 162-2 / Aqua / Brown).
  const alpSheet = category.id === 'alpanite' && color && window.alpSheetSizes && window.alpSheetSizes(color.id, shape).length ? window.alpSheetSizes(color.id, shape) : null;
  // HD Zirconia: per-grade round price+weight sheet (Mercury Etoile/H/HH/Super Heavy/HHH).
  const hdSheet = category.id === 'highdensity' && grade && window.hdSizes && window.hdSizes(grade.id, shape).length ? window.hdSizes(grade.id, shape) : null;
  // Corundum: per grade+colour price sheet (e.g. EXCEL AAA · Ruby 5).
  const corSheet = category.id === 'corundum' && grade && color && window.corSizes && window.corSizes(grade.id, color.id, shape).length ? window.corSizes(grade.id, color.id, shape) : null;
  // White Fancy Shapes: per-grade price sheet (Le Plus / Au Desus).
  const wfSheet = category.id === 'whitefancy' && grade && window.wfSizes && window.wfSizes(grade.id, shape).length ? window.wfSizes(grade.id, shape) : null;
  // White Round CZ: per-subgrade round price+weight sheet.
  const czSheet = category.id === 'whitecz' && grade && window.czSizes && window.czSizes(grade.id, shape).length ? window.czSizes(grade.id, shape) : null;
  // Color CZ: per grade+colour price sheet (Green / Aqua / Brown / Tanzanite / Rhodolite).
  const colorCzSheet = category.id === 'cz' && grade && color && window.colorCzSizes && window.colorCzSizes(grade.id, color.id, shape).length ? window.colorCzSizes(grade.id, color.id, shape) : null;
  // Opaque · Opal-look Pastel: one price table per grade, shared across colours.
  const opaqueSheet = category.id === 'opaque' && grade && window.opaqueSizes && window.opaqueSizes(grade.id, shape).length ? window.opaqueSizes(grade.id, shape) : null;
  // Opaque · Natural-look: per grade+colour ₹/ct sheet (carat-lot pricing).
  const opaqueNatSheet = category.id === 'opaque' && grade && color && window.opaqueNatSizes && window.opaqueNatSizes(grade.id, color.id, shape).length ? window.opaqueNatSizes(grade.id, color.id, shape) : null;
  // Polki (Kundan foil / Flat regular), Lab Opals, Cabochons: per-sheet size lists.
  const polkiSheet = category.id === 'polki' && grade && window.polkiSizes && window.polkiSizes(grade.id, shape).length ? window.polkiSizes(grade.id, shape) : null;
  const labopalSheet = category.id === 'labopal' && grade && color && window.labopalSizes && window.labopalSizes(grade.id, color.id, shape).length ? window.labopalSizes(grade.id, color.id, shape) : null;
  const cabSheet = category.id === 'cabochon' && grade && color && window.cabSizes && window.cabSizes(grade.id, color.id, shape).length ? window.cabSizes(grade.id, color.id, shape) : null;
  // Pearls · per grade+colour price sheet (e.g. fresh-water half-drilled).
  const pearlSheet = category.id === 'pearls' && grade && color && window.pearlSheetSizes && window.pearlSheetSizes(grade.id, color.id, shape).length ? window.pearlSheetSizes(grade.id, color.id, shape) : null;
  // Hollow MOP · per grade (White MOP / Black Onyx) price sheet.
  const hmopSheet = category.id === 'hollowmop' && grade && window.hollowmopSizes && window.hollowmopSizes(grade.id, shape).length ? window.hollowmopSizes(grade.id, shape) : null;
  // Lab Alexandrite · single-grade price sheet.
  const alexSheet = category.id === 'alex' && window.alexSizes && window.alexSizes(shape).length ? window.alexSizes(shape) : null;
  // Rajkot mass zirconia · per grade+colour round price sheet.
  const rajkotSheet = category.id === 'rajkot' && grade && color && window.rajkotSizes && window.rajkotSizes(grade.id, color.id, shape).length ? window.rajkotSizes(grade.id, color.id, shape) : null;
  // Milky Corals & Olives · per-grade cab price sheet.
  const coralSheet = category.id === 'coral' && grade && window.coralSizes && window.coralSizes(grade.id, shape).length ? window.coralSizes(grade.id, shape) : null;
  // Evil Eye stones price sheet.
  const evileyeSheet = category.id === 'evileye' && window.evileyeSizes && window.evileyeSizes(shape).length ? window.evileyeSizes(shape) : null;
  let sizes = category.id === 'moissanite' ? (moissSizes(shape).length ? moissSizes(shape) : FULL_SIZES[shape] || ['4.00 mm']) : alpGreen ? alpGreen : alpBlue ? alpBlue : alpSheet ? alpSheet : hdSheet ? hdSheet : corSheet ? corSheet : wfSheet ? wfSheet : czSheet ? czSheet : colorCzSheet ? colorCzSheet : opaqueNatSheet ? opaqueNatSheet : opaqueSheet ? opaqueSheet : polkiSheet ? polkiSheet : labopalSheet ? labopalSheet : cabSheet ? cabSheet : pearlSheet ? pearlSheet : hmopSheet ? hmopSheet : alexSheet ? alexSheet : rajkotSheet ? rajkotSheet : coralSheet ? coralSheet : evileyeSheet ? evileyeSheet : skuSizes.length ? skuSizes.slice() : (SIZES_BY_CATEGORY && SIZES_BY_CATEGORY[category.id]) ? SIZES_BY_CATEGORY[category.id].slice() : ourosaMode ? OUROSA_SIZES.map((x) => x[0]) : mixedMoiss ? moissSizes(shape).length ? moissSizes(shape) : FULL_SIZES[shape] || ['4.00 mm'] : byStrip ? FULL_SIZES[shape] || ['4.00 mm'] : FULL_SIZES[shape] || ['4.00 mm'];
  // A colour may cap its size range (e.g. Alpanite Yellow / 162/2 → 1.00–2.00 mm only).
  if (color && color.sizeMax) {sizes = sizes.filter((s) => (parseFloat(s) || 0) <= color.sizeMax + 0.001);}
  // A colour may set a minimum size. Fancy NxN sizes (e.g. "3x4") are kept as-is
  // (they already start small); only plain mm round sizes below the min are dropped.
  if (color && color.sizeMin) {sizes = sizes.filter((s) => /x/i.test(s) || (parseFloat(s) || 0) >= color.sizeMin - 0.001);}

  const updateQty = (size, value) => {
    const v = capQty(size, Math.max(0, parseFloat(value) || 0));
    setQtyBySize((prev) => ({ ...prev, [size]: v }));
  };
  // Beads (stepUnits>1) must be ordered in whole multiples of the step (100 ct) — snap on blur.
  const snapRow = (size) => {
    if (stepUnits <= 1) return;
    setQtyBySize((prev) => {
      const cur = prev[size] || 0;
      if (cur <= 0) return prev;
      const snapped = Math.max(stepUnits, Math.round(cur / stepUnits) * stepUnits);
      return { ...prev, [size]: capQty(size, snapped) };
    });
  };
  const bumpQty = (size, delta) => {
    setQtyBySize((prev) => {
      const current = prev[size] || 0;
      const next = Math.max(0, current + delta);
      if (current === 0 && delta > 0) return { ...prev, [size]: capQty(size, Math.max(sizeMoq(size), next)) };
      return { ...prev, [size]: capQty(size, next) };
    });
  };
  const fillRow = (size) => bumpQty(size, sizeMoq(size));
  // Natural Multi Sapphires: priced per CARAT, billed by the strip's carat weight.
  // An uploaded SKU prices its own row: the CSV's price is the real per-piece
  // rate for that exact size, so it must beat the grade × size-multiplier
  // estimate the built-in charts produce.
  const skuFor = (size) => {
    // Euro Alp Green: synthesise a per-size SKU from the uploaded price sheet
    // (final ₹/piece + pcs per box) so the packet pad prices it directly.
    if (category.id === 'alpanite' && color && color.id === 'green' && window.alpGreenSku) {
      const a = window.alpGreenSku(shape, size);
      if (a) return a;
    }
    if (category.id === 'alpanite' && color && color.id === 'blue' && window.alpBlueSku) {
      const a = window.alpBlueSku(shape, size);
      if (a) return a;
    }
    // Alpanite colours priced from an uploaded round chart (Yellow / 162-2 / Aqua / Brown).
    if (category.id === 'alpanite' && color && window.alpSheetSku) {
      const a = window.alpSheetSku(color.id, shape, size);
      if (a) return a;
    }
    // HD Zirconia: per-grade price+weight sheet.
    if (category.id === 'highdensity' && grade && window.hdSku) {
      const a = window.hdSku(grade.id, shape, size);
      if (a) return a;
    }
    // Corundum: per grade+colour price sheet (EXCEL AAA · Ruby 5, priced per piece).
    if (category.id === 'corundum' && grade && color && window.corSku) {
      const a = window.corSku(grade.id, color.id, shape, size);
      if (a) return a;
    }
    // White Fancy Shapes: per-grade price sheet (Le Plus / Au Desus).
    if (category.id === 'whitefancy' && grade && window.wfSku) {
      const a = window.wfSku(grade.id, shape, size);
      if (a) return a;
    }
    // White Round CZ: per-subgrade round price sheet.
    if (category.id === 'whitecz' && grade && window.czSku) {
      const a = window.czSku(grade.id, shape, size);
      if (a) return a;
    }
    // Color CZ: per grade+colour price sheet (Green / Aqua / Brown / Tanzanite / Rhodolite).
    if (category.id === 'cz' && grade && color && window.colorCzSku) {
      const a = window.colorCzSku(grade.id, color.id, shape, size);
      if (a) return a;
    }
    // Opaque · Opal-look Pastel: per-grade price table (shared across colours).
    if (category.id === 'opaque' && grade && window.opaqueSku) {
      const a = window.opaqueSku(grade.id, shape, size);
      if (a) return a;
    }
    // Polki (Kundan foil / Flat regular) per-grade price sheet.
    if (category.id === 'polki' && grade && window.polkiSku) {
      const a = window.polkiSku(grade.id, shape, size);
      if (a) return a;
    }
    // Lab Opals per grade+colour price sheet (with weight).
    if (category.id === 'labopal' && grade && color && window.labopalSku) {
      const a = window.labopalSku(grade.id, color.id, shape, size);
      if (a) return a;
    }
    // Cabochons per grade+colour price sheet.
    if (category.id === 'cabochon' && grade && color && window.cabSku) {
      const a = window.cabSku(grade.id, color.id, shape, size);
      if (a) return a;
    }
    // Pearls per grade+colour price sheet.
    if (category.id === 'pearls' && grade && color && window.pearlSheetSku) {
      const a = window.pearlSheetSku(grade.id, color.id, shape, size);
      if (a) return a;
    }
    // Hollow MOP per grade price sheet.
    if (category.id === 'hollowmop' && grade && window.hollowmopSku) {
      const a = window.hollowmopSku(grade.id, shape, size);
      if (a) return a;
    }
    // Lab Alexandrite single-grade price sheet.
    if (category.id === 'alex' && window.alexSku) {
      const a = window.alexSku(shape, size);
      if (a) return a;
    }
    // Rajkot mass zirconia per grade+colour price sheet.
    if (category.id === 'rajkot' && grade && color && window.rajkotSku) {
      const a = window.rajkotSku(grade.id, color.id, shape, size);
      if (a) return a;
    }
    // Milky Corals & Olives per-grade cab price sheet.
    if (category.id === 'coral' && grade && window.coralSku) {
      const a = window.coralSku(grade.id, shape, size);
      if (a) return a;
    }
    // Ourosa per-colour round price sheet (PP-size labels).
    if (category.id === 'ourosa' && color && window.ourosaSku) {
      const a = window.ourosaSku(color.id, shape, size);
      if (a) return a;
    }
    // Evil Eye stones price sheet.
    if (category.id === 'evileye' && window.evileyeSku) {
      const a = window.evileyeSku(shape, size);
      if (a) return a;
    }
    return window.uploadedSkuFor ? uploadedSkuFor(category.id, shape, size, grade) : null;
  };
  const skuPriced = (size) => {
    const s = skuFor(size);
    return s && typeof s.price === 'number' && s.price > 0 ? s : null;
  };
  // Pieces in one packet of this size. A saved SKU carries its own count, set
  // in Admin > Pricing; it must beat the built-in chart or an edit made in the
  // panel would never reach the customer.
  const rowPacketPcs = (size) => {
    const s = skuFor(size);
    const n = s ? Number(s.pcsPerPacket) : NaN;
    return isFinite(n) && n > 0 ? n : packetPcs(category.id, size);
  };
  const rate = (size) => {
    const s = skuPriced(size);
    if (s) return rowUnit(size) === 'ct' ? Math.round(s.price * pcsPerCt(size)) : rowUnit(size) === 'pkt' ? s.price * rowPacketPcs(size) : s.price;
    return stringMode ? pearlStringPrice(size) :
    lotMode ? LOT_PRICE :
    ctLotMode ? OP_LOT_CT * opRowRate(size) :
    natStrip ? stripCarats(size) * product.price :
    byStrip ? product.price :
    unitRate(product, size, rowUnit(size), category.id);
  };
  const piecePrice = (size) => { const s = skuPriced(size); return s ? s.price : sizeUnitPrice(product, size); }; // per-piece rate
  // Amount for the stones on a row (excludes certificate).
  const stoneAmount = (size, q) => mixedMoiss ? Math.round(billedCt(size, q) * moissPerCt(size)) : q * rate(size);
  // Pieces represented by a row's quantity.
  const rowPcs = (size, q) => stringMode ? q :
  lotMode ? q :
  ctLotMode ? q :
  mixedMoiss ?
  pieceInput(size) ? q : Math.round(q * moissPcsPerCt(shape, size)) :
  // Packet rows use the SKU's own pieces-per-packet when it has one.
  rowUnit(size) === 'pkt' ? q * rowPacketPcs(size) :
  unitToPcs(rowUnit(size), size, q, category.id);

  const lines = Object.entries(qtyBySize).filter(([size, q]) => q > 0 && !sizeSoldOut(size));
  const totalUnits = lines.reduce((s, [, q]) => s + q, 0);
  const totalStringWt = stringMode ? lines.reduce((s, [size, q]) => s + q * pearlStringWt(size), 0) : 0;
  const totalPcs = lines.reduce((s, [size, q]) => s + rowPcs(size, q), 0);
  const totalAmount = lines.reduce((s, [size, q]) => s + stoneAmount(size, q), 0);
  // Optional certificate: Moissanite ₹80/pc (included by default), Lab Grown IGI ₹2000/pc (opt-in).
  const CERT_FEE = category.id === 'labgrown' ? 2000 : 80;
  const certLabel = category.id === 'labgrown' ? 'IGI certificate' : 'certificate';
  const certDefaultOn = category.id !== 'labgrown';
  const certIncluded = (size) => certOff[size] === undefined ? certDefaultOn : !certOff[size];
  const certForLine = (size, q) => certEligible(size) && certIncluded(size) ? rowPcs(size, q) * CERT_FEE : 0;
  const totalCert = lines.reduce((s, [size, q]) => s + certForLine(size, q), 0);
  // Samosa Foil: compulsory per-piece double-foiling charge (92.5% silver).
  const FOIL_FEE = product.foilCharge || 0;
  const foilForLine = (size, q) => FOIL_FEE ? rowPcs(size, q) * FOIL_FEE : 0;
  const totalFoil = lines.reduce((s, [size, q]) => s + foilForLine(size, q), 0);
  const grandTotal = totalAmount + totalCert + totalFoil;

  const onAddAll = () => {
    if (lines.length === 0) return;
    lines.forEach(([size, q]) => {
      addToCart({
        // The real SKU behind THIS row, not the synthesised browse product.
        // makeBrowseProduct mints an id per category+grade+colour+shape that
        // exists in no table, and every size on the pad shared it — so the
        // server could not match a line to a product and nothing was ever
        // deducted from stock. Each size is its own uploaded SKU with its own
        // count, which is exactly what skuFor(size) returns.
        pid: (skuFor(size) || product).id, name: product.name,
        // Resolve the image once, here, and carry it on the line. The cart,
        // checkout and order screens have no category on a line, so they cannot
        // rebuild the cat|colour|shape key an uploaded image is stored under —
        // which is why they fell back to the stock photo and showed something
        // different from the pad the line was added from.
        imageUrl: photo || null,
        shape, size, quality: grade.name,
        color: color.name, colorHex: hex,
        qty: navMode ? q : rowPcs(size, q),
        ct: billedCt(size, q),
        unitMode: navMode ? 'pkt' : mixedMoiss ? 'ct' : stringMode ? 'string' : lotMode ? 'pkt' : ctLotMode ? 'pkt' : rowUnit(size),
        unitPrice: navMode ? sizeUnitPrice(product, size) : mixedMoiss ? moissPerCt(size) : rate(size),
        perCtPrice: navMode ? sizeUnitPrice(product, size) : mixedMoiss ? moissPerCt(size) : rate(size),
        certFee: certForLine(size, q),
        foilFee: foilForLine(size, q),
        lineTotal: navMode ? q * sizeUnitPrice(product, size) + foilForLine(size, q) : stoneAmount(size, q) + certForLine(size, q) + foilForLine(size, q),
        tone: product.tone,
        toneHex: hex
      });
    });
    setQtyBySize({});
  };

  return (
    <div className="browse-step">
      <div className="pad-header">
        <ProductHero category={category} color={color} shape={shape} grade={grade}
        photo={photo} hex={hex} lightenTone={lightenTone} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="crumb">{category.short} · {grade.name} · {color.name} · {findShape(shape)?.name}</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 32,
            letterSpacing: '-0.02em', margin: '4px 0 6px', lineHeight: 1.05 }}>
            {category.id === 'pearls' ?
            <React.Fragment>{color.name} {findShape(shape)?.name} {pearlHdr ? pearlHdr.title : 'Pearls'}</React.Fragment> :
            <React.Fragment>{color.name} {findShape(shape)?.name} {grade.name}</React.Fragment>}
          </h1>
          <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 14 }}>
            {pearlHdr && pearlHdr.sub ? pearlHdr.sub :
            ctLotMode ?
            `Sold by the packet · each packet is a 100 ct lot · priced per carat` :
            lotMode ?
            `Sold by the packet · choose your sizes below · MOQ 1 packet` :
            byStrip ?
            `Sold by the strip · choose your sizes below · MOQ 1 strip per size` :
            <React.Fragment>{unit === 'pkt' ?
              <React.Fragment>Order by the packet · enter packets against any size · MOQ {moqUnits} packet per size ·
                      pieces per packet vary by size · {packetPriced ? 'priced per packet' : 'priced per piece'}</React.Fragment> :
              <React.Fragment>Enter {unitName} quantities against any size below ·
                      MOQ {moqUnits} {unitWord} per size{category.id === 'beads' ? ' · in multiples of 100 ct' : ' · ±0.05 mm tolerance'}
                      {category.id === 'moissanite' && ' · 6.00 mm+ entered by piece, billed by carat · optional ₹80/pc certificate'}
                      {category.id === 'labgrown' && grade.id === 'labgrown' && ' · larger sizes billed by carat · optional ₹2,000/pc IGI certificate'}</React.Fragment>}</React.Fragment>}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <IconArrowLeft size={14} /> Change shape
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onChangeColor}>Change colour</button>
        </div>
      </div>

      {FOIL_FEE > 0 &&
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 16,
        background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ flex: '0 0 auto', width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg,#e7e9ec,#b9bdc4)', border: '1px solid var(--border-strong)' }}></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>Double foiling · 92.5% silver</div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
            Every piece is double-foiled in 92.5% silver. A compulsory foiling charge of
            ₹{FOIL_FEE}/pc is added on top of the stone price.</div>
        </div>
        <div style={{ flex: '0 0 auto', fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600,
          color: 'var(--fg)', whiteSpace: 'nowrap' }}>+₹{FOIL_FEE}<span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 400 }}>/pc</span></div>
      </div>
      }

      {category.id === 'clover' &&
      <div className="mop-measure" style={{ marginBottom: 16 }}>
        <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
          <defs>
            <marker id="clvArrowE" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="var(--emerald)" />
            </marker>
            <marker id="clvArrowS" markerWidth="7" markerHeight="7" refX="1" refY="3" orient="auto">
              <path d="M6 0 L0 3 L6 6 Z" fill="var(--emerald)" />
            </marker>
          </defs>
          <path d="M46 16 C56 16 60 26 53 33 C60 32 76 36 76 46 C76 56 60 60 53 53 C60 60 56 76 46 76 C36 76 32 60 39 53 C32 60 16 56 16 46 C16 36 32 32 39 39 C32 32 36 16 46 16 Z"
          fill="var(--paper-2)" stroke="var(--border-strong)" strokeWidth="1.5" />
          <line x1="26" y1="66" x2="66" y2="26" stroke="var(--emerald)" strokeWidth="1.6"
          strokeDasharray="4 3" markerStart="url(#clvArrowS)" markerEnd="url(#clvArrowE)" />
        </svg>
        <div>
          <div className="mop-measure-title">How to measure — Corner to Corner (C2C)</div>
          <div className="mop-measure-sub">Measure across the clover from one petal tip to the opposite
            petal tip (the full diagonal). All clover sizes are corner-to-corner.</div>
        </div>
      </div>
      }

      {stringMode ?
      <div className="size-pad string-pad" style={{ marginTop: 4 }}>
        <div className="size-pad-head" style={{ gridTemplateColumns: '120px 130px 130px 1fr 120px' }}>
          <span>Size</span>
          <span style={{ textAlign: 'center' }}>Weight / string</span>
          <span style={{ textAlign: 'right' }}>₹ / string</span>
          <span style={{ textAlign: 'center' }}>Strings</span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {sizes.map((s) => {
          const r = rate(s);
          const q = qtyBySize[s] || 0;
          const lineTotal = q * r;
          const isFilled = q > 0;
          const so = sizeSoldOut(s);
          return (
            <div key={s} className={`size-pad-row ${isFilled ? 'filled' : ''} ${so ? 'soldout' : ''}`} style={{ gridTemplateColumns: '120px 130px 130px 1fr 120px' }}>
            <div className="size-pad-size">
              <div className="size-pad-mm">{s.replace(' mm', '')}</div>
              <div className="size-pad-unit">mm string</div>
            </div>
            <div className="size-pad-pcs">{pearlStringWt(s)} <span className="size-pad-unit-sfx">g</span></div>
            <div className="size-pad-price">{formatINR(r)}</div>
            <div className="size-pad-input-wrap">
              <div className="size-pad-stepper">
                <button onClick={() => bumpQty(s, -stepUnits)} disabled={q <= 0} aria-label="decrease">
                  <IconMinus size={12} />
                </button>
                <input type="number" value={q || ''} placeholder="0" min={0} step={stepUnits}
                  onChange={(e) => updateQty(s, e.target.value)}
                  onFocus={(e) => e.target.select()} onBlur={() => snapRow(s)} />
                <button onClick={() => bumpQty(s, stepUnits)} disabled={q >= sizeStock(s)} aria-label="increase">
                  <IconPlus size={12} />
                </button>
              </div>
              {q === 0 &&
                <button className="size-pad-add" onClick={() => fillRow(s)}>+ Add 1 string</button>}
              {isFilled &&
                <div className="size-pad-pcs-note">{(q * pearlStringWt(s)).toLocaleString('en-IN')} g total</div>}
            </div>
            <div className="size-pad-total">
              {isFilled ? formatINR(lineTotal) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
            </div>
          </div>);
        })}
      </div> :
      lotMode ?
      <div className="size-pad lot-pad" style={{ marginTop: 4 }}>
        <div className="size-pad-head" style={{ gridTemplateColumns: '96px 116px 110px 100px 1fr 110px' }}>
          <span>Size</span>
          <span style={{ textAlign: 'center' }}>Wt / 1000 pcs</span>
          <span style={{ textAlign: 'center' }}>Qty / packet</span>
          <span style={{ textAlign: 'right' }}>₹ / gram</span>
          <span style={{ textAlign: 'center' }}>Packets</span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {sizes.map((s) => {
          const gPer1000 = 1000 / pcsPerCt(s) * 0.2;
          const q = qtyBySize[s] || 0;
          const lineTotal = q * LOT_PRICE;
          const isFilled = q > 0;
          const so = sizeSoldOut(s);
          return (
            <div key={s} className={`size-pad-row ${isFilled ? 'filled' : ''} ${so ? 'soldout' : ''}`} style={{ gridTemplateColumns: '96px 116px 110px 100px 1fr 110px' }}>
            <div className="size-pad-size">
              <div className="size-pad-mm">{s.replace(' mm', '')}</div>
              <div className="size-pad-unit">{s.includes('mm') ? 'mm' : ''}</div>
            </div>
            <div className="size-pad-pcs">{gPer1000 >= 100 ? Math.round(gPer1000) : gPer1000.toFixed(1)} <span className="size-pad-unit-sfx">g</span></div>
            <div className="size-pad-pcs">{LOT_GRAMS} <span className="size-pad-unit-sfx">g</span></div>
            <div className="size-pad-price">{formatINR(LOT_RATE_G)}<span className="size-pad-unit-sfx"> /g</span></div>
            <div className="size-pad-input-wrap">
              <div className="size-pad-stepper">
                <button onClick={() => bumpQty(s, -stepUnits)} disabled={q <= 0} aria-label="decrease">
                  <IconMinus size={12} />
                </button>
                <input type="number" value={q || ''} placeholder="0" min={0} step={stepUnits}
                  onChange={(e) => updateQty(s, e.target.value)}
                  onFocus={(e) => e.target.select()} onBlur={() => snapRow(s)} />
                <button onClick={() => bumpQty(s, stepUnits)} disabled={q >= sizeStock(s)} aria-label="increase">
                  <IconPlus size={12} />
                </button>
              </div>
              {q === 0 &&
                <button className="size-pad-add" onClick={() => fillRow(s)}>+ Add 1 pkt</button>}
              {isFilled &&
                <div className="size-pad-pcs-note">= {(q * LOT_GRAMS).toLocaleString('en-IN')} g</div>}
            </div>
            <div className="size-pad-total">
              {isFilled ? formatINR(lineTotal) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
            </div>
          </div>);
        })}
      </div> :
      ctLotMode ?
      <div className="size-pad ctlot-pad" style={{ marginTop: 4 }}>
        <div className="size-pad-head" style={{ gridTemplateColumns: '120px 130px 110px 1fr 120px' }}>
          <span>Size</span>
          <span style={{ textAlign: 'center' }}>Qty / packet</span>
          <span style={{ textAlign: 'right' }}>₹ / ct</span>
          <span style={{ textAlign: 'center' }}>Packets</span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {sizes.map((s) => {
          const q = qtyBySize[s] || 0;
          const rowRate = opRowRate(s);
          const lineTotal = q * OP_LOT_CT * rowRate;
          const isFilled = q > 0;
          const so = sizeSoldOut(s);
          return (
            <div key={s} className={`size-pad-row ${isFilled ? 'filled' : ''} ${so ? 'soldout' : ''}`} style={{ gridTemplateColumns: '120px 130px 110px 1fr 120px' }}>
            <div className="size-pad-size">
              <div className="size-pad-mm">{s.replace(' mm', '')}</div>
              <div className="size-pad-unit">{s.includes('mm') ? 'mm' : ''}</div>
            </div>
            <div className="size-pad-pcs">{OP_LOT_CT} <span className="size-pad-unit-sfx">ct</span></div>
            <div className="size-pad-price">{formatINR(rowRate)}<span className="size-pad-unit-sfx"> /ct</span></div>
            <div className="size-pad-input-wrap">
              <div className="size-pad-stepper">
                <button onClick={() => bumpQty(s, -stepUnits)} disabled={q <= 0} aria-label="decrease">
                  <IconMinus size={12} />
                </button>
                <input type="number" value={q || ''} placeholder="0" min={0} step={stepUnits}
                  onChange={(e) => updateQty(s, e.target.value)}
                  onFocus={(e) => e.target.select()} onBlur={() => snapRow(s)} />
                <button onClick={() => bumpQty(s, stepUnits)} disabled={q >= sizeStock(s)} aria-label="increase">
                  <IconPlus size={12} />
                </button>
              </div>
              {q === 0 &&
                <button className="size-pad-add" onClick={() => fillRow(s)}>+ Add 1 pkt</button>}
              {isFilled &&
                <div className="size-pad-pcs-note">= {(q * OP_LOT_CT).toLocaleString('en-IN')} ct</div>}
            </div>
            <div className="size-pad-total">
              {isFilled ? formatINR(lineTotal) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
            </div>
          </div>);
        })}
      </div> :
      byStrip ?
      <div className="size-pad strip-pad" style={{ marginTop: 4 }}>
        <div className="size-pad-head" style={{ gridTemplateColumns: stripCols }}>
          <span>Size</span>
          {natStrip && <span style={{ textAlign: 'center' }}>Carats / strip</span>}
          <span style={{ textAlign: 'right' }}>{natStrip ? '₹ / ct' : '₹ / strip'}</span>
          <span style={{ textAlign: 'center' }}>Strips</span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {sizes.map((s) => {
          const r = rate(s);
          const q = qtyBySize[s] || 0;
          const lineTotal = q * r;
          const isFilled = q > 0;
          const so = sizeSoldOut(s);
          return (
            <div key={s} className={`size-pad-row ${isFilled ? 'filled' : ''} ${so ? 'soldout' : ''}`} style={{ gridTemplateColumns: stripCols }}>
            <div className="size-pad-size">
              <div className="size-pad-mm">{s.replace(' mm', '')}</div>
              <div className="size-pad-unit">{s.includes('mm') ? 'mm strip' : 'strip'}</div>
            </div>
            {natStrip &&
              <div className="size-pad-pcs">{stripCarats(s)} <span className="size-pad-unit-sfx">ct</span></div>
              }
            <div className="size-pad-price">{natStrip ? <React.Fragment>{formatINR(product.price)}<span className="size-pad-unit-sfx"> /ct</span></React.Fragment> : formatINR(r)}</div>
            <div className="size-pad-input-wrap">
              <div className="size-pad-stepper">
                <button onClick={() => bumpQty(s, -stepUnits)} disabled={q <= 0} aria-label="decrease">
                  <IconMinus size={12} />
                </button>
                <input type="number" value={q || ''} placeholder="0" min={0} step={stepUnits}
                  onChange={(e) => updateQty(s, e.target.value)}
                  onFocus={(e) => e.target.select()} onBlur={() => snapRow(s)} />
                <button onClick={() => bumpQty(s, stepUnits)} disabled={q >= sizeStock(s)} aria-label="increase">
                  <IconPlus size={12} />
                </button>
              </div>
              {q === 0 &&
                <button className="size-pad-add" onClick={() => fillRow(s)}>+ Add 1 strip</button>}
              {natStrip && isFilled &&
                <div className="size-pad-pcs-note">{(q * stripCarats(s)).toFixed(1)} ct × {formatINR(product.price)}/ct</div>}
            </div>
            <div className="size-pad-total">
              {isFilled ? formatINR(lineTotal) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
            </div>
          </div>);
        })}
      </div> :

      <div className={`size-pad ${showWt || showPieceWt ? 'has-wt' : ''} ${navMode ? 'unit-nav' : 'unit-' + unit}`} style={{ marginTop: 4 }}>
        <div className="size-pad-head" style={navMode ? { gridTemplateColumns: 'minmax(0,1.4fr) 1fr 130px 130px' } : undefined}>
          <span>Size</span>
          {!navMode &&
          <span style={{ textAlign: 'center' }}>
            {unit === 'ct' ? 'Pcs / ct' : unit === 'pkt' ? 'Pcs / packet' : 'Per pc'}
          </span>}
          <span style={{ textAlign: 'right' }}>{mixedMoiss ? 'Rate' : <React.Fragment>₹ / {navMode ? 'packet' : unit === 'pkt' ? packetPriced ? 'packet' : 'pc' : unitWord}</React.Fragment>}</span>
          {showWt && <span style={{ textAlign: 'right' }}>{packetWtMode ? 'Wt / packet' : 'Wt / 1000 pcs'}</span>}
          {showPieceWt && <span style={{ textAlign: 'right' }}>Wt / pc</span>}
          <span style={{ textAlign: 'center' }}>
            {mixedMoiss ? 'Order qty' : unit === 'ct' ? 'Carats' : unit === 'pkt' ? 'Packets' : 'Pieces'}
          </span>
          <span style={{ textAlign: 'right' }}>Line total</span>
        </div>
        {sizes.map((s) => {
          const ru = rowUnit(s);
          const ruWord = unitLabel(ru);
          const r = rate(s);
          const each = ru === 'pkt' ? rowPacketPcs(s) : unitPcsEach(ru, s, category.id);
          let ctPer1000 = 1000 / pcsPerCt(s); // carats per 1000 pcs
          let gPer1000 = ctPer1000 * 0.2; // 1 ct = 0.2 g
          // Alpanite price sheets carry the real weight (grams/1000 pc) — use it.
          const _wtSku = skuFor(s);
          if (_wtSku && _wtSku.wtPer1000 != null) { gPer1000 = _wtSku.wtPer1000; ctPer1000 = gPer1000 / 0.2; }
          const q = qtyBySize[s] || 0;
          const navUnitPrice = sizeUnitPrice(product, s);
          const lineTotal = navMode ? q * navUnitPrice + foilForLine(s, q) : mixedMoiss ? stoneAmount(s, q) + certForLine(s, q) + foilForLine(s, q) : q * r + certForLine(s, q) + foilForLine(s, q);
          const linePcs = (mixedMoiss || ru === 'pkt') ? rowPcs(s, q) : unitToPcs(ru, s, q, category.id);
          const isFilled = q > 0;
          const belowMoq = q > 0 && q < sizeMoq(s);
          const so = sizeSoldOut(s);
          return (
            <div key={s} className={`size-pad-row ${isFilled ? 'filled' : ''} ${belowMoq ? 'below' : ''} ${so ? 'soldout' : ''}`}
            style={navMode ? { gridTemplateColumns: 'minmax(0,1.4fr) 1fr 130px 130px' } : undefined}>
              <div className="size-pad-size">
                <div className="size-pad-mm">{ourosaMode ? s : s.replace(' mm', '')}</div>
                <div className="size-pad-unit">{ourosaMode ? ourosaMM(s) : s.includes('mm') ? 'mm' : ''}</div>
              </div>
              {!navMode &&
              <div className="size-pad-pcs">{mixedMoiss ?
                pieceInput(s) ? `${moissCt(s)} ct/pc` : `${moissPcsPerCt(shape, s).toLocaleString('en-IN')} /ct` :
                unit === 'pc' ? '1' : each.toLocaleString('en-IN')}</div>}
              <div className="size-pad-price">{formatINR(navMode ? navUnitPrice : mixedMoiss ? moissPerCt(s) : unit === 'pkt' ? packetPriced ? r : piecePrice(s) : r)}{mixedMoiss && <span className="size-pad-unit-sfx"> /ct</span>}</div>
              {showWt &&
              <div className="size-pad-wt">
                  {(() => {
                    const gShown = packetWtMode ? gPer1000 * each / 1000 : gPer1000;
                    const ctShown = packetWtMode ? ctPer1000 * each / 1000 : ctPer1000;
                    return (
                      <React.Fragment>
                        <span className="size-pad-wt-g">{gShown >= 100 ? Math.round(gShown) : gShown.toFixed(1)} g</span>
                        <span className="size-pad-wt-ct">{ctShown >= 100 ? Math.round(ctShown) : ctShown.toFixed(1)} ct</span>
                      </React.Fragment>);
                  })()}
                </div>
              }
              {showPieceWt &&
              <div className="size-pad-wt">
                  <span className="size-pad-wt-g">{(() => {const g = gPer1000 / 1000;return g >= 1 ? g.toFixed(1) : g >= 0.1 ? g.toFixed(2) : g.toFixed(3);})()} g</span>
                </div>
              }
              <div className="size-pad-input-wrap">
                <div className="size-pad-stepper">
                  <button onClick={() => bumpQty(s, -stepUnits)} disabled={q <= 0} aria-label="decrease">
                    <IconMinus size={12} />
                  </button>
                  <input type="number" value={q || ''} placeholder="0" min={0} step={stepUnits}
                  onChange={(e) => updateQty(s, e.target.value)}
                  onFocus={(e) => e.target.select()} onBlur={() => snapRow(s)} />
                  <button onClick={() => bumpQty(s, stepUnits)} disabled={q >= sizeStock(s)} aria-label="increase">
                    <IconPlus size={12} />
                  </button>
                </div>
                {q === 0 &&
                <button className="size-pad-add" onClick={() => fillRow(s)}>
                    + Add {sizeMoq(s)} {mixedMoiss ? ruWord : unitWord}
                  </button>
                }
                {isFilled && pieceInput(s) &&
                <div className="size-pad-pcs-note">= {billedCt(s, q).toFixed(2)} ct billed</div>
                }
                {isFilled && !navMode && ru !== 'pc' &&
                <div className="size-pad-pcs-note">{unit === 'pkt' ? '= ' : '≈ '}{linePcs.toLocaleString('en-IN')} pcs</div>
                }
                {certEligible(s) && isFilled &&
                <label className="size-pad-cert-opt">
                  <input type="checkbox" checked={certIncluded(s)}
                  onChange={() => setCertOff((p) => ({ ...p, [s]: certIncluded(s) }))} />
                  <span>{certIncluded(s) ?
                    `${certLabel} incl. · +₹${(unitToPcs(rowUnit(s), s, q, category.id) * CERT_FEE).toLocaleString('en-IN')}` :
                    `Add ${certLabel} · +₹${CERT_FEE.toLocaleString('en-IN')}/pc`}</span>
                </label>
                }
                {certEligible(s) && !isFilled &&
                <div className="size-pad-cert-note">Optional {certLabel} · +₹{CERT_FEE.toLocaleString('en-IN')}/pc</div>
                }
              </div>
              <div className="size-pad-total">
                {isFilled ? formatINR(lineTotal) : <span style={{ color: 'var(--ink-4)' }}>—</span>}
              </div>
            </div>);

        })}
      </div>
      }

      {(showWt || showPieceWt) &&
      <div style={{ fontSize: 12, color: 'var(--fg-meta)', margin: '12px 2px 0', fontStyle: 'italic' }}>
        * Weights shown are indicative and may vary slightly from lot to lot.
      </div>}

      <div className="order-summary">
        <div className="order-summary-stats">
          <div>
            <div className="stat-label">{stringMode ? 'Strings selected' : lotMode || ctLotMode ? 'Packets selected' : byStrip ? 'Strips selected' : 'Sizes selected'}</div>
            <div className="stat-value">{stringMode || byStrip || lotMode || ctLotMode ? totalUnits.toLocaleString('en-IN') : lines.length}</div>
          </div>
          {stringMode &&
          <div>
            <div className="stat-label">Total weight</div>
            <div className="stat-value">{totalStringWt.toLocaleString('en-IN')} g</div>
          </div>
          }
          {lotMode &&
          <div>
            <div className="stat-label">Total weight</div>
            <div className="stat-value">{(totalUnits * LOT_GRAMS).toLocaleString('en-IN')} g</div>
          </div>
          }
          {ctLotMode &&
          <div>
            <div className="stat-label">Total carats</div>
            <div className="stat-value">{(totalUnits * OP_LOT_CT).toLocaleString('en-IN')} ct</div>
          </div>
          }
          {!byStrip && !stringMode && !lotMode && !ctLotMode && !mixedMoiss &&
          <div>
            <div className="stat-label">
              {unit === 'ct' ? 'Total carats' : unit === 'pkt' ? 'Total packets' : 'Total pieces'}
            </div>
            <div className="stat-value">{totalUnits.toLocaleString('en-IN')} {unitWord}</div>
          </div>
          }
          {!byStrip && !stringMode && !lotMode && !ctLotMode &&
          <div>
            <div className="stat-label">Approx pieces</div>
            <div className="stat-value">{totalPcs.toLocaleString('en-IN')}</div>
          </div>
          }
          {totalCert > 0 &&
          <div>
            <div className="stat-label">Certificates</div>
            <div className="stat-value">{formatINR(totalCert)}</div>
          </div>
          }
          {totalFoil > 0 &&
          <div>
            <div className="stat-label">Double foiling · ₹{FOIL_FEE}/pc</div>
            <div className="stat-value">{formatINR(totalFoil)}</div>
          </div>
          }
          <div>
            <div className="stat-label">Order total</div>
            <div className="stat-value money">{formatINR(grandTotal)}</div>
          </div>
        </div>
        <div className="pdp-cta">
          <button className="btn btn-accent btn-lg btn-block" onClick={onAddAll}
          disabled={lines.length === 0}
          style={{ opacity: lines.length === 0 ? 0.45 : 1, cursor: lines.length === 0 ? 'not-allowed' : 'pointer' }}>
            <IconBag size={18} />
            {lines.length === 0 ? 'Enter quantities to continue' :
            byStrip ? `Add ${totalUnits} strip${totalUnits > 1 ? 's' : ''} to order` :
            `Add ${lines.length} size${lines.length > 1 ? 's' : ''} to order`}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => setQtyBySize({})}
          disabled={lines.length === 0}>
            Clear
          </button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { BrowseScreen, productPhoto });