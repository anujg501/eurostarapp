import React, { createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The shop's languages and the strings it shares with the web storefront.
 *
 * Every translation below is copied verbatim from docs/app/i18n-strings.jsx —
 * the table the web already ships — so the two cannot drift and nothing here is
 * a guess. A string with no entry falls back to English, which is what the
 * web's own t() does; the switcher says as much ("Full translation rolling out
 * · preview") rather than pretending the whole shop is translated.
 */
export const LANGS = [
  { id: 'en', native: 'English', en: 'English' },
  { id: 'hi', native: 'हिन्दी', en: 'Hindi' },
  { id: 'mr', native: 'मराठी', en: 'Marathi' },
  { id: 'gu', native: 'ગુજરાતી', en: 'Gujarati' },
  { id: 'ta', native: 'தமிழ்', en: 'Tamil' },
  { id: 'te', native: 'తెలుగు', en: 'Telugu' },
  { id: 'kn', native: 'ಕನ್ನಡ', en: 'Kannada' },
] as const;

export type Lang = (typeof LANGS)[number]['id'];

const STRINGS: Record<string, Record<string, string>> = {
  nav_home:      { en: 'Home', hi: 'होम', mr: 'होम', gu: 'હોમ', ta: 'முகப்பு', te: 'హోమ్', kn: 'ಮುಖಪುಟ' },
  nav_orders:    { en: 'Orders', hi: 'ऑर्डर', mr: 'ऑर्डर', gu: 'ઓર્ડર', ta: 'ஆர்டர்கள்', te: 'ఆర్డర్లు', kn: 'ಆರ್ಡರ್‌ಗಳು' },
  nav_franchise: { en: 'Join Franchise', hi: 'फ़्रैंचाइज़ लें', mr: 'फ्रँचायझी घ्या', gu: 'ફ્રેન્ચાઇઝી લો', ta: 'ஃப்ரான்சைஸ் சேர்', te: 'ఫ్రాంచైజీ చేరండి', kn: 'ಫ್ರಾಂಚೈಸ್ ಸೇರಿ' },
  search_ph:     { en: 'Search products, grades, colours…', hi: 'प्रोडक्ट, ग्रेड, रंग खोजें…', mr: 'प्रॉडक्ट, ग्रेड, रंग शोधा…', gu: 'પ્રોડક્ટ, ગ્રેડ, રંગ શોધો…', ta: 'பொருட்கள், grade, நிறம் தேடுங்கள்…', te: 'ఉత్పత్తులు, grade, రంగు వెతకండి…', kn: 'ಉತ್ಪನ್ನ, grade, ಬಣ್ಣ ಹುಡುಕಿ…' },
  back:          { en: 'Back', hi: 'वापस', mr: 'मागे', gu: 'પાછળ', ta: 'பின்', te: 'వెనుకకు', kn: 'ಹಿಂದೆ' },
  save:          { en: 'Save', hi: 'सेव करें', mr: 'सेव्ह करा', gu: 'સેવ કરો', ta: 'சேமி', te: 'సేవ్ చేయండి', kn: 'ಉಳಿಸಿ' },
  my_account:    { en: 'My account', hi: 'मेरा खाता', mr: 'माझे खाते', gu: 'મારું ખાતું', ta: 'என் கணக்கு', te: 'నా ఖాతా', kn: 'ನನ್ನ ಖಾತೆ' },
  sign_out:      { en: 'Sign out', hi: 'साइन आउट', mr: 'साइन आउट', gu: 'સાઇન આઉટ', ta: 'வெளியேறு', te: 'సైన్ అవుట్', kn: 'ಸೈನ್ ಔಟ್' },
  browse_cats:   { en: 'Browse categories', hi: 'कैटेगरी देखें', mr: 'कॅटेगरी पहा', gu: 'કેટેગરી જુઓ', ta: 'வகைகளைப் பார்', te: 'విభాగాలు చూడండి', kn: 'ವರ್ಗಗಳನ್ನು ನೋಡಿ' },
};

// The same storage key the web storefront uses, so a language picked on the
// laptop is the language the phone opens in.
const LANG_KEY = 'eurostar-lang';

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

export function t(key: string, lang: Lang, fallback: string): string {
  const row = STRINGS[key];
  return (row && (row[lang] || row.en)) || fallback;
}

/** `T('nav_orders', 'Orders')` inside a component. */
export function useT() {
  const { lang } = useContext(LangContext);
  return React.useCallback((key: string, fallback: string) => t(key, lang, fallback), [lang]);
}

export function useLang() {
  return useContext(LangContext);
}
