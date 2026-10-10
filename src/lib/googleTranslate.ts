// ============================================================
// GOOGLE TRANSLATE INTEGRATION — free, no API key required.
// Uses Google's public "Website Translator" widget script, which
// translates the entire rendered page (UI text AND dynamic course
// content) client-side. We hide Google's default banner/dropdown
// and drive it entirely through our own LanguagePicker component.
// ============================================================

export interface LanguageOption {
  code: string;   // Google Translate language code
  name: string;   // English name
  native: string; // Name in the language itself
  flag: string;   // Emoji flag
}

// A broad set of languages — "any language" coverage. Google Translate
// itself supports 100+; this list covers the most commonly requested ones
// with a nice flag + native name. (Selecting "English" simply clears
// translation since the app is authored in English.)
export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English',    native: 'English',      flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi',      native: 'हिन्दी',        flag: '🇮🇳' },
  { code: 'es', name: 'Spanish',    native: 'Español',       flag: '🇪🇸' },
  { code: 'fr', name: 'French',     native: 'Français',      flag: '🇫🇷' },
  { code: 'de', name: 'German',     native: 'Deutsch',       flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', native: 'Português',     flag: '🇵🇹' },
  { code: 'ru', name: 'Russian',    native: 'Русский',       flag: '🇷🇺' },
  { code: 'zh-CN', name: 'Chinese', native: '中文',           flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese',   native: '日本語',         flag: '🇯🇵' },
  { code: 'ko', name: 'Korean',     native: '한국어',         flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic',     native: 'العربية',       flag: '🇸🇦' },
  { code: 'ur', name: 'Urdu',       native: 'اردو',          flag: '🇵🇰' },
  { code: 'bn', name: 'Bengali',    native: 'বাংলা',         flag: '🇧🇩' },
  { code: 'ta', name: 'Tamil',      native: 'தமிழ்',         flag: '🇮🇳' },
  { code: 'te', name: 'Telugu',     native: 'తెలుగు',        flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi',    native: 'मराठी',         flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati',   native: 'ગુજરાતી',       flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada',    native: 'ಕನ್ನಡ',        flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam',  native: 'മലയാളം',        flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi',    native: 'ਪੰਜਾਬੀ',       flag: '🇮🇳' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt',    flag: '🇻🇳' },
  { code: 'th', name: 'Thai',       native: 'ไทย',           flag: '🇹🇭' },
  { code: 'tr', name: 'Turkish',    native: 'Türkçe',        flag: '🇹🇷' },
  { code: 'it', name: 'Italian',    native: 'Italiano',      flag: '🇮🇹' },
  { code: 'nl', name: 'Dutch',      native: 'Nederlands',    flag: '🇳🇱' },
  { code: 'pl', name: 'Polish',     native: 'Polski',        flag: '🇵🇱' },
  { code: 'sw', name: 'Swahili',    native: 'Kiswahili',     flag: '🇰🇪' },
  { code: 'fil', name: 'Filipino',  native: 'Filipino',      flag: '🇵🇭' },
];

const ELEMENT_ID = 'google_translate_element';
const COOKIE_NAME = 'googtrans';

declare global {
  interface Window {
    google?: { translate?: { TranslateElement?: any } };
    googleTranslateElementInit?: () => void;
  }
}

let scriptInjected = false;

/** Injects Google's translate widget script once per page load. */
export function initGoogleTranslate() {
  if (scriptInjected || typeof window === 'undefined') return;
  scriptInjected = true;

  if (!document.getElementById(ELEMENT_ID)) {
    const el = document.createElement('div');
    el.id = ELEMENT_ID;
    el.style.display = 'none';
    document.body.appendChild(el);
  }

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate?.TranslateElement) return;
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: LANGUAGES.map((l) => l.code).filter((c) => c !== 'en').join(','),
        autoDisplay: false,
      },
      ELEMENT_ID
    );
    // Re-apply whatever language was already selected (e.g. from a saved
    // profile preference) once the widget has actually finished loading.
    const saved = getCookieLang();
    if (saved && saved !== 'en') applyTranslation(saved, false);
  };

  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);
}

function setCookie(name: string, value: string) {
  const domain = window.location.hostname;
  document.cookie = `${name}=${value};path=/`;
  // Also set for the bare domain (needed on some hosts with subdomains)
  document.cookie = `${name}=${value};path=/;domain=.${domain}`;
}

function getCookieLang(): string | null {
  const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
  return match ? match[1] : null;
}

/**
 * Applies a language to the whole page. Uses the classic googtrans cookie
 * approach, which is the most reliable way to drive the widget
 * programmatically (the visible dropdown is hidden by our CSS).
 * `reload` defaults to true — a full reload guarantees dynamic/DB-driven
 * content (course text, lesson content, etc.) gets translated too.
 */
export function applyTranslation(langCode: string, reload = true) {
  if (langCode === 'en') {
    clearTranslation(reload);
    return;
  }
  setCookie(COOKIE_NAME, `/en/${langCode}`);
  localStorage.setItem('bitzy_lang', langCode);
  if (reload) window.location.reload();
}

export function clearTranslation(reload = true) {
  document.cookie = `${COOKIE_NAME}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${COOKIE_NAME}=;path=/;domain=.${window.location.hostname};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  localStorage.setItem('bitzy_lang', 'en');
  if (reload) window.location.reload();
}

export function getCurrentLanguage(): string {
  return localStorage.getItem('bitzy_lang') || getCookieLang() || 'en';
}

export function getLanguageInfo(code: string): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}