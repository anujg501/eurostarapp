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
  choose_grade:  { en:'Choose a grade', hi:'ग्रेड चुनें', mr:'ग्रेड निवडा', gu:'ગ્રેડ પસંદ કરો', ta:'Grade தேர்ந்தெடுக்கவும்', te:'Grade ఎంచుకోండి', kn:'Grade ಆರಿಸಿ' },
  choose_shade:  { en:'Choose a shade', hi:'शेड चुनें', mr:'शेड निवडा', gu:'શેડ પસંદ કરો', ta:'நிழலைத் தேர்ந்தெடுக்கவும்', te:'షేడ్ ఎంచుకోండి', kn:'ಶೇಡ್ ಆರಿಸಿ' },
  choose_cut:    { en:'Choose a cut shape', hi:'कट आकार चुनें', mr:'कट आकार निवडा', gu:'કટ આકાર પસંદ કરો', ta:'Cut வடிவம் தேர்ந்தெடுக்கவும்', te:'Cut ఆకారం ఎంచుకోండి', kn:'Cut ಆಕಾರ ಆರಿಸಿ' },
  step_strips:   { en:'Strips', hi:'स्ट्रिप्स', mr:'स्ट्रिप्स', gu:'સ્ટ્રિપ્સ', ta:'Strips', te:'Strips', kn:'Strips' },

  // ---- browse helper lines ----
  pick_colour_hint:{ en:'Select the tone you want to order.', hi:'जो टोन ऑर्डर करना है वह चुनें।', mr:'ऑर्डर करायचा टोन निवडा.', gu:'ઓર્ડર કરવાનો ટોન પસંદ કરો.', ta:'ஆர்டர் செய்ய வேண்டிய டோனைத் தேர்ந்தெடுக்கவும்.', te:'ఆర్డర్ చేయాలనుకున్న టోన్‌ను ఎంచుకోండి.', kn:'ಆರ್ಡರ್ ಮಾಡಬೇಕಾದ ಟೋನ್ ಆರಿಸಿ.' },
  colours_available:{ en:'colours available in this grade.', hi:'रंग इस ग्रेड में उपलब्ध हैं।', mr:'रंग या ग्रेडमध्ये उपलब्ध आहेत.', gu:'રંગ આ ગ્રેડમાં ઉપલબ્ધ છે.', ta:'நிறங்கள் இந்த grade-ல் உள்ளன.', te:'రంగులు ఈ grade లో అందుబాటులో ఉన్నాయి.', kn:'ಬಣ್ಣಗಳು ಈ grade ನಲ್ಲಿ ಲಭ್ಯವಿದೆ.' },
  what_receive:  { en:"What you'll receive", hi:'आपको क्या मिलेगा', mr:'तुम्हाला काय मिळेल', gu:'તમને શું મળશે', ta:'நீங்கள் பெறுவது', te:'మీకు ఏమి లభిస్తుంది', kn:'ನಿಮಗೆ ಏನು ಸಿಗುತ್ತದೆ' },

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
  open_sales_app:{ en:'Open Sales App', hi:'सेल्स ऐप खोलें', mr:'सेल्स अ‍ॅप उघडा', gu:'સેલ્સ એપ ખોલો', ta:'Sales App திற', te:'Sales App తెరవండి', kn:'Sales App ತೆರೆಯಿರಿ' },

  // ================= CRM (back office console) =================
  // ---- CRM navigation ----
  crm_dashboard:  { en:'Dashboard',    hi:'डैशबोर्ड',      mr:'डॅशबोर्ड',    gu:'ડેશબોર્ડ',    ta:'Dashboard',   te:'Dashboard',   kn:'Dashboard' },
  crm_customers:  { en:'Customers & Payment Terms', hi:'ग्राहक और भुगतान शर्तें', mr:'ग्राहक व पेमेंट अटी', gu:'ગ્રાહકો અને પેમેન્ટ શરતો', ta:'வாடிக்கையாளர் & பணம் விதிகள்', te:'కస్టమర్లు & చెల్లింపు నిబంధనలు', kn:'ಗ್ರಾಹಕರು & ಪಾವತಿ ಷರತ್ತು' },
  crm_reps:       { en:'Reps & commission', hi:'रेप और कमीशन', mr:'रेप व कमिशन', gu:'રેપ અને કમિશન', ta:'Reps & commission', te:'Reps & commission', kn:'Reps & commission' },
  crm_pipeline:   { en:'Relation-Pipeline', hi:'रिलेशन-पाइपलाइन', mr:'रिलेशन-पाइपलाइन', gu:'રિલેશન-પાઇપલાઇન', ta:'Relation-Pipeline', te:'Relation-Pipeline', kn:'Relation-Pipeline' },
  crm_rfq:        { en:'RFQ Enquiries', hi:'RFQ पूछताछ',  mr:'RFQ चौकशी',   gu:'RFQ પૂછપરછ',  ta:'RFQ விசாரணை', te:'RFQ విచారణ',  kn:'RFQ ವಿಚಾರಣೆ' },
  crm_franchise:  { en:'Franchise Requests', hi:'फ़्रैंचाइज़ अनुरोध', mr:'फ्रँचायझी विनंत्या', gu:'ફ્રેન્ચાઇઝી વિનંતી', ta:'ஃப்ரான்சைஸ் கோரிக்கை', te:'ఫ్రాంచైజీ అభ్యర్థనలు', kn:'ಫ್ರಾಂಚೈಸ್ ವಿನಂತಿ' },
  crm_reports:    { en:'Reports',      hi:'रिपोर्ट',      mr:'अहवाल',       gu:'રિપોર્ટ',     ta:'அறிக்கைகள்',  te:'నివేదికలు',    kn:'ವರದಿಗಳು' },
  crm_attendance: { en:'Attendance',   hi:'उपस्थिति',     mr:'उपस्थिती',    gu:'હાજરી',      ta:'வருகை',      te:'హాజరు',       kn:'ಹಾಜರಾತಿ' },
  crm_visits:     { en:'Field Visits', hi:'फ़ील्ड विज़िट', mr:'फील्ड भेटी',  gu:'ફીલ્ડ મુલાકાત', ta:'கள வருகை',  te:'ఫీల్డ్ సందర్శన', kn:'ಕ್ಷೇತ್ರ ಭೇಟಿ' },
  crm_leads:      { en:'Leads',        hi:'लीड्स',        mr:'लीड्स',       gu:'લીડ્સ',      ta:'Leads',      te:'Leads',       kn:'Leads' },
  crm_custdb:     { en:'Customer Database', hi:'ग्राहक डेटाबेस', mr:'ग्राहक डेटाबेस', gu:'ગ્રાહક ડેટાબેઝ', ta:'வாடிக்கையாளர் தரவுத்தளம்', te:'కస్టమర్ డేటాబేస్', kn:'ಗ್ರಾಹಕ ಡೇಟಾಬೇಸ್' },
  crm_broadcast:  { en:'Rep Broadcast', hi:'रेप ब्रॉडकास्ट', mr:'रेप ब्रॉडकास्ट', gu:'રેપ બ્રોડકાસ્ટ', ta:'Rep Broadcast', te:'Rep Broadcast', kn:'Rep Broadcast' },
  crm_carts:      { en:'All carts',    hi:'सभी कार्ट',    mr:'सर्व कार्ट',  gu:'બધા કાર્ટ',   ta:'அனைத்து கார்ட்', te:'అన్ని కార్ట్‌లు', kn:'ಎಲ್ಲಾ ಕಾರ್ಟ್' },
  crm_payments:   { en:'Payments',     hi:'भुगतान',       mr:'पेमेंट',      gu:'પેમેન્ટ',     ta:'பணம்',       te:'చెల్లింపులు',  kn:'ಪಾವತಿಗಳು' },
  crm_orders:     { en:'Orders',       hi:'ऑर्डर',        mr:'ऑर्डर',       gu:'ઓર્ડર',      ta:'ஆர்டர்கள்',   te:'ఆర్డర్లు',     kn:'ಆರ್ಡರ್‌ಗಳು' },
  crm_orderdesk:  { en:'Order desk',   hi:'ऑर्डर डेस्क',   mr:'ऑर्डर डेस्क',  gu:'ઓર્ડર ડેસ્ક', ta:'ஆர்டர் desk', te:'ఆర్డర్ desk',  kn:'ಆರ್ಡರ್ desk' },

  // ---- CRM roles ----
  qa_take_order:  { en:'Take an order', hi:'ऑर्डर लें', mr:'ऑर्डर घ्या', gu:'ઓર્ડર લો', ta:'ஆர்டர் எடுக்க', te:'ఆర్డర్ తీసుకోండి', kn:'ಆರ್ಡರ್ ತೆಗೆದುಕೊಳ್ಳಿ' },
  qa_take_order_sub:{ en:'Pick a customer', hi:'ग्राहक चुनें', mr:'ग्राहक निवडा', gu:'ગ્રાહક પસંદ કરો', ta:'வாடிக்கையாளரைத் தேர்வு', te:'కస్టమర్‌ను ఎంచుకోండి', kn:'ಗ್ರಾಹಕರನ್ನು ಆರಿಸಿ' },
  take_order_sub: { en:'Who is this order for?', hi:'यह ऑर्डर किसके लिए है?', mr:'ही ऑर्डर कोणासाठी?', gu:'આ ઓર્ડર કોના માટે?', ta:'இந்த ஆர்டர் யாருக்கு?', te:'ఈ ఆర్డర్ ఎవరి కోసం?', kn:'ಈ ಆರ್ಡರ್ ಯಾರಿಗಾಗಿ?' },
  search_customers:{ en:'Search your customers…', hi:'अपने ग्राहक खोजें…', mr:'तुमचे ग्राहक शोधा…', gu:'તમારા ગ્રાહકો શોધો…', ta:'உங்கள் வாடிக்கையாளர்களைத் தேடு…', te:'మీ కస్టమర్లను వెతకండి…', kn:'ನಿಮ್ಮ ಗ್ರಾಹಕರನ್ನು ಹುಡುಕಿ…' },
  no_match:       { en:'No customer matches that.', hi:'कोई ग्राहक नहीं मिला।', mr:'कोणताही ग्राहक सापडला नाही.', gu:'કોઈ ગ્રાહક મળ્યો નથી.', ta:'பொருந்தும் வாடிக்கையாளர் இல்லை.', te:'సరిపోలే కస్టమర్ లేరు.', kn:'ಹೊಂದುವ ಗ್ರಾಹಕರಿಲ್ಲ.' },
  no_customers_yet:{ en:'No customers on your book yet — add one first.', hi:'अभी आपके पास कोई ग्राहक नहीं — पहले जोड़ें।', mr:'तुमच्याकडे अजून ग्राहक नाहीत — आधी जोडा.', gu:'હજુ કોઈ ગ્રાહક નથી — પહેલા ઉમેરો.', ta:'இன்னும் வாடிக்கையாளர் இல்லை — முதலில் சேர்க்கவும்.', te:'ఇంకా కస్టమర్లు లేరు — ముందు జోడించండి.', kn:'ಇನ್ನೂ ಗ್ರಾಹಕರಿಲ್ಲ — ಮೊದಲು ಸೇರಿಸಿ.' },
  cta_add_customer:{ en:'+ Add customer', hi:'+ ग्राहक जोड़ें', mr:'+ ग्राहक जोडा', gu:'+ ગ્રાહક ઉમેરો', ta:'+ வாடிக்கையாளர் சேர்', te:'+ కస్టమర్ జోడించు', kn:'+ ಗ್ರಾಹಕ ಸೇರಿಸಿ' },
  browse_wo_customer:{ en:'Just browse the catalog', hi:'सिर्फ़ कैटलॉग देखें', mr:'फक्त कॅटलॉग पहा', gu:'ફક્ત કેટલોગ જુઓ', ta:'கேட்டலாக் மட்டும் பார்', te:'కేటలాగ్ మాత్రమే చూడండి', kn:'ಕ್ಯಾಟಲಾಗ್ ಮಾತ್ರ ನೋಡಿ' },
  crm_signed_in_as:{ en:'Signed in as', hi:'इस रूप में साइन इन', mr:'म्हणून साइन इन', gu:'તરીકે સાઇન ઇન', ta:'இவ்வாறு உள்நுழைந்துள்ளீர்கள்', te:'ఇలా సైన్ ఇన్ అయ్యారు', kn:'ಇಂತೆ ಸೈನ್ ಇನ್' },
  crm_title_admin:{ en:'Administration', hi:'प्रशासन', mr:'प्रशासन', gu:'વહીવટ', ta:'நிர்வாகம்', te:'పరిపాలన', kn:'ಆಡಳಿತ' },
  crm_role_admin:  { en:'Admin',       hi:'एडमिन',        mr:'अ‍ॅडमिन',     gu:'એડમિન',      ta:'Admin',      te:'Admin',       kn:'Admin' },
  crm_role_office: { en:'Back Office', hi:'बैक ऑफ़िस',    mr:'बॅक ऑफिस',    gu:'બેક ઓફિસ',   ta:'Back Office', te:'Back Office', kn:'Back Office' },
  crm_role_rep:    { en:'Sales Rep',   hi:'सेल्स रेप',     mr:'सेल्स रेप',    gu:'સેલ્સ રેપ',   ta:'Sales Rep',  te:'Sales Rep',   kn:'Sales Rep' },

  // ---- Mira coach digest ----
  coach_title:    { en:'Mira Coach · What needs your attention', hi:'मीरा कोच · किस पर ध्यान दें', mr:'मीरा कोच · कशाकडे लक्ष द्यावे', gu:'મીરા કોચ · શેના પર ધ્યાન આપવું', ta:'Mira Coach · கவனம் தேவைப்படுவது', te:'Mira Coach · దృష్టి అవసరమైనవి', kn:'Mira Coach · ಗಮನ ಬೇಕಿರುವುದು' },
  coach_sub:      { en:'Business to action today + reps to control', hi:'आज के काम + रेप पर नियंत्रण', mr:'आजची कामे + रेप नियंत्रण', gu:'આજના કામ + રેપ નિયંત્રણ', ta:'இன்றைய பணிகள் + reps கட்டுப்பாடு', te:'నేటి పనులు + reps నియంత్రణ', kn:'ಇಂದಿನ ಕೆಲಸ + reps ನಿಯಂತ್ರಣ' },
  coach_brief:    { en:'Brief me',     hi:'ब्रीफ़ दें',    mr:'ब्रीफ द्या',   gu:'બ્રીફ આપો',   ta:'சுருக்கம் தா', te:'సంక్షిప్తం ఇవ్వు', kn:'ಸಂಕ್ಷಿಪ್ತ ಕೊಡಿ' },
  coach_yourreps: { en:'Your reps',    hi:'आपके रेप',     mr:'तुमचे रेप',   gu:'તમારા રેપ',   ta:'உங்கள் reps', te:'మీ reps',     kn:'ನಿಮ್ಮ reps' },

  // ---- digest widget titles ({n} = count, {v} = value) ----
  w_pay_verify:   { en:'{n} payments to verify', hi:'{n} भुगतान सत्यापित करें', mr:'{n} पेमेंट पडताळा', gu:'{n} પેમેન્ટ ચકાસો', ta:'{n} பணம் சரிபார்க்க', te:'{n} చెల్లింపులు ధృవీకరించండి', kn:'{n} ಪಾವತಿ ಪರಿಶೀಲಿಸಿ' },
  w_pay_verify_sub:{ en:'Reps logged these — verify so customer balances update and reminders stop.', hi:'रेप ने दर्ज किए — सत्यापित करें ताकि बैलेंस अपडेट हो और रिमाइंडर रुकें।', mr:'रेपने नोंदवले — पडताळा म्हणजे बॅलन्स अपडेट होईल.', gu:'રેપે નોંધ્યા — ચકાસો જેથી બેલેન્સ અપડેટ થાય.', ta:'Reps பதிவு செய்தனர் — சரிபார்த்தால் இருப்பு புதுப்பிக்கும்.', te:'Reps నమోదు చేశారు — ధృవీకరిస్తే బ్యాలెన్స్ అప్‌డేట్ అవుతుంది.', kn:'Reps ದಾಖಲಿಸಿದ್ದಾರೆ — ಪರಿಶೀಲಿಸಿದರೆ ಬಾಕಿ ನವೀಕರಣವಾಗುತ್ತದೆ.' },
  w_pay_clear:    { en:'No payments waiting for verification — all clear.', hi:'कोई भुगतान सत्यापन के लिए नहीं — सब ठीक है।', mr:'पडताळणीसाठी पेमेंट नाही — सर्व ठीक.', gu:'ચકાસણી માટે કોઈ પેમેન્ટ નથી — બધું બરાબર.', ta:'சரிபார்க்க பணம் இல்லை — அனைத்தும் சரி.', te:'ధృవీకరణకు చెల్లింపులు లేవు — అంతా సరే.', kn:'ಪರಿಶೀಲನೆಗೆ ಪಾವತಿ ಇಲ್ಲ — ಎಲ್ಲಾ ಸರಿ.' },
  w_new_orders:   { en:'{n} new orders to confirm', hi:'{n} नए ऑर्डर कन्फ़र्म करें', mr:'{n} नवीन ऑर्डर कन्फर्म करा', gu:'{n} નવા ઓર્ડર કન્ફર્મ કરો', ta:'{n} புதிய ஆர்டர் உறுதிசெய்', te:'{n} కొత్త ఆర్డర్లు నిర్ధారించండి', kn:'{n} ಹೊಸ ಆರ್ಡರ್ ದೃಢೀಕರಿಸಿ' },
  w_new_orders_sub:{ en:'Confirm and assign a courier so they move to packing.', hi:'कन्फ़र्म करें और कूरियर असाइन करें ताकि पैकिंग शुरू हो।', mr:'कन्फर्म करा व कुरिअर द्या म्हणजे पॅकिंग सुरू होईल.', gu:'કન્ફર્મ કરો અને કુરિયર સોંપો જેથી પેકિંગ શરૂ થાય.', ta:'உறுதிசெய்து courier ஒதுக்கினால் packing தொடங்கும்.', te:'నిర్ధారించి courier కేటాయిస్తే packing మొదలవుతుంది.', kn:'ದೃಢೀಕರಿಸಿ courier ನಿಗದಿಪಡಿಸಿದರೆ packing ಆರಂಭ.' },
  w_new_orders_none:{ en:'No orders waiting for confirmation.', hi:'कोई ऑर्डर कन्फ़र्मेशन के लिए नहीं।', mr:'कन्फर्मेशनसाठी ऑर्डर नाही.', gu:'કન્ફર્મેશન માટે ઓર્ડર નથી.', ta:'உறுதிசெய்ய ஆர்டர் இல்லை.', te:'నిర్ధారణకు ఆర్డర్లు లేవు.', kn:'ದೃಢೀಕರಣಕ್ಕೆ ಆರ್ಡರ್ ಇಲ್ಲ.' },
  w_leads:        { en:'{n} leads to assign', hi:'{n} लीड असाइन करें', mr:'{n} लीड नेमा', gu:'{n} લીડ સોંપો', ta:'{n} leads ஒதுக்க', te:'{n} leads కేటాయించండి', kn:'{n} leads ನಿಯೋಜಿಸಿ' },
  w_leads_none:   { en:'No unassigned leads right now.', hi:'अभी कोई अनअसाइन लीड नहीं।', mr:'सध्या नेमलेले नसलेले लीड नाहीत.', gu:'હાલ કોઈ અસાઇન ન થયેલ લીડ નથી.', ta:'இப்போது ஒதுக்கப்படாத leads இல்லை.', te:'ప్రస్తుతం కేటాయించని leads లేవు.', kn:'ಈಗ ನಿಯೋಜಿಸದ leads ಇಲ್ಲ.' },
  w_followups:    { en:'{n} follow-ups overdue across reps', hi:'{n} फ़ॉलो-अप बकाया', mr:'{n} फॉलो-अप थकीत', gu:'{n} ફોલો-અપ બાકી', ta:'{n} follow-up தாமதம்', te:'{n} follow-up ఆలస్యం', kn:'{n} follow-up ಬಾಕಿ' },
  w_followups_sub:{ en:'Customers waiting on a rep call. Check the pipeline and nudge the owners.', hi:'ग्राहक कॉल का इंतज़ार कर रहे हैं। पाइपलाइन देखें।', mr:'ग्राहक कॉलची वाट पाहत आहेत. पाइपलाइन बघा.', gu:'ગ્રાહકો કોલની રાહ જુએ છે. પાઇપલાઇન જુઓ.', ta:'வாடிக்கையாளர் அழைப்புக்கு காத்திருக்கிறார்.', te:'కస్టమర్లు కాల్ కోసం ఎదురుచూస్తున్నారు.', kn:'ಗ್ರಾಹಕರು ಕರೆಗಾಗಿ ಕಾಯುತ್ತಿದ್ದಾರೆ.' },
  w_followups_none:{ en:'No overdue follow-ups — the pipeline is on schedule.', hi:'कोई बकाया फ़ॉलो-अप नहीं।', mr:'थकीत फॉलो-अप नाही.', gu:'બાકી ફોલો-અપ નથી.', ta:'தாமதமான follow-up இல்லை.', te:'ఆలస్యమైన follow-up లేదు.', kn:'ಬಾಕಿ follow-up ಇಲ್ಲ.' },
  w_rfq:          { en:'{n} RFQ enquiries open', hi:'{n} RFQ पूछताछ खुली', mr:'{n} RFQ चौकशी खुली', gu:'{n} RFQ પૂછપરછ ખુલ્લી', ta:'{n} RFQ விசாரணை திறந்துள்ளது', te:'{n} RFQ విచారణ తెరిచి ఉంది', kn:'{n} RFQ ವಿಚಾರಣೆ ತೆರೆದಿದೆ' },
  w_rfq_sub:      { en:'Custom-item requests waiting for a quote. Slow replies lose the deal.', hi:'कस्टम आइटम के लिए कोटेशन बाकी। देरी से डील जा सकती है।', mr:'कस्टम आयटमसाठी कोट बाकी. उशीर म्हणजे डील जाईल.', gu:'કસ્ટમ આઇટમ માટે ક્વોટ બાકી. મોડું થાય તો ડીલ જાય.', ta:'Custom item க்கு quote தேவை.', te:'Custom item కు quote కావాలి.', kn:'Custom item ಗೆ quote ಬೇಕು.' },
  w_rfq_none:     { en:'No open RFQ enquiries.', hi:'कोई खुली RFQ पूछताछ नहीं।', mr:'खुली RFQ चौकशी नाही.', gu:'ખુલ્લી RFQ પૂછપરછ નથી.', ta:'திறந்த RFQ இல்லை.', te:'తెరిచిన RFQ లేదు.', kn:'ತೆರೆದ RFQ ಇಲ್ಲ.' },
  w_quotes:       { en:'{n} quote requests', hi:'{n} कोटेशन अनुरोध', mr:'{n} कोट विनंत्या', gu:'{n} ક્વોટ વિનંતી', ta:'{n} quote கோரிக்கை', te:'{n} quote అభ్యర్థనలు', kn:'{n} quote ವಿನಂತಿ' },
  w_quotes_sub:   { en:'Customers asked for pricing on their cart — respond before it cools.', hi:'ग्राहकों ने कार्ट पर कीमत पूछी है — जल्दी जवाब दें।', mr:'ग्राहकांनी कार्टवर किंमत विचारली — लवकर उत्तर द्या.', gu:'ગ્રાહકોએ કાર્ટ પર ભાવ પૂછ્યો — જલદી જવાબ આપો.', ta:'வாடிக்கையாளர் விலை கேட்டுள்ளனர் — விரைவில் பதில்.', te:'కస్టమర్లు ధర అడిగారు — వెంటనే స్పందించండి.', kn:'ಗ್ರಾಹಕರು ಬೆಲೆ ಕೇಳಿದ್ದಾರೆ — ಬೇಗ ಉತ್ತರಿಸಿ.' },
  w_quotes_none:  { en:'No carts waiting on a quote.', hi:'कोई कार्ट कोटेशन के इंतज़ार में नहीं।', mr:'कोटसाठी कार्ट नाही.', gu:'ક્વોટ માટે કાર્ટ નથી.', ta:'Quote க்காக cart இல்லை.', te:'Quote కోసం cart లేదు.', kn:'Quote ಗಾಗಿ cart ಇಲ್ಲ.' },
  w_abandoned:    { en:'{n} big carts abandoned', hi:'{n} बड़े कार्ट छोड़े गए', mr:'{n} मोठे कार्ट सोडले', gu:'{n} મોટા કાર્ટ છોડ્યા', ta:'{n} பெரிய cart கைவிடப்பட்டது', te:'{n} పెద్ద cart వదిలేశారు', kn:'{n} ದೊಡ್ಡ cart ಬಿಟ್ಟಿದ್ದಾರೆ' },
  w_abandoned_sub:{ en:'High-value carts left unpaid. Have the rep call and recover them.', hi:'बड़ी वैल्यू के कार्ट अनपेड हैं। रेप से कॉल कराएं।', mr:'मोठ्या किमतीचे कार्ट अनपेड. रेपकडून कॉल करा.', gu:'મોટી કિંમતના કાર્ટ અનપેડ. રેપ પાસે કોલ કરાવો.', ta:'அதிக மதிப்பு cart பணம் செலுத்தப்படவில்லை.', te:'అధిక విలువ cart చెల్లించలేదు.', kn:'ಹೆಚ್ಚು ಮೌಲ್ಯದ cart ಪಾವತಿಯಾಗಿಲ್ಲ.' },
  w_abandoned_none:{ en:'No high-value abandoned carts.', hi:'कोई बड़ी वैल्यू का छोड़ा कार्ट नहीं।', mr:'मोठ्या किमतीचे सोडलेले कार्ट नाही.', gu:'મોટી કિંમતના છોડેલા કાર્ટ નથી.', ta:'அதிக மதிப்பு கைவிட்ட cart இல்லை.', te:'అధిక విలువ వదిలిన cart లేదు.', kn:'ಹೆಚ್ಚು ಮೌಲ್ಯದ ಬಿಟ್ಟ cart ಇಲ್ಲ.' },
  w_franchise:    { en:'{n} franchise requests', hi:'{n} फ़्रैंचाइज़ अनुरोध', mr:'{n} फ्रँचायझी विनंत्या', gu:'{n} ફ્રેન્ચાઇઝી વિનંતી', ta:'{n} ஃப்ரான்சைஸ் கோரிக்கை', te:'{n} ఫ్రాంచైజీ అభ్యర్థనలు', kn:'{n} ಫ್ರಾಂಚೈಸ್ ವಿನಂತಿ' },
  w_franchise_sub:{ en:'New partnership enquiries from the Sales App — respond while interest is high.', hi:'सेल्स ऐप से नई पार्टनरशिप पूछताछ — जल्दी जवाब दें।', mr:'सेल्स अ‍ॅपमधून नवीन पार्टनरशिप चौकशी — लवकर उत्तर द्या.', gu:'સેલ્સ એપથી નવી પાર્ટનરશિપ પૂછપરછ — જલદી જવાબ આપો.', ta:'Sales App இலிருந்து புதிய partnership விசாரணை.', te:'Sales App నుండి కొత్త partnership విచారణ.', kn:'Sales App ನಿಂದ ಹೊಸ partnership ವಿಚಾರಣೆ.' },
  w_franchise_none:{ en:'No new franchise enquiries.', hi:'कोई नई फ़्रैंचाइज़ पूछताछ नहीं।', mr:'नवीन फ्रँचायझी चौकशी नाही.', gu:'નવી ફ્રેન્ચાઇઝી પૂછપરછ નથી.', ta:'புதிய ஃப்ரான்சைஸ் விசாரணை இல்லை.', te:'కొత్త ఫ్రాంచైజీ విచారణ లేదు.', kn:'ಹೊಸ ಫ್ರಾಂಚೈಸ್ ವಿಚಾರಣೆ ಇಲ್ಲ.' },
  w_behind:       { en:'{n} rep behind target', hi:'{n} रेप टारगेट से पीछे', mr:'{n} रेप टार्गेटच्या मागे', gu:'{n} રેપ ટાર્ગેટથી પાછળ', ta:'{n} rep target பின்தங்கியுள்ளார்', te:'{n} rep target వెనుకబడ్డారు', kn:'{n} rep target ಹಿಂದಿದ್ದಾರೆ' },
  w_collections:  { en:'Collections to push', hi:'वसूली पर ज़ोर दें', mr:'वसुलीवर भर द्या', gu:'વસૂલી પર ભાર', ta:'வசூலை முடுக்கு', te:'వసూళ్లను వేగవంతం చేయండి', kn:'ವಸೂಲಾತಿ ಚುರುಕುಗೊಳಿಸಿ' },
  w_collections_none:{ en:'₹0 outstanding — no overdue customer balances right now.', hi:'₹0 बकाया — अभी कोई ओवरड्यू बैलेंस नहीं।', mr:'₹0 थकबाकी — सध्या ओव्हरड्यू नाही.', gu:'₹0 બાકી — હાલ ઓવરડ્યુ નથી.', ta:'₹0 நிலுவை — தாமதம் இல்லை.', te:'₹0 బకాయి — ఆలస్యం లేదు.', kn:'₹0 ಬಾಕಿ — ವಿಳಂಬ ಇಲ್ಲ.' },
  w_top:          { en:'Top performer', hi:'टॉप परफ़ॉर्मर', mr:'टॉप परफॉर्मर', gu:'ટોપ પરફોર્મર', ta:'சிறந்த rep', te:'అత్యుత్తమ rep', kn:'ಅತ್ಯುತ್ತಮ rep' },

  // ---- digest CTAs ----
  cta_verify_pay: { en:'Verify payments', hi:'भुगतान सत्यापित करें', mr:'पेमेंट पडताळा', gu:'પેમેન્ટ ચકાસો', ta:'பணம் சரிபார்', te:'చెల్లింపు ధృవీకరించు', kn:'ಪಾವತಿ ಪರಿಶೀಲಿಸಿ' },
  cta_open_orders:{ en:'Open orders', hi:'ऑर्डर खोलें', mr:'ऑर्डर उघडा', gu:'ઓર્ડર ખોલો', ta:'ஆர்டர் திற', te:'ఆర్డర్లు తెరవండి', kn:'ಆರ್ಡರ್ ತೆರೆಯಿರಿ' },
  cta_assign_leads:{ en:'Assign leads', hi:'लीड असाइन करें', mr:'लीड नेमा', gu:'લીડ સોંપો', ta:'Leads ஒதுக்கு', te:'Leads కేటాయించు', kn:'Leads ನಿಯೋಜಿಸಿ' },
  cta_open_pipeline:{ en:'Open pipeline', hi:'पाइपलाइन खोलें', mr:'पाइपलाइन उघडा', gu:'પાઇપલાઇન ખોલો', ta:'Pipeline திற', te:'Pipeline తెరవండి', kn:'Pipeline ತೆರೆಯಿರಿ' },
  cta_open_rfq:   { en:'Open RFQs', hi:'RFQ खोलें', mr:'RFQ उघडा', gu:'RFQ ખોલો', ta:'RFQ திற', te:'RFQ తెరవండి', kn:'RFQ ತೆರೆಯಿರಿ' },
  cta_view_carts: { en:'View carts', hi:'कार्ट देखें', mr:'कार्ट पाहा', gu:'કાર્ટ જુઓ', ta:'Cart பார்', te:'Cart చూడండి', kn:'Cart ನೋಡಿ' },
  cta_view_requests:{ en:'View requests', hi:'अनुरोध देखें', mr:'विनंत्या पाहा', gu:'વિનંતી જુઓ', ta:'கோரிக்கை பார்', te:'అభ్యర్థనలు చూడండి', kn:'ವಿನಂತಿ ನೋಡಿ' },
  cta_open_reps:  { en:'Open reps', hi:'रेप खोलें', mr:'रेप उघडा', gu:'રેપ ખોલો', ta:'Reps திற', te:'Reps తెరవండి', kn:'Reps ತೆರೆಯಿರಿ' },
  cta_outstanding:{ en:'Outstanding', hi:'बकाया', mr:'थकबाकी', gu:'બાકી', ta:'நிலுவை', te:'బకాయి', kn:'ಬಾಕಿ' },
  cta_view_visits:{ en:'View field visits', hi:'फ़ील्ड विज़िट देखें', mr:'फील्ड भेटी पाहा', gu:'ફીલ્ડ મુલાકાત જુઓ', ta:'கள வருகை பார்', te:'ఫీల్డ్ సందర్శన చూడండి', kn:'ಕ್ಷೇತ್ರ ಭೇಟಿ ನೋಡಿ' },

  // ---- CRM dashboard KPIs ----
  kpi_total_sales:{ en:'Total sales (MTD)', hi:'कुल बिक्री (MTD)', mr:'एकूण विक्री (MTD)', gu:'કુલ વેચાણ (MTD)', ta:'மொத்த விற்பனை (MTD)', te:'మొత్తం అమ్మకాలు (MTD)', kn:'ಒಟ್ಟು ಮಾರಾಟ (MTD)' },
  kpi_orders:     { en:'Orders',       hi:'ऑर्डर',        mr:'ऑर्डर',       gu:'ઓર્ડર',      ta:'ஆர்டர்கள்',   te:'ఆర్డర్లు',     kn:'ಆರ್ಡರ್‌ಗಳು' },
  kpi_open_carts: { en:'Open carts',   hi:'खुले कार्ट',    mr:'खुले कार्ट',  gu:'ખુલ્લા કાર્ટ', ta:'திறந்த cart', te:'తెరిచిన cart', kn:'ತೆರೆದ cart' },
  kpi_abandoned:  { en:'Abandoned value', hi:'छोड़ी गई वैल्यू', mr:'सोडलेली किंमत', gu:'છોડેલી કિંમત', ta:'கைவிட்ட மதிப்பு', te:'వదిలిన విలువ', kn:'ಬಿಟ್ಟ ಮೌಲ್ಯ' },
  kpi_active_cust:{ en:'Active customers', hi:'सक्रिय ग्राहक', mr:'सक्रिय ग्राहक', gu:'સક્રિય ગ્રાહક', ta:'செயலில் உள்ள வாடிக்கையாளர்', te:'క్రియాశీల కస్టమర్లు', kn:'ಸಕ್ರಿಯ ಗ್ರಾಹಕರು' },
  kpi_awaiting:   { en:'awaiting review', hi:'समीक्षा बाकी', mr:'पुनरावलोकन बाकी', gu:'સમીક્ષા બાકી', ta:'மதிப்பாய்வு நிலுவை', te:'సమీక్ష పెండింగ్', kn:'ಪರಿಶೀಲನೆ ಬಾಕಿ' },
  kpi_in_play:    { en:'in play',      hi:'चल रहे',       mr:'चालू',        gu:'ચાલુ',       ta:'நடப்பில்',    te:'నడుస్తోంది',   kn:'ಚಾಲ್ತಿಯಲ್ಲಿ' },
  kpi_to_recover: { en:'to recover',   hi:'वसूलने हैं',    mr:'वसूल करायचे', gu:'વસૂલવાના',   ta:'மீட்க',       te:'రికవర్ చేయాలి', kn:'ವಸೂಲಿಗೆ' },
  kpi_across_reps:{ en:'across',       hi:'कुल',          mr:'एकूण',        gu:'કુલ',        ta:'மொத்தம்',     te:'మొత్తం',       kn:'ಒಟ್ಟು' },
  kpi_vs_last:    { en:'vs last month', hi:'पिछले महीने से', mr:'मागील महिन्यापेक्षा', gu:'ગયા મહિનાથી', ta:'கடந்த மாதத்துடன்', te:'గత నెలతో', kn:'ಕಳೆದ ತಿಂಗಳಿಗೆ' },

  // ---- CRM section headings ----
  sec_recent_orders:{ en:'Recent orders', hi:'हाल के ऑर्डर', mr:'अलीकडील ऑर्डर', gu:'તાજેતરના ઓર્ડર', ta:'சமீபத்திய ஆர்டர்', te:'ఇటీవలి ఆర్డర్లు', kn:'ಇತ್ತೀಚಿನ ಆರ್ಡರ್' },
  sec_sales_by_rep:{ en:'Sales by rep', hi:'रेप अनुसार बिक्री', mr:'रेपनुसार विक्री', gu:'રેપ મુજબ વેચાણ', ta:'Rep வாரியாக விற்பனை', te:'Rep వారీగా అమ్మకాలు', kn:'Rep ವಾರು ಮಾರಾಟ' },
  sec_all_reps:   { en:'All reps',     hi:'सभी रेप',      mr:'सर्व रेप',    gu:'બધા રેપ',    ta:'அனைத்து reps', te:'అన్ని reps',  kn:'ಎಲ್ಲಾ reps' },
  th_order:       { en:'Order',        hi:'ऑर्डर',        mr:'ऑर्डर',       gu:'ઓર્ડર',      ta:'ஆர்டர்',      te:'ఆర్డర్',       kn:'ಆರ್ಡರ್' },
  th_customer:    { en:'Customer',     hi:'ग्राहक',       mr:'ग्राहक',      gu:'ગ્રાહક',     ta:'வாடிக்கையாளர்', te:'కస్టమర్',    kn:'ಗ್ರಾಹಕ' },
  th_rep:         { en:'Rep',          hi:'रेप',          mr:'रेप',         gu:'રેપ',        ta:'Rep',        te:'Rep',         kn:'Rep' },
  th_status:      { en:'Status',       hi:'स्थिति',       mr:'स्थिती',      gu:'સ્થિતિ',     ta:'நிலை',       te:'స్థితి',       kn:'ಸ್ಥಿತಿ' },
  th_value:       { en:'Value',        hi:'वैल्यू',        mr:'किंमत',       gu:'કિંમત',      ta:'மதிப்பு',     te:'విలువ',       kn:'ಮೌಲ್ಯ' },
  th_date:        { en:'Date',         hi:'तारीख',        mr:'तारीख',       gu:'તારીખ',      ta:'தேதி',       te:'తేదీ',        kn:'ದಿನಾಂಕ' },
  th_items:       { en:'Items',        hi:'आइटम',         mr:'आयटम',        gu:'આઇટમ',      ta:'பொருட்கள்',   te:'వస్తువులు',    kn:'ವಸ್ತುಗಳು' },
  orders_across_reps:{ en:'orders across all reps', hi:'ऑर्डर (सभी रेप)', mr:'ऑर्डर (सर्व रेप)', gu:'ઓર્ડર (બધા રેપ)', ta:'ஆர்டர் (அனைத்து reps)', te:'ఆర్డర్లు (అన్ని reps)', kn:'ಆರ್ಡರ್ (ಎಲ್ಲಾ reps)' },
  kpi_carts_recover:{ en:'{n} carts to recover', hi:'{n} कार्ट वसूलने हैं', mr:'{n} कार्ट वसूल करायच्या', gu:'{n} કાર્ટ વસૂલવાના', ta:'{n} carts மீட்க வேண்டும்', te:'{n} carts రికవర్ చేయాలి', kn:'{n} carts ಮರಳಿ ಪಡೆಯಬೇಕು' },
  kpi_across_reps:{ en:'across {n} reps', hi:'{n} रेप में', mr:'{n} रेपमध्ये', gu:'{n} રેપમાં', ta:'{n} reps முழுவதும்', te:'{n} reps అంతటా', kn:'{n} reps ವ್ಯಾಪ್ತಿಯಲ್ಲಿ' },
  w_behind_sub:   { en:'{names} — prioritise in your calls.', hi:'{names} — कॉल में इन्हें प्राथमिकता दें।', mr:'{names} — कॉलमध्ये यांना प्राधान्य द्या.', gu:'{names} — કૉલમાં પ્રાથમિકતા આપો.', ta:'{names} — உங்கள் அழைப்புகளில் முன்னுரிமை.', te:'{names} — మీ కాల్స్‌లో ప్రాధాన్యత ఇవ్వండి.', kn:'{names} — ನಿಮ್ಮ ಕರೆಗಳಲ್ಲಿ ಆದ್ಯತೆ ನೀಡಿ.' },
  w_top_sub:      { en:'{amt} MTD. Recognise the win and ask what’s working.', hi:'{amt} MTD। तारीफ़ करें और पूछें क्या काम कर रहा है।', mr:'{amt} MTD. कौतुक करा आणि काय चालतंय ते विचारा.', gu:'{amt} MTD. વખાણ કરો અને પૂછો શું કામ કરે છે.', ta:'{amt} MTD. பாராட்டி என்ன வேலை செய்கிறது எனக் கேளுங்கள்.', te:'{amt} MTD. అభినందించి ఏమి పని చేస్తోందో అడగండి.', kn:'{amt} MTD. ಪ್ರಶಂಸಿಸಿ ಮತ್ತು ಏನು ಕೆಲಸ ಮಾಡುತ್ತಿದೆ ಎಂದು ಕೇಳಿ.' },
  page_orders:    { en:'Orders',        hi:'ऑर्डर',        mr:'ऑर्डर',       gu:'ઓર્ડર',      ta:'ஆர்டர்',      te:'ఆర్డర్లు',      kn:'ಆರ್ಡರ್' },
  commission_payable:{ en:'Commission payable', hi:'देय कमीशन', mr:'देय कमिशन', gu:'ચૂકવવાપાત્ર કમિશન', ta:'கமிஷன் செலுத்த வேண்டும்', te:'చెల్లించాల్సిన కమిషన్', kn:'ಪಾವತಿಸಬೇಕಾದ ಕಮಿಷನ್' },
};

