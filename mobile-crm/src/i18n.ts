import React, { createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The CRM's languages, and the strings the app shares with the web console.
 *
 * Every translation below is copied verbatim from docs/app/i18n-strings.jsx —
 * the table the web CRM already ships — so the two never drift and nothing here
 * is a guess. A string with no entry in that table falls back to English, which
 * is exactly what the web's own CT() does: the rep nav labels and trade terms
 * stay English there too.
 */
export const LANGS = [
  { id: 'en', native: 'English' },
  { id: 'hi', native: 'हिन्दी' },
  { id: 'mr', native: 'मराठी' },
  { id: 'gu', native: 'ગુજરાતી' },
  { id: 'ta', native: 'தமிழ்' },
  { id: 'te', native: 'తెలుగు' },
  { id: 'kn', native: 'ಕನ್ನಡ' },
] as const;

export type Lang = (typeof LANGS)[number]['id'];

type Row = Record<string, string>;

const STRINGS: Record<string, Row> = {
  sign_out:        { en: 'Sign out', hi: 'साइन आउट', mr: 'साइन आउट', gu: 'સાઇન આઉટ', ta: 'வெளியேறு', te: 'సైన్ అవుట్', kn: 'ಸೈನ್ ಔಟ್' },
  crm_dashboard:   { en: 'Dashboard', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड', gu: 'ડેશબોર્ડ', ta: 'Dashboard', te: 'Dashboard', kn: 'Dashboard' },
  crm_customers:   { en: 'Customers & Payment Terms', hi: 'ग्राहक और भुगतान शर्तें', mr: 'ग्राहक व पेमेंट अटी', gu: 'ગ્રાહકો અને પેમેન્ટ શરતો', ta: 'வாடிக்கையாளர் & பணம் விதிகள்', te: 'కస్టమర్లు & చెల్లింపు నిబంధనలు', kn: 'ಗ್ರಾಹಕರು & ಪಾವತಿ ಷರತ್ತು' },
  crm_pipeline:    { en: 'Relation-Pipeline', hi: 'रिलेशन-पाइपलाइन', mr: 'रिलेशन-पाइपलाइन', gu: 'રિલેશન-પાઇપલાઇન', ta: 'Relation-Pipeline', te: 'Relation-Pipeline', kn: 'Relation-Pipeline' },
  crm_rfq:         { en: 'RFQ Enquiries', hi: 'RFQ पूछताछ', mr: 'RFQ चौकशी', gu: 'RFQ પૂછપરછ', ta: 'RFQ விசாரணை', te: 'RFQ విచారణ', kn: 'RFQ ವಿಚಾರಣೆ' },
  crm_orders:      { en: 'Orders', hi: 'ऑर्डर', mr: 'ऑर्डर', gu: 'ઓર્ડર', ta: 'ஆர்டர்கள்', te: 'ఆర్డర్లు', kn: 'ಆರ್ಡರ್‌ಗಳು' },
  crm_orderdesk:   { en: 'Order desk', hi: 'ऑर्डर डेस्क', mr: 'ऑर्डर डेस्क', gu: 'ઓર્ડર ડેસ્ક', ta: 'ஆர்டர் desk', te: 'ఆర్డర్ desk', kn: 'ಆರ್ಡರ್ desk' },
  crm_title_admin: { en: 'Administration', hi: 'प्रशासन', mr: 'प्रशासन', gu: 'વહીવટ', ta: 'நிர்வாகம்', te: 'పరిపాలన', kn: 'ಆಡಳಿತ' },
  crm_role_admin:  { en: 'Admin', hi: 'एडमिन', mr: 'अ‍ॅडमिन', gu: 'એડમિન', ta: 'Admin', te: 'Admin', kn: 'Admin' },
  crm_role_office: { en: 'Back Office', hi: 'बैक ऑफ़िस', mr: 'बॅक ऑफिस', gu: 'બેક ઓફિસ', ta: 'Back Office', te: 'Back Office', kn: 'Back Office' },
  crm_role_rep:    { en: 'Sales Rep', hi: 'सेल्स रेप', mr: 'सेल्स रेप', gu: 'સેલ્સ રેપ', ta: 'Sales Rep', te: 'Sales Rep', kn: 'Sales Rep' },
  cta_add_customer:{ en: '+ Add customer', hi: '+ ग्राहक जोड़ें', mr: '+ ग्राहक जोडा', gu: '+ ગ્રાહક ઉમેરો', ta: '+ வாடிக்கையாளர் சேர்', te: '+ కస్టమర్ జోడించు', kn: '+ ಗ್ರಾಹಕ ಸೇರಿಸಿ' },
  qa_take_order:   { en: 'Take an order', hi: 'ऑर्डर लें', mr: 'ऑर्डर घ्या', gu: 'ઓર્ડર લો', ta: 'ஆர்டர் எடுக்க', te: 'ఆర్డర్ తీసుకోండి', kn: 'ಆರ್ಡರ್ ತೆಗೆದುಕೊಳ್ಳಿ' },
  qa_take_order_sub:{ en: 'Pick a customer', hi: 'ग्राहक चुनें', mr: 'ग्राहक निवडा', gu: 'ગ્રાહક પસંદ કરો', ta: 'வாடிக்கையாளரைத் தேர்வு', te: 'కస్టమర్‌ను ఎంచుకోండి', kn: 'ಗ್ರಾಹಕರನ್ನು ಆರಿಸಿ' },
  search_customers:{ en: 'Search your customers…', hi: 'अपने ग्राहक खोजें…', mr: 'तुमचे ग्राहक शोधा…', gu: 'તમારા ગ્રાહકો શોધો…', ta: 'உங்கள் வாடிக்கையாளர்களைத் தேடு…', te: 'మీ కస్టమర్లను వెతకండి…', kn: 'ನಿಮ್ಮ ಗ್ರಾಹಕರನ್ನು ಹುಡುಕಿ…' },
  no_match:        { en: 'No customer matches that.', hi: 'कोई ग्राहक नहीं मिला।', mr: 'कोणताही ग्राहक सापडला नाही.', gu: 'કોઈ ગ્રાહક મળ્યો નથી.', ta: 'பொருந்தும் வாடிக்கையாளர் இல்லை.', te: 'సరిపోలే కస్టమర్ లేరు.', kn: 'ಹೊಂದುವ ಗ್ರಾಹಕರಿಲ್ಲ.' },
  crm_attendance:  { en: 'Attendance', hi: 'उपस्थिति', mr: 'उपस्थिती', gu: 'હાજરી', ta: 'வருகை', te: 'హాజరు', kn: 'ಹಾಜರಾತಿ' },
  crm_visits:      { en: 'Field Visits', hi: 'फ़ील्ड विज़िट', mr: 'फील्ड भेटी', gu: 'ફીલ્ડ મુલાકાત', ta: 'கள வருகை', te: 'ఫీల్డ్ సందర్శన', kn: 'ಕ್ಷೇತ್ರ ಭೇಟಿ' },
  crm_leads:       { en: 'Leads', hi: 'लीड्स', mr: 'लीड्स', gu: 'લીડ્સ', ta: 'Leads', te: 'Leads', kn: 'Leads' },
  crm_payments:    { en: 'Payments', hi: 'भुगतान', mr: 'पेमेंट', gu: 'પેમેન્ટ', ta: 'பணம்', te: 'చెల్లింపులు', kn: 'ಪಾವತಿಗಳು' },
};

const LANG_KEY = 'eurostar-lang'; // the same key the web console stores it under

export async function loadLang(): Promise<Lang> {
  const v = (await AsyncStorage.getItem(LANG_KEY)) as Lang | null;
  return v && LANGS.some((l) => l.id === v) ? v : 'en';
}
export async function saveLang(l: Lang): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, l);
}

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'en',
  setLang: () => {},
});

/** Translate `key`, falling back to `fallback` (English) when untranslated. */
export function t(key: string, lang: Lang, fallback: string): string {
  const row = STRINGS[key];
  return (row && (row[lang] || row.en)) || fallback;
}

/** `T('crm_orders', 'Orders')` inside a component. */
export function useT() {
  const { lang } = useContext(LangContext);
  return React.useCallback((key: string, fallback: string) => t(key, lang, fallback), [lang]);
}

export function useLang() {
  return useContext(LangContext);
}
