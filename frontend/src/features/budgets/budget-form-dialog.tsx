import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormDialog } from '@/components/form-dialog'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { useCategories, useInvalidateFinance } from '@/hooks/queries'
import { useUser } from '@/hooks/user-context'
import { getErrorMessage } from '@/lib/api-client'
import { formatMonth } from '@/lib/format'
import { moneyToInput, parseMoneyInput, positiveMoney } from '@/lib/money-input'
import { budgetsService } from '@/services/budgets'
import type { Budget } from '@/types/api'

const schema = z.object({
  category_id: z.string().min(1, 'Pilih kategori pengeluaran'),
  amount_limit: positiveMoney,
})

type FormValues = z.infer<typeof schema>

interface BudgetFormDialogProps {
  /** Bulan aktif (YYYY-MM) untuk anggaran baru. */
  month: string
  budget?: Budget
  /** ID kategori yang sudah punya anggaran pada bulan ini (backend: satu per kategori per bulan). */
  usedCategoryIds: number[]
  onClose: () => void
}

export function BudgetFormDialog({ month, budget, usedCategoryIds, onClose }: BudgetFormDialogProps) {
  const { userId } = useUser()
  const invalidate = useInvalidateFinance()
  const categoriesQuery = useCategories('expense')
  const [serverError, setServerError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const editing = budget !== undefined

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: budget ? String(budget.category_id) : '',
      amount_limit: budget ? moneyToInput(budget.amount_limit) : '',
    },
  })

  useEffect(() => setDirty(isDirty), [isDirty])

  // Hanya kategori pengeluaran yang belum punya anggaran pada bulan ini.
  const available = useMemo(
    () => (categoriesQuery.data ?? []).filter((c) => !usedCategoryIds.includes(c.id)),
    [categoriesQuery.data, usedCategoryIds],
  )

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const amount_limit = parseMoneyInput(values.amount_limit)
      return budget
        ? budgetsService.update(budget.id, { amount_limit })
        : budgetsService.create(userId, {
            category_id: Number(values.category_id),
            amount_limit,
            budget_month: `${month}-01`,
          })
    },
    onSuccess: () => {
      toast.success(editing ? 'Anggaran diperbarui.' : 'Anggaran dibuat.')
      void invalidate()
      onClose()
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      setServerError(message)
      toast.error(message)
    },
  })

  const categoryName =
    categoriesQuery.data?.find((c) => c.id === budget?.category_id)?.name ?? `Kategori #${budget?.category_id}`

  return (
    <FormDialog
      onClose={onClose}
      dirty={dirty && !mutation.isSuccess}
      title={editing ? 'Edit anggaran' : 'Tambah anggaran'}
      description={
        budget
          ? `Hanya batas anggaran yang dapat diubah. Periode ${formatMonth(budget.budget_month.slice(0, 7))}.`
          : `Anggaran untuk ${formatMonth(month)}. Hanya satu anggaran per kategori per bulan.`
      }
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit((values) => {
          setServerError(null)
          mutation.mutate(values)
        })}
      >
        {editing ? (
          <Field label="Kategori" htmlFor="budget-category-readonly">
            <Input id="budget-category-readonly" value={categoryName} disabled readOnly />
          </Field>
        ) : (
          <Field
            label="Kategori pengeluaran"
            htmlFor="budget-category"
            error={errors.category_id?.message}
            hint={
              !categoriesQuery.isPending && !categoriesQuery.isError && available.length === 0
                ? 'Semua kategori pengeluaran sudah punya anggaran bulan ini.'
                : undefined
            }
          >
            <Select
              id="budget-category"
              disabled={categoriesQuery.isPending}
              aria-invalid={!!errors.category_id}
              {...register('category_id')}
            >
              <option value="">{categoriesQuery.isPending ? 'Memuat…' : 'Pilih kategori'}</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {categoriesQuery.isError ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Kategori gagal dimuat.{' '}
            <button type="button" className="font-medium underline" onClick={() => void categoriesQuery.refetch()}>
              Coba lagi
            </button>
          </p>
        ) : null}

        <Field label="Batas anggaran (IDR)" htmlFor="budget-limit" error={errors.amount_limit?.message}>
          <Input
            id="budget-limit"
            inputMode="decimal"
            placeholder="500000"
            autoFocus={editing}
            aria-invalid={!!errors.amount_limit}
            {...register('amount_limit')}
          />
        </Field>

        {serverError ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {serverError}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Batal
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || (!editing && (categoriesQuery.isPending || available.length === 0))}
          >
            {mutation.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}
