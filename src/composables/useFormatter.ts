import { useI18n } from 'vue-i18n'

const DEFAULT_CURRENCY = 'EUR'

export function useFormatter() {
  const { locale } = useI18n()

  function formatAmount(
    amount: number,
    opts: Intl.NumberFormatOptions = {}
  ): string {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
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
