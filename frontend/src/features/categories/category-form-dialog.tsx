import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormDialog } from '@/components/form-dialog'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useInvalidateFinance } from '@/hooks/queries'
import { useUser } from '@/hooks/user-context'
import { getErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { categoriesService } from '@/services/categories'
import type { Category, TxType } from '@/types/api'

const schema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(100, 'Maksimal 100 karakter'),
  type: z.enum(['income', 'expense']),
})

type FormValues = z.infer<typeof schema>

interface CategoryFormDialogProps {
  category?: Category
  defaultType?: TxType
  onClose: () => void
}

export function CategoryFormDialog({ category, defaultType = 'expense', onClose }: CategoryFormDialogProps) {
  const { userId } = useUser()
  const invalidate = useInvalidateFinance()
  const [serverError, setServerError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const editing = category !== undefined

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: category?.name ?? '', type: category?.type ?? defaultType },
  })

  useEffect(() => setDirty(isDirty), [isDirty])
  const type = watch('type')

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      category
        ? categoriesService.update(category.id, { name: values.name })
        : categoriesService.create(userId, { name: values.name, type: values.type }),
    onSuccess: () => {
      toast.success(editing ? 'Kategori diperbarui.' : 'Kategori dibuat.')
      void invalidate()
      onClose()
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      setServerError(message)
      toast.error(message)
    },
  })

  return (
    <FormDialog
      onClose={onClose}
      dirty={dirty && !mutation.isSuccess}
      title={editing ? 'Edit kategori' : 'Tambah kategori'}
      description={editing ? 'Hanya nama kategori yang dapat diubah.' : 'Buat kategori milik Anda untuk mengelompokkan transaksi.'}
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit((values) => {
          setServerError(null)
          mutation.mutate(values)
        })}
      >
        <Field label="Nama kategori" htmlFor="category-name" error={errors.name?.message}>
          <Input id="category-name" autoFocus aria-invalid={!!errors.name} {...register('name')} />
        </Field>

        <div className="space-y-1.5">
          <span id="category-type-label" className="text-sm font-medium text-slate-700">
            Jenis
          </span>
          <div role="radiogroup" aria-labelledby="category-type-label" className="grid grid-cols-2 gap-2">
            {(['expense', 'income'] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={type === option}
                disabled={editing}
                onClick={() => setValue('type', option, { shouldDirty: true })}
                className={cn(
                  'h-9 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-60',
                  type === option
                    ? option === 'income'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-rose-600 bg-rose-50 text-rose-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {option === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>
          {editing ? <p className="text-xs text-slate-500">Jenis kategori tidak dapat diubah setelah dibuat.</p> : null}
        </div>

        {serverError ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {serverError}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Batal
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}
