import { useI18n } from 'vue-i18n'

const LOCALE_CURRENCY: Record<string, string> = {
  en: 'USD',
  ja: 'JPY',
  de: 'EUR',
  es: 'EUR'
}

export function useFormatter() {
  const { locale } = useI18n()

  function formatAmount(
    amount: number,
    opts: Intl.NumberFormatOptions = {}
  ): string {
    const currency = LOCALE_CURRENCY[locale.value] ?? 'USD'
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
    return new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...opts
    }).format(new Date(iso))
  }

  return { formatAmount, formatDate }
}
