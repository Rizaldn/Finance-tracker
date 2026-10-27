import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, PiggyBank, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AsyncBoundary } from '@/components/async-boundary'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { MonthPicker } from '@/components/month-picker'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProgressBar, budgetTone } from '@/components/ui/progress-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { useBudgets, useCategories, useInvalidateFinance } from '@/hooks/queries'
import { getErrorMessage } from '@/lib/api-client'
import { categoryStyle } from '@/lib/category-style'
import { currentMonth, formatIDR, formatMonth, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { budgetsService } from '@/services/budgets'
import type { Budget } from '@/types/api'
import { BudgetFormDialog } from './budget-form-dialog'

export function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth())
  const query = useBudgets(month)
  const categoriesQuery = useCategories()
  const invalidate = useInvalidateFinance()

  const [editing, setEditing] = useState<Budget | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Budget | null>(null)

  const remove = useMutation({
    mutationFn: (budget: Budget) => budgetsService.remove(budget.id),
    onSuccess: () => {
      toast.success('Anggaran dihapus.')
      setDeleting(null)
      void invalidate()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
      setDeleting(null)
    },
  })

  const categories = categoriesQuery.data ?? []
  const nameOf = (id: number) => categories.find((c) => c.id === id)?.name ?? `Kategori #${id}`

  return (
    <>
      <PageHeader
        title="Anggaran"
        description="Tetapkan batas pengeluaran per kategori setiap bulan dan pantau pemakaiannya."
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} />
            <Button variant="accent" onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" />
              Tambah anggaran
            </Button>
          </>
        }
      />

      <AsyncBoundary
        query={query}
        skeleton={
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        }
        isEmpty={(data) => data.length === 0}
        empty={
          <Card>
            <EmptyState
              icon={PiggyBank}
              title={`Belum ada anggaran untuk ${formatMonth(month)}`}
              description="Buat anggaran agar pengeluaran per kategori bisa dipantau terhadap batasnya."
              action={
                <Button variant="accent" onClick={() => setEditing('new')}>
                  <Plus className="h-4 w-4" />
                  Tambah anggaran
                </Button>
              }
            />
          </Card>
        }
      >
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2">
            {data.map((budget) => {
              const category = categories.find((c) => c.id === budget.category_id)
              const style = category ? categoryStyle(category) : null
              const tone = budgetTone(budget.percentage_used)
              const over = tone === 'over'
              return (
                <Card key={budget.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {style ? (
                        <span className={cn('rounded-lg p-2', style.accent)}>
                          <style.Icon className="h-4 w-4" />
                        </span>
                      ) : null}
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-900">{nameOf(budget.category_id)}</h2>
                        <p className="text-xs text-slate-500">{formatMonth(budget.budget_month.slice(0, 7))}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Edit anggaran ${nameOf(budget.category_id)}`}
                        onClick={() => setEditing(budget)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-rose-600"
                        aria-label={`Hapus anggaran ${nameOf(budget.category_id)}`}
                        onClick={() => setDeleting(budget)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Terpakai</p>
                      <p className="text-xl font-semibold tabular-nums text-slate-900">{formatIDR(budget.spent)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">dari batas</p>
                      <p className="text-sm font-medium tabular-nums text-slate-700">{formatIDR(budget.amount_limit)}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <ProgressBar value={budget.percentage_used} label={`Pemakaian anggaran ${nameOf(budget.category_id)}`} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    <span className={cn('font-medium', over ? 'text-rose-600' : 'text-slate-600')}>
                      {over
                        ? `Melebihi ${formatIDR(Math.abs(Number(budget.remaining)))}`
                        : `Sisa ${formatIDR(budget.remaining)}`}
                    </span>
                    <span className="flex items-center gap-2">
                      {tone === 'over' ? (
                        <Badge tone="expense">
                          <AlertTriangle className="h-3 w-3" />
                          Melebihi anggaran
                        </Badge>
                      ) : tone === 'warning' ? (
                        <Badge tone="warning">
                          <AlertTriangle className="h-3 w-3" />
                          Hampir habis
                        </Badge>
                      ) : null}
                      <span className="tabular-nums text-slate-500">{formatPercent(budget.percentage_used)}</span>
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </AsyncBoundary>

      {editing ? (
        <BudgetFormDialog
          month={month}
          budget={editing === 'new' ? undefined : editing}
          usedCategoryIds={(query.data ?? []).map((b) => b.category_id)}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title="Hapus anggaran ini?"
        description={
          deleting
            ? `Anggaran ${nameOf(deleting.category_id)} untuk ${formatMonth(deleting.budget_month.slice(0, 7))} akan dihapus. Transaksi tidak ikut terhapus.`
            : ''
        }
        confirmLabel="Hapus anggaran"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  )
}
