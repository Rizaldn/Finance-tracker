import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Lock, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AsyncBoundary } from '@/components/async-boundary'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/states'
import { Badge, TypeBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories, useInvalidateFinance } from '@/hooks/queries'
import { getErrorMessage } from '@/lib/api-client'
import { categoryStyle } from '@/lib/category-style'
import { cn } from '@/lib/utils'
import { categoriesService } from '@/services/categories'
import type { Category, TxType } from '@/types/api'
import { CategoryFormDialog } from './category-form-dialog'

type Filter = 'all' | TxType

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'income', label: 'Pemasukan' },
  { value: 'expense', label: 'Pengeluaran' },
]

export function CategoriesPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const query = useCategories(filter === 'all' ? undefined : filter)
  const invalidate = useInvalidateFinance()

  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const remove = useMutation({
    mutationFn: (category: Category) => categoriesService.remove(category.id),
    onSuccess: () => {
      toast.success('Kategori dihapus.')
      setDeleting(null)
      void invalidate()
    },
    onError: (error) => {
      // Mis. 409: kategori masih dipakai transaksi/anggaran
      toast.error(getErrorMessage(error))
      setDeleting(null)
    },
  })

  return (
    <>
      <PageHeader
        title="Kategori"
        description="Kelompokkan pemasukan dan pengeluaran. Kategori bawaan bersifat tetap."
        actions={
          <Button variant="accent" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            Tambah kategori
          </Button>
        }
      />

      <div role="tablist" aria-label="Filter jenis kategori" className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600',
              filter === item.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card>
        <AsyncBoundary
          query={query}
          skeleton={
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          }
          isEmpty={(data) => data.length === 0}
          empty={
            <EmptyState
              icon={Tags}
              title="Belum ada kategori"
              description="Tambahkan kategori untuk mengelompokkan transaksi Anda."
              action={
                <Button variant="accent" onClick={() => setEditing('new')}>
                  <Plus className="h-4 w-4" />
                  Tambah kategori
                </Button>
              }
            />
          }
        >
          {(data) => (
            <ul className="divide-y divide-slate-100">
              {data.map((category) => {
                const { Icon, accent } = categoryStyle(category)
                return (
                  <li key={category.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={cn('rounded-lg p-2', accent)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">{category.name}</span>
                      <TypeBadge type={category.type} />
                      {category.is_default ? (
                        <Badge>
                          <Lock className="h-3 w-3" />
                          Bawaan
                        </Badge>
                      ) : null}
                    </div>
                    {category.is_default ? (
                      <span className="hidden text-xs text-slate-400 sm:inline">Tidak dapat diubah atau dihapus</span>
                    ) : (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Edit kategori ${category.name}`}
                          onClick={() => setEditing(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-rose-600"
                          aria-label={`Hapus kategori ${category.name}`}
                          onClick={() => setDeleting(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </AsyncBoundary>
      </Card>

      {editing ? (
        <CategoryFormDialog
          category={editing === 'new' ? undefined : editing}
          defaultType={filter === 'all' ? 'expense' : filter}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title={`Hapus kategori “${deleting?.name ?? ''}”?`}
        description="Kategori yang masih dipakai transaksi atau anggaran akan ditolak oleh server. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus kategori"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  )
}
