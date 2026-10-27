import { apiRequest } from '@/lib/api-client'
import type { Budget, DeletedOut, Envelope } from '@/types/api'

export interface BudgetCreateInput {
  category_id: number
  amount_limit: number
  /** Harus tanggal 1: YYYY-MM-01 */
  budget_month: string
}

export const budgetsService = {
  /** `month` format YYYY-MM (opsional). Backend menghitung spent/remaining/percentage_used. */
  list: async (userId: number, month?: string) =>
    (await apiRequest<Envelope<Budget[]>>('/budgets', { query: { user_id: userId, month } })).data,

  create: async (userId: number, input: BudgetCreateInput) =>
    (
      await apiRequest<Envelope<Budget>>('/budgets', {
        method: 'POST',
        body: { user_id: userId, ...input },
      })
    ).data,

  /** Backend hanya mengizinkan perubahan batas anggaran. */
  update: async (id: number, input: { amount_limit: number }) =>
    (await apiRequest<Envelope<Budget>>(`/budgets/${id}`, { method: 'PATCH', body: input })).data,

  remove: async (id: number) =>
    (await apiRequest<Envelope<DeletedOut>>(`/budgets/${id}`, { method: 'DELETE' })).data,
}
