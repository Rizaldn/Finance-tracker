import { keepPreviousData, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetsService } from '@/services/budgets'
import { categoriesService } from '@/services/categories'
import { summaryService } from '@/services/summary'
import {
  transactionsService,
  type TransactionFilters,
  type TransactionListParams,
} from '@/services/transactions'
import { walletsService } from '@/services/wallets'
import type { Wallet, TxType } from '@/types/api'
import { useUser } from './user-context'

/**
 * Semua query diberi kunci [resource, ..., userId, ...] sehingga
 * `useInvalidateFinance` cukup membatalkan semuanya setelah mutasi.
 */

export function useWallets() {
  const { userId } = useUser()
  return useQuery({
    queryKey: ['wallets', userId],
    queryFn: () => walletsService.list(userId),
  })
}

export function useCategories(type?: TxType) {
  const { userId } = useUser()
  return useQuery({
    queryKey: ['categories', userId, type ?? 'all'],
    queryFn: () => categoriesService.list(userId, type),
  })
}

/** Ringkasan saldo. Tanpa walletId = seluruh dompet. */
export function useTotals(walletId?: number) {
  const { userId } = useUser()
  return useQuery({
    queryKey: ['summary', 'totals', userId, walletId ?? 'all'],
    queryFn: () => summaryService.totals(userId, walletId),
  })
}

/** Ringkasan per dompet (satu request per dompet, memakai ?wallet_id=). */
export function useWalletTotals(wallets: Wallet[]) {
  const { userId } = useUser()
  return useQueries({
    queries: wallets.map((wallet) => ({
      queryKey: ['summary', 'totals', userId, wallet.id],
      queryFn: () => summaryService.totals(userId, wallet.id),
    })),
  })
}

export function useCategorySummary(month: string) {
  const { userId } = useUser()
  return useQuery({
    queryKey: ['summary', 'by-category', userId, month],
    queryFn: () => summaryService.byCategory(userId, month),
  })
}

export function useBudgets(month?: string) {
  const { userId } = useUser()
  return useQuery({
    queryKey: ['budgets', userId, month ?? 'all'],
    queryFn: () => budgetsService.list(userId, month),
  })
}

export function useTransactionPage(params: TransactionListParams, enabled = true) {
  const { userId } = useUser()
  return useQuery({
    queryKey: ['transactions', 'page', userId, params],
    queryFn: () => transactionsService.list(userId, params),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** Semua transaksi dalam rentang tanggal (untuk agregasi grafik). */
export function useTransactionRange(filters: TransactionFilters) {
  const { userId } = useUser()
  return useQuery({
    queryKey: ['transactions', 'range', userId, filters],
    queryFn: () => transactionsService.listAll(userId, filters),
  })
}

/** Segarkan seluruh data keuangan setelah create/update/delete. */
export function useInvalidateFinance() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] !== 'user',
    })
}
