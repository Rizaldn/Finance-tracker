import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeftRight, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AmountText } from '@/components/amount-text'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Pagination } from '@/components/pagination'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState } from '@/components/states'
import { TypeBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories, useInvalidateFinance, useTransactionPage, useWallets } from '@/hooks/queries'
import { getErrorMessage } from '@/lib/api-client'
import { categoryStyle } from '@/lib/category-style'
import { formatDate, formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { transactionsService } from '@/services/transactions'
import type { Transaction } from '@/types/api'
import { TransactionDetailDialog } from './transaction-detail-dialog'
import { TransactionFilters, EMPTY_FILTERS, hasActiveFilters, type FilterState } from './transaction-filters'
import { TransactionFormDialog } from './transaction-form-dialog'

const PAGE_SIZE = 20

export function TransactionsPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [offset, setOffset] = useState(0)
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null)
  const [viewing, setViewing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const walletsQuery = useWallets()
  const categoriesQuery = useCategories()
  const wallets = walletsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const invalidate = useInvalidateFinance()

  const invalidRange = filters.startDate !== '' && filters.endDate !== '' && filters.startDate > filters.endDate

  // Hanya parameter yang terisi yang dikirim; yang kosong = undefined (dibuang oleh api-client).
  const params = useMemo(
    () => ({
      type: filters.type || undefined,
      walletId: filters.walletId ? Number(filters.walletId) : undefined,
      categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [filters, offset],
  )

  const query = useTransactionPage(params, !invalidRange)

  const remove = useMutation({
    mutationFn: (tx: Transaction) => transactionsService.remove(tx.id),
    onSuccess: () => {
      toast.success('Transaksi dihapus.')
      setDeleting(null)
      void invalidate()
      // Bila halaman terakhir menjadi kosong, mundur satu halaman.
      if (query.data && query.data.data.length === 1 && offset > 0) {
        setOffset(Math.max(0, offset - PAGE_SIZE))
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
      setDeleting(null)
    },
  })

  const walletName = (id: number) => wallets.find((w) => w.id === id)?.name ?? `Dompet #${id}`
  const category = (id: number) => categories.find((c) => c.id === id)

  function changeFilters(next: FilterState) {
    setFilters(next)
    setOffset(0)
  }

  const rows = query.data?.data ?? []
  const filtered = hasActiveFilters(filters)

  return (
    <>
      <PageHeader
        title="Transaksi"
        description="Catat dan kelola pemasukan serta pengeluaran Anda."
        actions={
          <Button variant="accent" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            Tambah transaksi
          </Button>
        }
      />

      <Card>
        <TransactionFilters value={filters} onChange={changeFilters} wallets={wallets} categories={categories} />

        {invalidRange ? null : query.isPending ? (
          <div className="space-y-3 p-5" aria-busy="true" aria-label="Memuat transaksi">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState title="Transaksi gagal dimuat" error={query.error} onRetry={() => void query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title={filtered ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}
            description={
              filtered
                ? 'Coba ubah atau reset filter untuk melihat transaksi lain.'
                : 'Mulai catat pemasukan atau pengeluaran pertama Anda.'
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={() => changeFilters(EMPTY_FILTERS)}>
                  Reset filter
                </Button>
              ) : (
                <Button variant="accent" onClick={() => setEditing('new')}>
                  <Plus className="h-4 w-4" />
                  Tambah transaksi
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Tabel untuk layar ≥ md */}
            <div className={cn('hidden overflow-x-auto md:block', query.isPlaceholderData && 'opacity-60')}>
              <table className="w-full text-sm">
                <caption className="sr-only">Daftar transaksi</caption>
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3 font-medium">Tanggal</th>
                    <th scope="col" className="px-3 py-3 font-medium">Kategori</th>
                    <th scope="col" className="px-3 py-3 font-medium">Dompet</th>
                    <th scope="col" className="px-3 py-3 font-medium">Catatan</th>
                    <th scope="col" className="px-3 py-3 text-right font-medium">Nominal</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((tx) => {
                    const cat = category(tx.category_id)
                    const style = cat ? categoryStyle(cat) : null
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDate(tx.transaction_date)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {style ? (
                              <span className={cn('rounded-md p-1.5', style.accent)}>
                                <style.Icon className="h-3.5 w-3.5" />
                              </span>
                            ) : null}
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{cat?.name ?? `Kategori #${tx.category_id}`}</p>
                              <TypeBadge type={tx.type} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{walletName(tx.wallet_id)}</td>
                        <td className="max-w-56 truncate px-3 py-3 text-slate-500" title={tx.note ?? undefined}>
                          {tx.note ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">
                          <AmountText amount={tx.amount} type={tx.type} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right">
                          <RowActions
                            tx={tx}
                            onView={() => setViewing(tx)}
                            onEdit={() => setEditing(tx)}
                            onDelete={() => setDeleting(tx)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Daftar kartu untuk layar kecil */}
            <ul className={cn('divide-y divide-slate-100 md:hidden', query.isPlaceholderData && 'opacity-60')}>
              {rows.map((tx) => {
                const cat = category(tx.category_id)
                return (
                  <li key={tx.id} className="space-y-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{cat?.name ?? `Kategori #${tx.category_id}`}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(tx.transaction_date)} · {walletName(tx.wallet_id)}
                        </p>
                      </div>
                      <AmountText amount={tx.amount} type={tx.type} />
                    </div>
                    {tx.note ? <p className="truncate text-xs text-slate-500">{tx.note}</p> : null}
                    <div className="flex items-center justify-between">
                      <TypeBadge type={tx.type} />
                      <RowActions
                        tx={tx}
                        onView={() => setViewing(tx)}
                        onEdit={() => setEditing(tx)}
                        onDelete={() => setDeleting(tx)}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>

            {query.data ? (
              <Pagination meta={query.data.meta} onChange={setOffset} disabled={query.isFetching} />
            ) : null}
          </>
        )}
      </Card>

      {editing ? (
        <TransactionFormDialog transaction={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      ) : null}

      {viewing ? (
        <TransactionDetailDialog
          transaction={viewing}
          wallets={wallets}
          categories={categories}
          onClose={() => setViewing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title="Hapus transaksi ini?"
        description={
          deleting
            ? `${deleting.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${formatIDR(deleting.amount)} pada ${formatDate(deleting.transaction_date)} akan dihapus permanen dan saldo dihitung ulang.`
            : ''
        }
        confirmLabel="Hapus transaksi"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  )
}

interface RowActionsProps {
  tx: Transaction
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

function RowActions({ tx, onView, onEdit, onDelete }: RowActionsProps) {
  const label = `transaksi ${formatDate(tx.transaction_date)} ${formatIDR(tx.amount)}`
  return (
    <div className="inline-flex gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Lihat detail ${label}`} onClick={onView}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${label}`} onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-rose-600" aria-label={`Hapus ${label}`} onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
