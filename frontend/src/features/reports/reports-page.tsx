import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BarChart3, Scale, Wallet as WalletIcon } from 'lucide-react'
import { CashflowChart } from '@/components/charts/cashflow-chart'
import { CategoryDonut } from '@/components/charts/category-donut'
import { AsyncBoundary } from '@/components/async-boundary'
import { MonthPicker } from '@/components/month-picker'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { EmptyState } from '@/components/states'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ProgressBar, budgetTone } from '@/components/ui/progress-bar'
import { Select } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories, useCategorySummary, useTotals, useTransactionRange, useWallets } from '@/hooks/queries'
import { aggregateByMonth } from '@/lib/aggregate'
import { categoryStyle } from '@/lib/category-style'
import { currentMonth, formatIDR, formatMonth, formatPercent, lastMonths, monthBounds } from '@/lib/format'
import { cn } from '@/lib/utils'

const TREND_MONTHS = 6

export function ReportsPage() {
  const [month, setMonth] = useState(currentMonth())
  const [walletId, setWalletId] = useState('')

  const walletsQuery = useWallets()
  const totals = useTotals(walletId ? Number(walletId) : undefined)
  const categorySummary = useCategorySummary(month)
  const categories = useCategories()

  const months = useMemo(() => lastMonths(month, TREND_MONTHS), [month])
  const range = useMemo(
    () => ({
      startDate: monthBounds(months[0]).start,
      endDate: monthBounds(month).end,
      walletId: walletId ? Number(walletId) : undefined,
    }),
    [months, month, walletId],
  )
  const rangeQuery = useTransactionRange(range)
  const flow = useMemo(() => (rangeQuery.data ? aggregateByMonth(rangeQuery.data, months) : null), [rangeQuery.data, months])

  return (
    <>
      <PageHeader
        title="Laporan"
        description="Analisis saldo, arus kas, dan pengeluaran per kategori."
        actions={
          <>
            <label className="sr-only" htmlFor="report-wallet">
              Filter dompet
            </label>
            <Select id="report-wallet" className="w-44" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
              <option value="">Semua dompet</option>
              {(walletsQuery.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
            <MonthPicker value={month} onChange={setMonth} />
          </>
        }
      />

      <section aria-label="Ringkasan saldo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Saldo saat ini"
          icon={Scale}
          loading={totals.isPending}
          value={totals.isError ? 'Gagal dimuat' : totals.data ? formatIDR(totals.data.current_balance) : undefined}
          footer={walletId ? 'Dompet terpilih' : 'Semua dompet'}
        />
        <StatCard
          title="Saldo awal"
          icon={WalletIcon}
          loading={totals.isPending}
          value={totals.isError ? 'Gagal dimuat' : totals.data ? formatIDR(totals.data.initial_balance) : undefined}
        />
        <StatCard
          title="Total pemasukan"
          icon={ArrowUpRight}
          tone="income"
          loading={totals.isPending}
          value={totals.isError ? 'Gagal dimuat' : totals.data ? formatIDR(totals.data.total_income) : undefined}
          footer="Semua waktu"
        />
        <StatCard
          title="Total pengeluaran"
          icon={ArrowDownRight}
          tone="expense"
          loading={totals.isPending}
          value={totals.isError ? 'Gagal dimuat' : totals.data ? formatIDR(totals.data.total_expense) : undefined}
          footer={totals.data ? `${totals.data.total_transactions} transaksi` : undefined}
        />
      </section>

      <Card className="mt-6">
        <CardHeader title="Pemasukan vs pengeluaran" description={`${TREND_MONTHS} bulan terakhir sampai ${formatMonth(month)}`} />
        <CardBody>
          <AsyncBoundary
            query={rangeQuery}
            skeleton={<Skeleton className="h-64 w-full" />}
            isEmpty={(data) => data.length === 0}
            empty={<EmptyState icon={BarChart3} title="Belum ada transaksi" description="Tidak ada transaksi pada periode dan dompet yang dipilih." />}
          >
            {() =>
              flow ? (
                <>
                  <CashflowChart data={flow} />
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <caption className="sr-only">Pemasukan dan pengeluaran per bulan</caption>
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th scope="col" className="py-2 pr-3 font-medium">Bulan</th>
                          <th scope="col" className="px-3 py-2 text-right font-medium">Pemasukan</th>
                          <th scope="col" className="px-3 py-2 text-right font-medium">Pengeluaran</th>
                          <th scope="col" className="py-2 pl-3 text-right font-medium">Selisih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 tabular-nums">
                        {flow.map((row) => {
                          const diff = row.income - row.expense
                          return (
                            <tr key={row.month}>
                              <th scope="row" className="py-2 pr-3 text-left font-medium text-slate-700">{formatMonth(row.month)}</th>
                              <td className="px-3 py-2 text-right text-emerald-600">{formatIDR(row.income)}</td>
                              <td className="px-3 py-2 text-right text-rose-600">{formatIDR(row.expense)}</td>
                              <td className={cn('py-2 pl-3 text-right font-medium', diff < 0 ? 'text-rose-600' : 'text-slate-900')}>
                                {diff < 0 ? '−' : ''}
                                {formatIDR(Math.abs(diff))}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null
            }
          </AsyncBoundary>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Pengeluaran per kategori"
          description={`${formatMonth(month)} · semua dompet (ringkasan kategori dari server tidak mendukung filter dompet)`}
        />
        <CardBody>
          <AsyncBoundary
            query={categorySummary}
            skeleton={<Skeleton className="h-56 w-full" />}
            isEmpty={(data) => data.categories.length === 0}
            empty={<EmptyState icon={BarChart3} title="Tidak ada pengeluaran" description={`Belum ada pengeluaran pada ${formatMonth(month)}.`} />}
          >
            {(data) => (
              <div className="space-y-6">
                <CategoryDonut categories={data.categories} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Rincian pengeluaran per kategori</caption>
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th scope="col" className="py-2 pr-3 font-medium">Kategori</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">Pengeluaran</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">Anggaran</th>
                        <th scope="col" className="w-44 py-2 pl-3 font-medium">Pemakaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.categories.map((row) => {
                        const category = categories.data?.find((c) => c.id === row.category_id)
                        const style = category ? categoryStyle(category) : null
                        return (
                          <tr key={row.category_id}>
                            <th scope="row" className="py-2 pr-3 text-left font-medium text-slate-800">
                              <span className="flex items-center gap-2">
                                {style ? (
                                  <span className={cn('rounded-md p-1.5', style.accent)}>
                                    <style.Icon className="h-3.5 w-3.5" />
                                  </span>
                                ) : null}
                                {row.category_name}
                              </span>
                            </th>
                            <td className="px-3 py-2 text-right tabular-nums text-rose-600">{formatIDR(row.total_expense)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                              {row.budget_limit ? formatIDR(row.budget_limit) : <span className="text-slate-400">Tanpa anggaran</span>}
                            </td>
                            <td className="py-2 pl-3">
                              {row.percentage_used !== null ? (
                                <div className="space-y-1">
                                  <ProgressBar value={row.percentage_used} tone={budgetTone(row.percentage_used)} label={`Pemakaian anggaran ${row.category_name}`} />
                                  <span className="text-xs tabular-nums text-slate-500">{formatPercent(row.percentage_used)}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200">
                        <th scope="row" className="py-2 pr-3 text-left font-semibold text-slate-900">Total</th>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">{formatIDR(data.total_expense)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </AsyncBoundary>
        </CardBody>
      </Card>
    </>
  )
}
