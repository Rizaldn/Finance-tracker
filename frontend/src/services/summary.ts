import { apiRequest } from '@/lib/api-client'
import type { CategorySummary, Envelope, Summary } from '@/types/api'

export const summaryService = {
  /** Saldo awal + pemasukan - pengeluaran. Tanpa walletId = semua dompet. */
  totals: async (userId: number, walletId?: number) =>
    (
      await apiRequest<Envelope<Summary>>('/summary', {
        query: { user_id: userId, wallet_id: walletId },
      })
    ).data,

  /** Pengeluaran per kategori pada satu bulan (YYYY-MM). */
  byCategory: async (userId: number, month?: string) =>
    (
      await apiRequest<Envelope<CategorySummary>>('/summary/by-category', {
        query: { user_id: userId, month },
      })
    ).data,
}
