import { apiRequest } from '@/lib/api-client'
import type { Envelope, User } from '@/types/api'

export const usersService = {
  get: async (id: number) => (await apiRequest<Envelope<User>>(`/users/${id}`)).data,

  create: async (body: { name: string; email: string }) =>
    (await apiRequest<Envelope<User>>('/users', { method: 'POST', body })).data,
}
