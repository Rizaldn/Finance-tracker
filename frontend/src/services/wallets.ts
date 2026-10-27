import { apiRequest } from '@/lib/api-client'
import type { DeletedOut, Envelope, Wallet } from '@/types/api'

export interface WalletInput {
  name: string
  initial_balance: number
}

export const walletsService = {
  list: async (userId: number) =>
    (await apiRequest<Envelope<Wallet[]>>('/wallets', { query: { user_id: userId } })).data,

  create: async (userId: number, input: WalletInput) =>
    (
      await apiRequest<Envelope<Wallet>>('/wallets', {
        method: 'POST',
        body: { user_id: userId, ...input },
      })
    ).data,

  update: async (id: number, input: Partial<WalletInput>) =>
    (await apiRequest<Envelope<Wallet>>(`/wallets/${id}`, { method: 'PATCH', body: input })).data,

  remove: async (id: number) =>
    (await apiRequest<Envelope<DeletedOut>>(`/wallets/${id}`, { method: 'DELETE' })).data,
}
