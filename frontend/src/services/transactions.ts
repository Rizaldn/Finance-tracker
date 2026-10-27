import { apiRequest } from '@/lib/api-client'
import type {
  DeletedOut,
  Envelope,
  PagedEnvelope,
  Transaction,
  TxType,
} from '@/types/api'

export interface TransactionFilters {
  categoryId?: number
  walletId?: number
  type?: TxType
  /** YYYY-MM-DD */
  startDate?: string
  /** YYYY-MM-DD */
  endDate?: string
}

export interface TransactionListParams extends TransactionFilters {
  limit?: number
  offset?: number
}

export interface TransactionInput {
  wallet_id: number
  category_id: number
  type: TxType
  amount: number
  transaction_date: string
  note: string | null
}

const MAX_LIMIT = 200 // batas `limit` di backend
const MAX_PAGES = 50

export const transactionsService = {
  list: (userId: number, params: TransactionListParams = {}) =>
    apiRequest<PagedEnvelope<Transaction>>('/transactions', {
      query: {
        user_id: userId,
        category_id: params.categoryId,
        wallet_id: params.walletId,
        type: params.type,
        start_date: params.startDate,
        end_date: params.endDate,
        limit: params.limit,
        offset: params.offset,
      },
    }),

  /** Mengambil semua halaman (maks. 200 per request) untuk agregasi di klien. */
  listAll: async (userId: number, filters: TransactionFilters = {}): Promise<Transaction[]> => {
    const all: Transaction[] = []
    let offset = 0
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const res = await transactionsService.list(userId, { ...filters, limit: MAX_LIMIT, offset })
      all.push(...res.data)
      offset += MAX_LIMIT
      if (offset >= res.meta.total) break
    }
    return all
  },

  get: async (id: number) =>
    (await apiRequest<Envelope<Transaction>>(`/transactions/${id}`)).data,

  create: async (userId: number, input: TransactionInput) =>
    (
      await apiRequest<Envelope<Transaction>>('/transactions', {
        method: 'POST',
        body: { user_id: userId, ...input },
      })
    ).data,

  /** PUT: semua field yang bisa diedit dikirim ulang; user_id tidak bisa diubah. */
  replace: async (id: number, input: TransactionInput) =>
    (await apiRequest<Envelope<Transaction>>(`/transactions/${id}`, { method: 'PUT', body: input }))
      .data,

  remove: async (id: number) =>
    (await apiRequest<Envelope<DeletedOut>>(`/transactions/${id}`, { method: 'DELETE' })).data,
}
