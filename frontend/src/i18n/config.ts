import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from './locales/en/common.json';
import authEN from './locales/en/auth.json';
import lobbyEN from './locales/en/lobby.json';
import gameEN from './locales/en/game.json';
import notificationsEN from './locales/en/notifications.json';

import commonAR from './locales/ar/common.json';
import authAR from './locales/ar/auth.json';
import lobbyAR from './locales/ar/lobby.json';
import gameAR from './locales/ar/game.json';
import notificationsAR from './locales/ar/notifications.json';

// Define available languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  ar: 'العربية'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Configure i18next
i18n
  // Connect with React
  .use(initReactI18next)
  // Detect user language
  .use(LanguageDetector)
  // Initialize
  .init({
    resources: {
      en: {
        common: commonEN,
        auth: authEN,
        lobby: lobbyEN,
        game: gameEN,
        notifications: notificationsEN,
      },
      ar: {
        common: commonAR,
        auth: authAR,
        lobby: lobbyAR,
        game: gameAR,
        notifications: notificationsAR,
      },
    },

    // Default language
    fallbackLng: 'en',

    // Default namespace
    defaultNS: 'common',

    // Namespace separator
    ns: ['common', 'auth', 'lobby', 'game', 'notifications'],

    // Key separator (use . for nested keys)
    keySeparator: '.',

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],

      // Keys to lookup language in localStorage
      lookupLocalStorage: 'chess-coach-locale',

      // Cache user language
      caches: ['localStorage'],
    },

    // Supported languages
    supportedLngs: ['en', 'ar'],

    // Don't load languages that aren't in supportedLngs
    load: 'languageOnly',

    // Debug mode (disable in production)
    debug: import.meta.env.DEV,

    // React options
    react: {
      useSuspense: true,
    },
  });

// Helper function to set document direction and language
const setDocumentAttributes = (lng: string) => {
  const direction = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = lng;
};

// Set RTL direction when language is Arabic
i18n.on('languageChanged', (lng) => {
  setDocumentAttributes(lng);
});

// Set initial direction and language on first load
i18n.on('initialized', (options) => {
  setDocumentAttributes(i18n.resolvedLanguage || 'en');
});

export default i18n;
