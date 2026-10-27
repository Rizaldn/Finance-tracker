import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AmountText } from '@/components/amount-text'
import { ErrorState } from '@/components/states'
import { TypeBadge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime } from '@/lib/format'
import { transactionsService } from '@/services/transactions'
import type { Category, Transaction, Wallet } from '@/types/api'

interface TransactionDetailDialogProps {
  transaction: Transaction
  wallets: Wallet[]
  categories: Category[]
  onClose: () => void
}

/** Mengambil ulang transaksi lewat GET /transactions/{id} agar detail selalu terbaru. */
export function TransactionDetailDialog({
  transaction,
  wallets,
  categories,
  onClose,
}: TransactionDetailDialogProps) {
  const query = useQuery({
    queryKey: ['transactions', 'detail', transaction.id],
    queryFn: () => transactionsService.get(transaction.id),
    initialData: transaction,
    initialDataUpdatedAt: 0,
  })

  const tx = query.data
  const wallet = wallets.find((w) => w.id === tx.wallet_id)
  const category = categories.find((c) => c.id === tx.category_id)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent title="Detail transaksi" description={`Transaksi #${tx.id}`}>
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <dl className="space-y-3 text-sm">
            <Row label="Jenis">
              <TypeBadge type={tx.type} />
            </Row>
            <Row label="Nominal">
              {query.isFetching && query.isPending ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <AmountText amount={tx.amount} type={tx.type} />
              )}
            </Row>
            <Row label="Tanggal">{formatDate(tx.transaction_date)}</Row>
            <Row label="Dompet">{wallet?.name ?? `Dompet #${tx.wallet_id}`}</Row>
            <Row label="Kategori">{category?.name ?? `Kategori #${tx.category_id}`}</Row>
            <Row label="Catatan">{tx.note ? tx.note : <span className="text-slate-400">Tidak ada catatan</span>}</Row>
            <Row label="Dibuat">{formatDateTime(tx.created_at)}</Row>
            <Row label="Terakhir diubah">{formatDateTime(tx.updated_at)}</Row>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  )
}
