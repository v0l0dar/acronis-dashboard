import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ja from './locales/ja.json'
import de from './locales/de.json'
import es from './locales/es.json'

export const LOCALE_STORAGE_KEY = 'app-locale'

const SUPPORTED_LOCALES = ['en', 'ja', 'de', 'es'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function readSavedLocale(): SupportedLocale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
  return SUPPORTED_LOCALES.includes(saved as SupportedLocale)
    ? (saved as SupportedLocale)
    : 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: readSavedLocale(),
  fallbackLocale: 'en',
  messages: { en, ja, de, es }
})

export default i18n
