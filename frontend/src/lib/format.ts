/**
 * Format mata uang dan tanggal untuk pengguna Indonesia.
 * Nilai uang dari API berupa string 2 desimal (mis. "18000.00").
 */

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const compact = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const monthFormat = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
const monthShortFormat = new Intl.DateTimeFormat('id-ID', { month: 'short' })

export function formatIDR(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? idr.format(n) : '—'
}

export function formatCompactIDR(value: number): string {
  return compact.format(value)
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value)}%`
}

/** "2026-10-23" -> Date lokal (tanpa pergeseran zona waktu). */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function formatDate(value: string): string {
  return dateFormat.format(parseISODate(value))
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormat.format(date)
}

/** "2026-10" -> "Oktober 2026" */
export function formatMonth(month: string): string {
  return monthFormat.format(parseISODate(`${month}-01`))
}

/** "2026-10" -> "Okt" */
export function formatMonthShort(month: string): string {
  return monthShortFormat.format(parseISODate(`${month}-01`))
}

export function currentMonth(): string {
  return todayISO().slice(0, 7)
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  return toISODate(date).slice(0, 7)
}

/** Awal dan akhir bulan (inklusif) dalam format YYYY-MM-DD. */
export function monthBounds(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { start: `${month}-01`, end: `${month}-${String(last).padStart(2, '0')}` }
}

/** Daftar `count` bulan berurutan yang berakhir di `endMonth` (naik). */
export function lastMonths(endMonth: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(endMonth, i - (count - 1)))
}

/** Uang -> sen (bilangan bulat) agar penjumlahan tidak terkena galat float. */
export function toCents(value: string | number): number {
  return Math.round(Number(value) * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}
