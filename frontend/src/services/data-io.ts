import { apiRequest } from '@/lib/api-client'
import type { Envelope, ExportData, ImportPayload, ImportResult } from '@/types/api'

export const dataIoService = {
  /** Mengembalikan envelope utuh {message, data} agar file unduhan sama dengan respons API. */
  exportData: (userId: number) =>
    apiRequest<Envelope<ExportData>>('/export', { query: { user_id: userId } }),

  /** Impor transaksi (1-500). Semua atau tidak sama sekali. */
  importTransactions: async (payload: ImportPayload) =>
    (await apiRequest<Envelope<ImportResult>>('/import', { method: 'POST', body: payload })).data,
}
