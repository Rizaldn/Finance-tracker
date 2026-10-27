import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-client'

/** Ulangi hanya untuk gangguan jaringan/server, bukan untuk 4xx (input salah, tidak ditemukan). */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (error instanceof ApiError) {
    return error.kind === 'network' || error.kind === 'unavailable' || error.kind === 'server'
  }
  return false
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
})
