import { z } from 'zod'

/** Maksimal 12 digit bulat dan 2 desimal (sesuai NUMERIC(14,2) di backend). */
export const MONEY_PATTERN = /^\d{1,12}([.,]\d{1,2})?$/

export const MONEY_FORMAT_MESSAGE =
  'Gunakan angka tanpa pemisah ribuan, contoh 18000 atau 18000,50 (maks. 2 desimal).'

/** "18000,50" -> 18000.5 */
export function parseMoneyInput(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

/** "250000.00" (dari API) -> "250000" untuk diisikan ke input. */
export function moneyToInput(value: string): string {
  return String(Number(value))
}

const moneyString = z
  .string()
  .trim()
  .min(1, 'Nominal wajib diisi')
  .regex(MONEY_PATTERN, MONEY_FORMAT_MESSAGE)

export const positiveMoney = moneyString.refine(
  (value) => parseMoneyInput(value) > 0,
  'Nominal harus lebih dari 0',
)

export const nonNegativeMoney = moneyString
