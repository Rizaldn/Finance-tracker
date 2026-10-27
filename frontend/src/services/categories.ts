import { apiRequest } from '@/lib/api-client'
import type { Category, DeletedOut, Envelope, TxType } from '@/types/api'

export const categoriesService = {
  /** Kategori bawaan + milik pengguna. */
  list: async (userId: number, type?: TxType) =>
    (
      await apiRequest<Envelope<Category[]>>('/categories', {
        query: { user_id: userId, type },
      })
    ).data,

  create: async (userId: number, input: { name: string; type: TxType }) =>
    (
      await apiRequest<Envelope<Category>>('/categories', {
        method: 'POST',
        body: { user_id: userId, ...input },
      })
    ).data,

  /** Backend hanya mengizinkan perubahan nama. */
  update: async (id: number, input: { name: string }) =>
    (await apiRequest<Envelope<Category>>(`/categories/${id}`, { method: 'PATCH', body: input }))
      .data,

  remove: async (id: number) =>
    (await apiRequest<Envelope<DeletedOut>>(`/categories/${id}`, { method: 'DELETE' })).data,
}
