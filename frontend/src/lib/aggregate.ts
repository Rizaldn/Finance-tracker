import { formatMonthShort, fromCents, toCents } from '@/lib/format'
import type { Transaction } from '@/types/api'

export interface MonthlyFlow {
  month: string
  label: string
  income: number
  expense: number
}

/**
 * Menjumlahkan transaksi per bulan (pemasukan dan pengeluaran terpisah).
 * Penjumlahan dilakukan dalam sen agar tidak ada galat pembulatan float.
 * Setiap transaksi dihitung tepat satu kali.
 */
export function aggregateByMonth(transactions: Transaction[], months: string[]): MonthlyFlow[] {
  const income = new Map<string, number>(months.map((m) => [m, 0]))
  const expense = new Map<string, number>(months.map((m) => [m, 0]))

  for (const tx of transactions) {
    const month = tx.transaction_date.slice(0, 7)
    const target = tx.type === 'income' ? income : expense
    if (!target.has(month)) continue
    target.set(month, (target.get(month) ?? 0) + toCents(tx.amount))
  }

  return months.map((month) => ({
    month,
    label: formatMonthShort(month),
    income: fromCents(income.get(month) ?? 0),
    expense: fromCents(expense.get(month) ?? 0),
  }))
}
