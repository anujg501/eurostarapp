// i18n-strings.jsx — Eurostar UI translations (7 languages).
// RULE: technical / trade terms stay in English in EVERY language —
// e.g. VVS, DEF, GH, AAA, carat, ct, packet, strip, pcs, mm, moissanite,
// cubic zirconia, GST, GRA, IGI, RFQ, cabochon, corundum, alpanite, etc.
// Only everyday interface words are translated. When unsure, English is kept.
//
// t(key, lang) returns the string for that language, falling back to English.

const I18N = {
  // ---- top navigation ----
  nav_home:      { en:'Home',          hi:'होम',          mr:'होम',          gu:'હોમ',          ta:'முகப்பு',      te:'హోమ్',        kn:'ಮುಖಪುಟ' },
  nav_orders:    { en:'Orders',        hi:'ऑर्डर',         mr:'ऑर्डर',         gu:'ઓર્ડર',         ta:'ஆர்டர்கள்',    te:'ఆర్డర్లు',     kn:'ಆರ್ಡರ್‌ಗಳು' },
  nav_rfq:       { en:'RFQ Enquiry',   hi:'RFQ पूछताछ',    mr:'RFQ चौकशी',    gu:'RFQ પૂછપરછ',   ta:'RFQ விசாரணை',  te:'RFQ విచారణ',  kn:'RFQ ವಿಚಾರಣೆ' },
  nav_franchise: { en:'Join Franchise',hi:'फ़्रैंचाइज़ लें',  mr:'फ्रँचायझी घ्या', gu:'ફ્રેન્ચાઇઝી લો', ta:'ஃப்ரான்சைஸ் சேர்', te:'ఫ్రాంచైజీ చేరండి', kn:'ಫ್ರಾಂಚೈಸ್ ಸೇರಿ' },

  // ---- search ----
  search_ph:     { en:'Search products, grades, colours…', hi:'प्रोडक्ट, ग्रेड, रंग खोजें…', mr:'प्रॉडक्ट, ग्रेड, रंग शोधा…', gu:'પ્રોડક્ટ, ગ્રેડ, રંગ શોધો…', ta:'பொருட்கள், grade, நிறம் தேடுங்கள்…', te:'ఉత్పత్తులు, grade, రంగు వెతకండి…', kn:'ಉತ್ಪನ್ನ, grade, ಬಣ್ಣ ಹುಡುಕಿ…' },

  // ---- drill-down steps ----
  step_grade:    { en:'Grade',   hi:'ग्रेड',   mr:'ग्रेड',   gu:'ગ્રેડ',   ta:'Grade',   te:'Grade',   kn:'Grade' },
  step_colour:   { en:'Colour',  hi:'रंग',    mr:'रंग',    gu:'રંગ',    ta:'நிறம்',   te:'రంగు',    kn:'ಬಣ್ಣ' },
  step_shape:    { en:'Shape',   hi:'आकार',   mr:'आकार',   gu:'આકાર',   ta:'வடிவம்',  te:'ఆకారం',   kn:'ಆಕಾರ' },
  step_sizes:    { en:'Sizes & carats', hi:'साइज़ और carat', mr:'साइज आणि carat', gu:'સાઇઝ અને carat', ta:'அளவுகள் & carat', te:'సైజులు & carat', kn:'ಗಾತ್ರಗಳು & carat' },
  choose_colour: { en:'Choose a colour', hi:'रंग चुनें', mr:'रंग निवडा', gu:'રંગ પસંદ કરો', ta:'நிறத்தைத் தேர்ந்தெடுக்கவும்', te:'రంగును ఎంచుకోండి', kn:'ಬಣ್ಣ ಆರಿಸಿ' },
  choose_shape:  { en:'Choose a shape', hi:'आकार चुनें', mr:'आकार निवडा', gu:'આકાર પસંદ કરો', ta:'வடிவத்தைத் தேர்ந்தெடுக்கவும்', te:'ఆకారాన్ని ఎంచుకోండి', kn:'ಆಕಾರ ಆರಿಸಿ' },

  // ---- common buttons ----
  add_cart:      { en:'Add to cart',   hi:'कार्ट में डालें',  mr:'कार्टमध्ये टाका', gu:'કાર્ટમાં ઉમેરો', ta:'கார்ட்டில் சேர்', te:'కార్ట్‌కు జోడించు', kn:'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ' },
  proceed_checkout:{ en:'Proceed to checkout', hi:'चेकआउट करें', mr:'चेकआउटला जा', gu:'ચેકઆઉટ કરો', ta:'checkout செல்லவும்', te:'checkout కు వెళ్లండి', kn:'checkout ಗೆ ಹೋಗಿ' },
  proceed_payment:{ en:'Proceed to payment', hi:'भुगतान करें', mr:'पेमेंटला जा', gu:'પેમેન્ટ કરો', ta:'பணம் செலுத்த', te:'చెల్లింపుకు వెళ్లండి', kn:'ಪಾವತಿಗೆ ಹೋಗಿ' },
  place_order:   { en:'Place order',   hi:'ऑर्डर करें',    mr:'ऑर्डर द्या',   gu:'ઓર્ડર આપો',   ta:'ஆர்டர் செய்',  te:'ఆర్డర్ చేయండి', kn:'ಆರ್ಡರ್ ಮಾಡಿ' },
  continue_browsing:{ en:'Continue browsing', hi:'और देखें', mr:'अधिक पाहा', gu:'વધુ જુઓ', ta:'தொடர்ந்து பார்', te:'మరిన్ని చూడండి', kn:'ಮುಂದುವರಿಸಿ' },
  back:          { en:'Back',          hi:'वापस',        mr:'मागे',        gu:'પાછળ',       ta:'பின்',       te:'వెనుకకు',     kn:'ಹಿಂದೆ' },
  cancel:        { en:'Cancel',        hi:'रद्द करें',     mr:'रद्द करा',    gu:'રદ કરો',     ta:'ரத்து',      te:'రద్దు',       kn:'ರದ್ದು' },
  save:          { en:'Save',          hi:'सेव करें',      mr:'सेव्ह करा',    gu:'સેવ કરો',    ta:'சேமி',       te:'సేవ్ చేయండి',  kn:'ಉಳಿಸಿ' },
  submit:        { en:'Submit',        hi:'सबमिट करें',    mr:'सबमिट करा',   gu:'સબમિટ કરો',  ta:'சமர்ப்பி',    te:'సమర్పించండి',  kn:'ಸಲ್ಲಿಸಿ' },
  save_draft:    { en:'Save as draft', hi:'ड्राफ्ट सेव करें', mr:'ड्राफ्ट सेव्ह करा', gu:'ડ્રાફ્ટ સેવ કરો', ta:'draft சேமி', te:'draft సేవ్ చేయండి', kn:'draft ಉಳಿಸಿ' },
  get_proforma:  { en:'Get proforma',  hi:'प्रोफ़ॉर्मा लें', mr:'प्रोफॉर्मा घ्या', gu:'પ્રોફોર્મા લો', ta:'proforma பெறு', te:'proforma పొందండి', kn:'proforma ಪಡೆಯಿರಿ' },
  share_whatsapp:{ en:'Share cart on WhatsApp', hi:'कार्ट WhatsApp पर भेजें', mr:'कार्ट WhatsApp वर पाठवा', gu:'કાર્ટ WhatsApp પર મોકલો', ta:'கார்ட்டை WhatsApp இல் பகிர்', te:'కార్ట్‌ను WhatsApp లో పంచుకోండి', kn:'ಕಾರ್ಟ್ ಅನ್ನು WhatsApp ನಲ್ಲಿ ಹಂಚಿ' },

  // ---- cart / checkout ----
  your_cart:     { en:'Your cart',     hi:'आपका कार्ट',    mr:'तुमचा कार्ट',  gu:'તમારો કાર્ટ', ta:'உங்கள் கார்ட்', te:'మీ కార్ట్',   kn:'ನಿಮ್ಮ ಕಾರ್ಟ್' },
  cart_empty:    { en:'Your cart is empty', hi:'आपका कार्ट खाली है', mr:'तुमचा कार्ट रिकामा आहे', gu:'તમારો કાર્ટ ખાલી છે', ta:'உங்கள் கார்ட் காலியாக உள்ளது', te:'మీ కార్ట్ ఖాళీగా ఉంది', kn:'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ' },
  browse_cats:   { en:'Browse categories', hi:'कैटेगरी देखें', mr:'कॅटेगरी पाहा', gu:'કેટેગરી જુઓ', ta:'வகைகளைப் பார்', te:'వర్గాలను చూడండి', kn:'ವರ್ಗಗಳನ್ನು ನೋಡಿ' },
  subtotal:      { en:'Subtotal',      hi:'सबटोटल',       mr:'सबटोटल',      gu:'સબટોટલ',     ta:'கூட்டுத்தொகை', te:'సబ్‌టోటల్',   kn:'ಉಪಮೊತ್ತ' },
  courier:       { en:'Courier',       hi:'कूरियर',       mr:'कुरियर',      gu:'કુરિયર',     ta:'கூரியர்',     te:'కొరియర్',     kn:'ಕೊರಿಯರ್' },
  free:          { en:'Free',          hi:'मुफ़्त',        mr:'मोफत',        gu:'ફ્રી',       ta:'இலவசம்',     te:'ఉచితం',      kn:'ಉಚಿತ' },
  total_payable: { en:'Total payable', hi:'कुल देय',       mr:'एकूण देय',    gu:'કુલ ચૂકવવાપાત્ર', ta:'மொத்தம் செலுத்த வேண்டியது', te:'మొత్తం చెల్లించాల్సినది', kn:'ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದದ್ದು' },
  min_order:     { en:'Minimum order ₹1,000.', hi:'न्यूनतम ऑर्डर ₹1,000.', mr:'किमान ऑर्डर ₹1,000.', gu:'ન્યૂનતમ ઓર્ડર ₹1,000.', ta:'குறைந்தபட்ச ஆர்டர் ₹1,000.', te:'కనిష్ట ఆర్డర్ ₹1,000.', kn:'ಕನಿಷ್ಠ ಆರ್ಡರ್ ₹1,000.' },

  // ---- order confirmation ----
  order_placed:  { en:'Order placed',  hi:'ऑर्डर हो गया',  mr:'ऑर्डर झाला',  gu:'ઓર્ડર થઈ ગયો', ta:'ஆர்டர் முடிந்தது', te:'ఆర్డర్ పూర్తయింది', kn:'ಆರ್ಡರ್ ಆಯಿತು' },
  thank_you:     { en:'Thank you',     hi:'धन्यवाद',      mr:'धन्यवाद',     gu:'આભાર',      ta:'நன்றி',      te:'ధన్యవాదాలు',  kn:'ಧನ್ಯವಾದ' },
  dispatch_by:   { en:'Dispatch by',   hi:'भेजने की तारीख', mr:'पाठवण्याची तारीख', gu:'મોકલવાની તારીખ', ta:'அனுப்பும் தேதி', te:'పంపే తేదీ',   kn:'ರವಾನೆ ದಿನಾಂಕ' },

  // ---- account ----
  my_account:    { en:'My account',    hi:'मेरा खाता',     mr:'माझे खाते',   gu:'મારું ખાતું', ta:'என் கணக்கு', te:'నా ఖాతా',    kn:'ನನ್ನ ಖಾತೆ' },
  sign_out:      { en:'Sign out',      hi:'साइन आउट',     mr:'साइन आउट',    gu:'સાઇન આઉટ',   ta:'வெளியேறு',   te:'సైన్ అవుట్',  kn:'ಸೈನ್ ಔಟ್' },
};

function t(key, lang) {
  const row = I18N[key];
  if (!row) return key;
  return row[lang] || row.en;
}
function currentLang() { try { return localStorage.getItem('eurostar-lang') || 'en'; } catch (e) { return 'en'; } }

Object.assign(window, { I18N, t, currentLang });