function t(key, lang) {
  const row = I18N[key];
  if (!row) return key;
  return row[lang] || row.en;
}
function currentLang() { try { return localStorage.getItem('eurostar-lang') || 'en'; } catch (e) { return 'en'; } }

// Same as t(), but fills {placeholders}: tf('w_leads', lang, { n: 3 }).
//
// Looks the row up itself rather than calling t(). Every <script type="text/babel">
// on the page shares one global scope, so a one-letter global like `t` is easy
// for another script to shadow — and when that happened the whole CRM went
// blank on "t is not a function". The dictionary is the only dependency here.
function tf(key, lang, vars) {
  const row = I18N[key];
  let s = row ? (row[lang] || row.en) : key;
  if (vars) Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
  return s;
}

/* ---------------------------------------------------------------------------
 * Table column headers, keyed by the exact English label used in the markup.
 * Keeping the English string as the key means a new column renders in English
 * (correct fallback) instead of leaking a key name into the UI.
 *
 * Trade/legal shorthand (GST, MTD, RFQ, ASM, SKU, ID) stays English in every
 * language — that is how the trade writes it.
 * ------------------------------------------------------------------------- */
const TH_I18N = {
  'Customer':   { hi:'ग्राहक', mr:'ग्राहक', gu:'ગ્રાહક', ta:'வாடிக்கையாளர்', te:'కస్టమర్', kn:'ಗ್ರಾಹಕ' },
  'Customers':  { hi:'ग्राहक', mr:'ग्राहक', gu:'ગ્રાહકો', ta:'வாடிக்கையாளர்கள்', te:'కస్టమర్లు', kn:'ಗ್ರಾಹಕರು' },
  'City':       { hi:'शहर', mr:'शहर', gu:'શહેર', ta:'நகரம்', te:'నగరం', kn:'ನಗರ' },
  'Status':     { hi:'स्थिति', mr:'स्थिती', gu:'સ્થિતિ', ta:'நிலை', te:'స్థితి', kn:'ಸ್ಥಿತಿ' },
  'Rep':        { hi:'रेप', mr:'रेप', gu:'રેપ', ta:'Rep', te:'Rep', kn:'Rep' },
  'Order':      { hi:'ऑर्डर', mr:'ऑर्डर', gu:'ઓર્ડર', ta:'ஆர்டர்', te:'ఆర్డర్', kn:'ಆರ್ಡರ್' },
  'Value':      { hi:'वैल्यू', mr:'किंमत', gu:'કિંમત', ta:'மதிப்பு', te:'విలువ', kn:'ಮೌಲ್ಯ' },
  'Mobile':     { hi:'मोबाइल', mr:'मोबाइल', gu:'મોબાઇલ', ta:'மொபைல்', te:'మొబైల్', kn:'ಮೊಬೈಲ್' },
  'Date':       { hi:'तारीख', mr:'तारीख', gu:'તારીખ', ta:'தேதி', te:'తేదీ', kn:'ದಿನಾಂಕ' },
  'Ref':        { hi:'रेफ़', mr:'संदर्भ', gu:'સંદર્ભ', ta:'குறிப்பு', te:'రిఫ్', kn:'ರೆಫ್' },
  'Code':       { hi:'कोड', mr:'कोड', gu:'કોડ', ta:'குறியீடு', te:'కోడ్', kn:'ಕೋಡ್' },
  'Items':      { hi:'आइटम', mr:'आयटम', gu:'આઇટમ', ta:'பொருட்கள்', te:'వస్తువులు', kn:'ವಸ್ತುಗಳು' },
  'Commission': { hi:'कमीशन', mr:'कमिशन', gu:'કમિશન', ta:'கமிஷன்', te:'కమిషన్', kn:'ಕಮಿಷನ್' },
  'Commission %':{ hi:'कमीशन %', mr:'कमिशन %', gu:'કમિશન %', ta:'கமிஷன் %', te:'కమిషన్ %', kn:'ಕಮಿಷನ್ %' },
  'Product':    { hi:'प्रोडक्ट', mr:'उत्पादन', gu:'પ્રોડક્ટ', ta:'பொருள்', te:'ఉత్పత్తి', kn:'ಉತ್ಪನ್ನ' },
  'Size':       { hi:'साइज़', mr:'आकार', gu:'સાઇઝ', ta:'அளவு', te:'సైజు', kn:'ಗಾತ್ರ' },
  'Qty':        { hi:'मात्रा', mr:'संख्या', gu:'જથ્થો', ta:'எண்ணிக்கை', te:'పరిమాణం', kn:'ಪ್ರಮಾಣ' },
  'Lead':       { hi:'लीड', mr:'लीड', gu:'લીડ', ta:'Lead', te:'Lead', kn:'Lead' },
  'Courier / Tracking':{ hi:'कूरियर / ट्रैकिंग', mr:'कुरियर / ट्रॅकिंग', gu:'કુરિયર / ટ્રેકિંગ', ta:'கூரியர் / டிராக்கிங்', te:'కొరియర్ / ట్రాకింగ్', kn:'ಕೊರಿಯರ್ / ಟ್ರ್ಯಾಕಿಂಗ್' },
  'Name':       { hi:'नाम', mr:'नाव', gu:'નામ', ta:'பெயர்', te:'పేరు', kn:'ಹೆಸರು' },
  'Source':     { hi:'स्रोत', mr:'स्रोत', gu:'સ્રોત', ta:'மூலம்', te:'మూలం', kn:'ಮೂಲ' },
  'Payment terms':{ hi:'भुगतान शर्तें', mr:'पेमेंट अटी', gu:'પેમેન્ટ શરતો', ta:'கட்டண விதிமுறை', te:'చెల్లింపు నిబంధనలు', kn:'ಪಾವತಿ ನಿಯಮ' },
  'Payment':    { hi:'भुगतान', mr:'पेमेंट', gu:'પેમેન્ટ', ta:'கட்டணம்', te:'చెల్లింపు', kn:'ಪಾವತಿ' },
  'Login':      { hi:'लॉगिन', mr:'लॉगिन', gu:'લોગિન', ta:'உள்நுழைவு', te:'లాగిన్', kn:'ಲಾಗಿನ್' },
  'Terms':      { hi:'शर्तें', mr:'अटी', gu:'શરતો', ta:'விதிமுறை', te:'నిబంధనలు', kn:'ನಿಯಮ' },
  'Billed':     { hi:'बिल किया', mr:'बिल केले', gu:'બિલ કર્યું', ta:'பில் செய்தது', te:'బిల్ చేసినది', kn:'ಬಿಲ್ ಮಾಡಿದ್ದು' },
  'Received':   { hi:'प्राप्त', mr:'मिळाले', gu:'મળ્યું', ta:'பெறப்பட்டது', te:'అందినది', kn:'ಸ್ವೀಕರಿಸಿದ್ದು' },
  'Balance':    { hi:'बकाया', mr:'शिल्लक', gu:'બાકી', ta:'இருப்பு', te:'బ్యాలెన్స్', kn:'ಬಾಕಿ' },
  'Days':       { hi:'दिन', mr:'दिवस', gu:'દિવસ', ta:'நாட்கள்', te:'రోజులు', kn:'ದಿನ' },
  'Worked':     { hi:'काम किया', mr:'काम केले', gu:'કામ કર્યું', ta:'பணி', te:'పని', kn:'ಕೆಲಸ' },
  'Region':     { hi:'क्षेत्र', mr:'प्रदेश', gu:'પ્રદેશ', ta:'பகுதி', te:'ప్రాంతం', kn:'ಪ್ರದೇಶ' },
  'Sales Head': { hi:'सेल्स हेड', mr:'सेल्स हेड', gu:'સેલ્સ હેડ', ta:'Sales Head', te:'Sales Head', kn:'Sales Head' },
  'New adds (min 50 / month)':{ hi:'नए जोड़ (कम से कम 50 / माह)', mr:'नवीन जोड (किमान 50 / महिना)', gu:'નવા ઉમેરા (ઓછામાં ઓછા 50 / માસ)', ta:'புதிய சேர்ப்பு (குறைந்தது 50 / மாதம்)', te:'కొత్త చేర్పులు (కనీసం 50 / నెల)', kn:'ಹೊಸ ಸೇರ್ಪಡೆ (ಕನಿಷ್ಠ 50 / ತಿಂಗಳು)' },
  'Sales (MTD)':{ hi:'बिक्री (MTD)', mr:'विक्री (MTD)', gu:'વેચાણ (MTD)', ta:'விற்பனை (MTD)', te:'అమ్మకాలు (MTD)', kn:'ಮಾರಾಟ (MTD)' },
  'Payable':    { hi:'देय', mr:'देय', gu:'ચૂકવવાપાત્ર', ta:'செலுத்த வேண்டியது', te:'చెల్లించాల్సినది', kn:'ಪಾವತಿಸಬೇಕಾದ್ದು' },
  'Access':     { hi:'एक्सेस', mr:'प्रवेश', gu:'એક્સેસ', ta:'அணுகல்', te:'యాక్సెస్', kn:'ಪ್ರವೇಶ' },
  'Role':       { hi:'भूमिका', mr:'भूमिका', gu:'ભૂમિકા', ta:'பங்கு', te:'పాత్ర', kn:'ಪಾತ್ರ' },
  'Phone':      { hi:'फ़ोन', mr:'फोन', gu:'ફોન', ta:'தொலைபேசி', te:'ఫోన్', kn:'ಫೋನ್' },
  'Placed by':  { hi:'किसने दिया', mr:'कोणी दिले', gu:'કોણે મૂક્યું', ta:'யார் வைத்தார்', te:'ఎవరు ఇచ్చారు', kn:'ಯಾರು ನೀಡಿದರು' },
  'When':       { hi:'कब', mr:'कधी', gu:'ક્યારે', ta:'எப்போது', te:'ఎప్పుడు', kn:'ಯಾವಾಗ' },
  'Assigned rep':{ hi:'असाइन रेप', mr:'नेमलेला रेप', gu:'સોંપાયેલ રેપ', ta:'ஒதுக்கப்பட்ட rep', te:'కేటాయించిన rep', kn:'ನಿಯೋಜಿತ rep' },
  'Business':   { hi:'व्यवसाय', mr:'व्यवसाय', gu:'વ્યવસાય', ta:'வணிகம்', te:'వ్యాపారం', kn:'ವ್ಯವಹಾರ' },
  'Address':    { hi:'पता', mr:'पत्ता', gu:'સરનામું', ta:'முகவரி', te:'చిరునామా', kn:'ವಿಳಾಸ' },
  'Matches existing':{ hi:'मौजूदा से मेल', mr:'विद्यमानशी जुळते', gu:'હાલના સાથે મેળ', ta:'ஏற்கனவே உள்ளதுடன் பொருந்தல்', te:'ఇప్పటికే ఉన్నదానితో సరిపోలిక', kn:'ಈಗಿರುವುದಕ್ಕೆ ಹೊಂದಿಕೆ' },
  'Decision':   { hi:'निर्णय', mr:'निर्णय', gu:'નિર્ણય', ta:'முடிவு', te:'నిర్ణయం', kn:'ನಿರ್ಧಾರ' },
  'Assign to':  { hi:'किसे दें', mr:'कोणाला द्यायचे', gu:'કોને સોંપવું', ta:'யாருக்கு ஒதுக்க', te:'ఎవరికి కేటాయించాలి', kn:'ಯಾರಿಗೆ ನಿಯೋಜಿಸಬೇಕು' },
  'Stage':      { hi:'चरण', mr:'टप्पा', gu:'તબક્કો', ta:'நிலை', te:'దశ', kn:'ಹಂತ' },
  'Next follow-up':{ hi:'अगला फ़ॉलो-अप', mr:'पुढील फॉलो-अप', gu:'આગળનું ફોલો-અપ', ta:'அடுத்த தொடர்பு', te:'తదుపరి ఫాలో-అప్', kn:'ಮುಂದಿನ ಫಾಲೋ-ಅಪ್' },
  'Contact':    { hi:'संपर्क', mr:'संपर्क', gu:'સંપર્ક', ta:'தொடர்பு', te:'సంప్రదింపు', kn:'ಸಂಪರ್ಕ' },
  'Pincode':    { hi:'पिनकोड', mr:'पिनकोड', gu:'પિનકોડ', ta:'பின்கோடு', te:'పిన్‌కోడ్', kn:'ಪಿನ್‌ಕೋಡ್' },
  'Since':      { hi:'कब से', mr:'पासून', gu:'ક્યારથી', ta:'எப்போதிருந்து', te:'ఎప్పటినుండి', kn:'ಯಾವಾಗಿನಿಂದ' },
  'Monthly sales slab':{ hi:'मासिक बिक्री स्लैब', mr:'मासिक विक्री स्लॅब', gu:'માસિક વેચાણ સ્લેબ', ta:'மாத விற்பனை slab', te:'నెలవారీ అమ్మకాల slab', kn:'ಮಾಸಿಕ ಮಾರಾಟ slab' },
  'Rate':       { hi:'दर', mr:'दर', gu:'દર', ta:'விகிதம்', te:'రేటు', kn:'ದರ' },
  'Rate ₹':     { hi:'दर ₹', mr:'दर ₹', gu:'દર ₹', ta:'விகிதம் ₹', te:'రేటు ₹', kn:'ದರ ₹' },
  'Your sales in slab':{ hi:'स्लैब में आपकी बिक्री', mr:'स्लॅबमधील तुमची विक्री', gu:'સ્લેબમાં તમારું વેચાણ', ta:'slab-இல் உங்கள் விற்பனை', te:'slab లో మీ అమ్మకాలు', kn:'slab ನಲ್ಲಿ ನಿಮ್ಮ ಮಾರಾಟ' },
  'Slip':       { hi:'स्लिप', mr:'स्लिप', gu:'સ્લિપ', ta:'சீட்டு', te:'స్లిప్', kn:'ಸ್ಲಿಪ್' },
  'Firm':       { hi:'फर्म', mr:'फर्म', gu:'પેઢી', ta:'நிறுவனம்', te:'సంస్థ', kn:'ಸಂಸ್ಥೆ' },
  'Investment': { hi:'निवेश', mr:'गुंतवणूक', gu:'રોકાણ', ta:'முதலீடு', te:'పెట్టుబడి', kn:'ಹೂಡಿಕೆ' },
  'Experience': { hi:'अनुभव', mr:'अनुभव', gu:'અનુભવ', ta:'அனுபவம்', te:'అనుభవం', kn:'ಅನುಭವ' },
  'Check-in':   { hi:'चेक-इन', mr:'चेक-इन', gu:'ચેક-ઇન', ta:'செக்-இன்', te:'చెక్-ఇన్', kn:'ಚೆಕ್-ಇನ್' },
  'Check-out':  { hi:'चेक-आउट', mr:'चेक-आउट', gu:'ચેક-આઉટ', ta:'செக்-அவுட்', te:'చెక్-అవుట్', kn:'ಚೆಕ್-ಔಟ್' },
  'Duration':   { hi:'अवधि', mr:'कालावधी', gu:'સમયગાળો', ta:'கால அளவு', te:'వ్యవధి', kn:'ಅವಧಿ' },
  'Location':   { hi:'स्थान', mr:'ठिकाण', gu:'સ્થળ', ta:'இடம்', te:'ప్రదేశం', kn:'ಸ್ಥಳ' },
  'Disc %':     { hi:'छूट %', mr:'सूट %', gu:'ડિસ્કાઉન્ટ %', ta:'தள்ளுபடி %', te:'డిస్కౌంట్ %', kn:'ರಿಯಾಯಿತಿ %' },
  'Amount':     { hi:'राशि', mr:'रक्कम', gu:'રકમ', ta:'தொகை', te:'మొత్తం', kn:'ಮೊತ್ತ' },
  'Cart views': { hi:'कार्ट व्यू', mr:'कार्ट व्ह्यू', gu:'કાર્ટ વ્યૂ', ta:'கார்ட் பார்வை', te:'కార్ట్ వీక్షణలు', kn:'ಕಾರ್ಟ್ ವೀಕ್ಷಣೆ' },
  '(no order)': { hi:'(कोई ऑर्डर नहीं)', mr:'(ऑर्डर नाही)', gu:'(ઓર્ડર નથી)', ta:'(ஆர்டர் இல்லை)', te:'(ఆర్డర్ లేదు)', kn:'(ಆರ್ಡರ್ ಇಲ್ಲ)' },
  // Trade shorthand — same in every language.
  'GST': {}, 'ID': {}, 'ASM': {},
};

// Column-header lookup. Falls back to the English label it was keyed by, so an
// untranslated column still reads correctly instead of showing a key.
function th(label, lang) {
  const row = TH_I18N[label];
  if (!row) return label;
  return row[lang] || label;
}

Object.assign(window, { I18N, TH_I18N, t, tf, th, currentLang });
