import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, PiggyBank, Scale, TrendingUp, Wallet as WalletIcon } from 'lucide-react'
import { AmountText } from '@/components/amount-text'
import { AsyncBoundary } from '@/components/async-boundary'
import { CashflowChart } from '@/components/charts/cashflow-chart'
import { CategoryDonut } from '@/components/charts/category-donut'
import { MonthPicker } from '@/components/month-picker'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { EmptyState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ProgressBar, budgetTone } from '@/components/ui/progress-bar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useBudgets,
  useCategories,
  useCategorySummary,
  useTotals,
  useTransactionPage,
  useTransactionRange,
  useWalletTotals,
  useWallets,
} from '@/hooks/queries'
import { aggregateByMonth } from '@/lib/aggregate'
import { categoryStyle } from '@/lib/category-style'
import { currentMonth, formatDate, formatIDR, formatMonth, formatPercent, lastMonths, monthBounds } from '@/lib/format'
import { cn } from '@/lib/utils'

const CHART_MONTHS = 6

function ViewAll({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="text-xs font-medium text-emerald-700 hover:underline">
      {label}
    </Link>
  )
}

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonth())

  const totals = useTotals()
  const walletsQuery = useWallets()
  const wallets = walletsQuery.data ?? []
  const walletTotals = useWalletTotals(wallets)
  const categories = useCategories()
  const categorySummary = useCategorySummary(month)
  const budgets = useBudgets(month)

  // Satu pengambilan transaksi untuk 6 bulan terakhir; tiap transaksi dijumlahkan sekali
  // ke bulannya. Bulan terpilih adalah bulan terakhir pada grafik.
  const months = useMemo(() => lastMonths(month, CHART_MONTHS), [month])
  const range = useMemo(
    () => ({ startDate: monthBounds(months[0]).start, endDate: monthBounds(month).end }),
    [months, month],
  )
  const rangeQuery = useTransactionRange(range)
  const flow = useMemo(() => (rangeQuery.data ? aggregateByMonth(rangeQuery.data, months) : null), [rangeQuery.data, months])
  const selected = flow?.[flow.length - 1]
  const net = selected ? selected.income - selected.expense : null

  const recent = useTransactionPage({ limit: 5, offset: 0 })
  const categoryList = categories.data ?? []

  return (
    <>
      <PageHeader
        title="Ringkasan"
        description="Gambaran keuangan Anda berdasarkan data dari server."
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />

      <section aria-label="Angka utama" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total saldo"
          icon={Scale}
          loading={totals.isPending}
          value={totals.isError ? 'Gagal dimuat' : totals.data ? formatIDR(totals.data.current_balance) : undefined}
          footer={
            totals.data
              ? `Saldo awal ${formatIDR(totals.data.initial_balance)} + pemasukan − pengeluaran (semua waktu)`
              : undefined
          }
        />
        <StatCard
          title={`Pemasukan · ${formatMonth(month)}`}
          icon={ArrowUpRight}
          tone="income"
          loading={rangeQuery.isPending}
          value={rangeQuery.isError ? 'Gagal dimuat' : selected ? formatIDR(selected.income) : undefined}
          footer={totals.data ? `Total semua waktu ${formatIDR(totals.data.total_income)}` : undefined}
        />
        <StatCard
          title={`Pengeluaran · ${formatMonth(month)}`}
          icon={ArrowDownRight}
          tone="expense"
          loading={rangeQuery.isPending}
          value={rangeQuery.isError ? 'Gagal dimuat' : selected ? formatIDR(selected.expense) : undefined}
          footer={totals.data ? `Total semua waktu ${formatIDR(totals.data.total_expense)}` : undefined}
        />
        <StatCard
          title="Arus kas bersih bulan ini"
          icon={PiggyBank}
          tone={net !== null && net < 0 ? 'expense' : 'income'}
          loading={rangeQuery.isPending}
          value={
            rangeQuery.isError ? (
              'Gagal dimuat'
            ) : net !== null ? (
              <span className={cn(net < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                {net > 0 ? '+' : net < 0 ? '−' : ''}
                {formatIDR(Math.abs(net))}
              </span>
            ) : undefined
          }
          footer="Pemasukan − pengeluaran pada bulan terpilih"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Pemasukan vs pengeluaran" description={`${CHART_MONTHS} bulan terakhir sampai ${formatMonth(month)}`} />
          <CardBody>
            <AsyncBoundary
              query={rangeQuery}
              skeleton={<Skeleton className="h-64 w-full" />}
              isEmpty={(data) => data.length === 0}
              empty={
                <EmptyState
                  icon={TrendingUp}
                  title="Belum ada transaksi pada periode ini"
                  description="Grafik akan muncul setelah Anda mencatat transaksi."
                  action={
                    <Link to="/transaksi" className="text-sm font-medium text-emerald-700 hover:underline">
                      Catat transaksi
                    </Link>
                  }
                />
              }
            >
              {() => (flow ? <CashflowChart data={flow} /> : null)}
            </AsyncBoundary>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Pengeluaran per kategori" description={formatMonth(month)} action={<ViewAll to="/laporan" label="Laporan" />} />
          <CardBody>
            <AsyncBoundary
              query={categorySummary}
              skeleton={<Skeleton className="h-48 w-full" />}
              isEmpty={(data) => data.categories.length === 0}
              empty={<EmptyState title="Tidak ada pengeluaran" description="Belum ada pengeluaran pada bulan ini." />}
            >
              {(data) => <CategoryDonut categories={data.categories} />}
            </AsyncBoundary>
          </CardBody>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Transaksi terbaru" action={<ViewAll to="/transaksi" label="Lihat semua" />} />
          <div className="pb-2 pt-2">
            <AsyncBoundary
              query={recent}
              skeleton={
                <div className="space-y-3 p-5">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              }
              isEmpty={(data) => data.data.length === 0}
              empty={<EmptyState title="Belum ada transaksi" description="Transaksi terbaru akan tampil di sini." />}
            >
              {(data) => (
                <ul className="divide-y divide-slate-100">
                  {data.data.map((tx) => {
                    const category = categoryList.find((c) => c.id === tx.category_id)
                    const style = category ? categoryStyle(category) : null
                    return (
                      <li key={tx.id} className="flex items-center gap-3 px-5 py-3">
                        {style ? (
                          <span className={cn('rounded-lg p-2', style.accent)}>
                            <style.Icon className="h-4 w-4" />
                          </span>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {category?.name ?? `Kategori #${tx.category_id}`}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {formatDate(tx.transaction_date)}
                            {tx.note ? ` · ${tx.note}` : ''}
                          </p>
                        </div>
                        <AmountText amount={tx.amount} type={tx.type} className="text-sm" />
                      </li>
                    )
                  })}
                </ul>
              )}
            </AsyncBoundary>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Dompet" action={<ViewAll to="/dompet" label="Kelola" />} />
            <div className="pb-2 pt-2">
              <AsyncBoundary
                query={walletsQuery}
                skeleton={
                  <div className="space-y-3 p-5">
                    {[0, 1].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                }
                isEmpty={(data) => data.length === 0}
                empty={<EmptyState icon={WalletIcon} title="Belum ada dompet" description="Buat dompet untuk mulai mencatat." />}
              >
                {(data) => (
                  <ul className="divide-y divide-slate-100">
                    {data.map((wallet, index) => {
                      const summary = walletTotals[index]
                      return (
                        <li key={wallet.id} className="flex items-center justify-between gap-3 px-5 py-3">
                          <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-900">
                            <WalletIcon className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">{wallet.name}</span>
                          </span>
                          <span className="text-sm tabular-nums text-slate-700">
                            {summary?.isPending ? (
                              <Skeleton className="h-5 w-24" />
                            ) : summary?.isError ? (
                              <span className="text-xs text-rose-600">Gagal</span>
                            ) : (
                              formatIDR(summary?.data?.current_balance)
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </AsyncBoundary>
            </div>
          </Card>

          <Card>
            <CardHeader title="Pemakaian anggaran" description={formatMonth(month)} action={<ViewAll to="/anggaran" label="Kelola" />} />
            <CardBody className="space-y-4">
              <AsyncBoundary
                query={budgets}
                skeleton={<Skeleton className="h-24 w-full" />}
                isEmpty={(data) => data.length === 0}
                empty={<EmptyState icon={PiggyBank} title="Belum ada anggaran" description="Buat anggaran bulanan untuk memantau pengeluaran." />}
              >
                {(data) => (
                  <ul className="space-y-4">
                    {data.map((budget) => {
                      const name = categoryList.find((c) => c.id === budget.category_id)?.name ?? `Kategori #${budget.category_id}`
                      const tone = budgetTone(budget.percentage_used)
                      return (
                        <li key={budget.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="truncate font-medium text-slate-900">{name}</span>
                            <span className="flex items-center gap-2">
                              {tone === 'over' ? <Badge tone="expense">Melebihi</Badge> : tone === 'warning' ? <Badge tone="warning">Hampir habis</Badge> : null}
                              <span className="text-xs tabular-nums text-slate-500">{formatPercent(budget.percentage_used)}</span>
                            </span>
                          </div>
                          <ProgressBar value={budget.percentage_used} label={`Pemakaian anggaran ${name}`} />
                          <p className="text-xs tabular-nums text-slate-500">
                            {formatIDR(budget.spent)} dari {formatIDR(budget.amount_limit)}
                          </p>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </AsyncBoundary>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  )
}
