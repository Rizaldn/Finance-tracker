import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Wallet as WalletIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AsyncBoundary } from '@/components/async-boundary'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { EmptyState, ErrorState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvalidateFinance, useTotals, useWalletTotals, useWallets } from '@/hooks/queries'
import { getErrorMessage } from '@/lib/api-client'
import { formatDate, formatIDR } from '@/lib/format'
import { walletsService } from '@/services/wallets'
import type { Wallet } from '@/types/api'
import { WalletFormDialog } from './wallet-form-dialog'

function CardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-44 w-full rounded-2xl" />
      ))}
    </div>
  )
}

export function WalletsPage() {
  const walletsQuery = useWallets()
  const wallets = walletsQuery.data ?? []
  const totals = useWalletTotals(wallets)
  const overall = useTotals()
  const invalidate = useInvalidateFinance()

  const [editing, setEditing] = useState<Wallet | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Wallet | null>(null)

  const remove = useMutation({
    mutationFn: (wallet: Wallet) => walletsService.remove(wallet.id),
    onSuccess: () => {
      toast.success('Dompet dihapus.')
      setDeleting(null)
      void invalidate()
    },
    onError: (error) => {
      // Mis. 409: dompet masih dipakai transaksi
      toast.error(getErrorMessage(error))
      setDeleting(null)
    },
  })

  return (
    <>
      <PageHeader
        title="Dompet"
        description="Kelola sumber dana Anda dan pantau saldo tiap dompet."
        actions={
          <Button variant="accent" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            Tambah dompet
          </Button>
        }
      />

      <Card className="mb-6 flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">Total saldo semua dompet</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
            {overall.isPending ? <Skeleton className="h-8 w-40" /> : overall.isError ? '—' : formatIDR(overall.data.current_balance)}
          </p>
        </div>
        <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
          <WalletIcon className="h-5 w-5" />
        </span>
      </Card>

      <AsyncBoundary
        query={walletsQuery}
        skeleton={<CardsSkeleton />}
        isEmpty={(data) => data.length === 0}
        empty={
          <Card>
            <EmptyState
              icon={WalletIcon}
              title="Belum ada dompet"
              description="Buat dompet pertama Anda agar bisa mencatat transaksi."
              action={
                <Button variant="accent" onClick={() => setEditing('new')}>
                  <Plus className="h-4 w-4" />
                  Tambah dompet
                </Button>
              }
            />
          </Card>
        }
      >
        {(data) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((wallet, index) => {
              const summary = totals[index]
              return (
                <Card key={wallet.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-slate-900">{wallet.name}</h2>
                      <p className="text-xs text-slate-500">Dibuat {formatDate(wallet.created_at.slice(0, 10))}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Edit dompet ${wallet.name}`}
                        onClick={() => setEditing(wallet)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-rose-600"
                        aria-label={`Hapus dompet ${wallet.name}`}
                        onClick={() => setDeleting(wallet)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-500">Saldo saat ini</p>
                    <div className="text-2xl font-semibold tabular-nums text-slate-900">
                      {summary?.isPending ? (
                        <Skeleton className="mt-1 h-8 w-32" />
                      ) : summary?.isError ? (
                        <span className="text-sm font-normal text-rose-600">Gagal memuat saldo</span>
                      ) : (
                        formatIDR(summary?.data?.current_balance)
                      )}
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs">
                    <div>
                      <dt className="text-slate-500">Saldo awal</dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-slate-700">{formatIDR(wallet.initial_balance)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Pemasukan</dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-emerald-600">
                        {summary?.data ? formatIDR(summary.data.total_income) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Pengeluaran</dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-rose-600">
                        {summary?.data ? formatIDR(summary.data.total_expense) : '—'}
                      </dd>
                    </div>
                  </dl>
                </Card>
              )
            })}
          </div>
        )}
      </AsyncBoundary>

      {walletsQuery.isError ? null : overall.isError ? (
        <Card className="mt-4">
          <ErrorState title="Total saldo gagal dimuat" error={overall.error} onRetry={() => void overall.refetch()} />
        </Card>
      ) : null}

      {editing ? (
        <WalletFormDialog
          wallet={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title={`Hapus dompet “${deleting?.name ?? ''}”?`}
        description="Dompet yang masih dipakai transaksi akan ditolak oleh server, dan Anda akan melihat alasannya. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus dompet"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  )
}
