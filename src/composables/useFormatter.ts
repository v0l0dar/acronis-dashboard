import { useI18n } from 'vue-i18n'

const LOCALE_CURRENCY = {
  en: 'USD',
  ja: 'JPY',
  de: 'EUR',
  es: 'EUR'
} as const satisfies Record<string, string>

type SupportedLocale = keyof typeof LOCALE_CURRENCY

function isSupportedLocale(loc: string): loc is SupportedLocale {
  return loc in LOCALE_CURRENCY
}

export function useFormatter() {
  const { locale } = useI18n()

  function formatAmount(
    amount: number,
    opts: Intl.NumberFormatOptions = {}
  ): string {
    const currency = isSupportedLocale(locale.value)
      ? LOCALE_CURRENCY[locale.value]
      : 'USD'
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency,
      ...opts
    }).format(amount)
  }

  function formatDate(
    iso: string,
    opts: Intl.DateTimeFormatOptions = {}
  ): string {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...opts
    }).format(d)
  }

  return { formatAmount, formatDate }
}
