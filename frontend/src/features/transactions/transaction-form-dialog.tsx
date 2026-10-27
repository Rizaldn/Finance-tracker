import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormDialog } from '@/components/form-dialog'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Select, Textarea } from '@/components/ui/input'
import { useCategories, useInvalidateFinance, useWallets } from '@/hooks/queries'
import { useUser } from '@/hooks/user-context'
import { getErrorMessage } from '@/lib/api-client'
import { todayISO } from '@/lib/format'
import { moneyToInput, parseMoneyInput, positiveMoney } from '@/lib/money-input'
import { cn } from '@/lib/utils'
import { transactionsService, type TransactionInput } from '@/services/transactions'
import type { Transaction, TxType } from '@/types/api'

const schema = z.object({
  type: z.enum(['income', 'expense']),
  wallet_id: z.string().min(1, 'Pilih dompet'),
  category_id: z.string().min(1, 'Pilih kategori'),
  amount: positiveMoney,
  transaction_date: z.string().min(1, 'Tanggal wajib diisi'),
  note: z.string().trim().max(500, 'Maksimal 500 karakter'),
})

type FormValues = z.infer<typeof schema>

interface TransactionFormDialogProps {
  transaction?: Transaction
  defaultType?: TxType
  onClose: () => void
}

export function TransactionFormDialog({
  transaction,
  defaultType = 'expense',
  onClose,
}: TransactionFormDialogProps) {
  const { userId } = useUser()
  const invalidate = useInvalidateFinance()
  const walletsQuery = useWallets()
  const categoriesQuery = useCategories()
  const [serverError, setServerError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const editing = transaction !== undefined

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: transaction?.type ?? defaultType,
      wallet_id: transaction ? String(transaction.wallet_id) : '',
      category_id: transaction ? String(transaction.category_id) : '',
      amount: transaction ? moneyToInput(transaction.amount) : '',
      transaction_date: transaction?.transaction_date ?? todayISO(),
      note: transaction?.note ?? '',
    },
  })

  useEffect(() => setDirty(isDirty), [isDirty])

  const type = watch('type')
  const wallets = walletsQuery.data ?? []

  // Backend menolak kategori yang tipenya berbeda dari tipe transaksi,
  // jadi daftar kategori difilter sesuai tipe yang dipilih.
  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter((c) => c.type === type),
    [categoriesQuery.data, type],
  )

  // Bila tipe diganti dan kategori terpilih tidak cocok lagi, kosongkan pilihan.
  useEffect(() => {
    const selected = getValues('category_id')
    if (selected && !categories.some((c) => String(c.id) === selected) && categoriesQuery.data) {
      setValue('category_id', '', { shouldDirty: true })
    }
  }, [categories, categoriesQuery.data, getValues, setValue])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input: TransactionInput = {
        wallet_id: Number(values.wallet_id),
        category_id: Number(values.category_id),
        type: values.type,
        amount: parseMoneyInput(values.amount),
        transaction_date: values.transaction_date,
        note: values.note === '' ? null : values.note,
      }
      return transaction
        ? transactionsService.replace(transaction.id, input)
        : transactionsService.create(userId, input)
    },
    onSuccess: () => {
      toast.success(editing ? 'Transaksi diperbarui.' : 'Transaksi ditambahkan.')
      void invalidate()
      onClose()
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      setServerError(message)
      toast.error(message)
    },
  })

  const loadingRefs = walletsQuery.isPending || categoriesQuery.isPending
  const refsError = walletsQuery.isError || categoriesQuery.isError
  const noWallets = !loadingRefs && !refsError && wallets.length === 0

  return (
    <FormDialog
      onClose={onClose}
      dirty={dirty && !mutation.isSuccess}
      title={editing ? 'Edit transaksi' : 'Tambah transaksi'}
      description="Dompet dan kategori harus milik pengguna ini, dan jenis kategori harus sama dengan jenis transaksi."
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit((values) => {
          setServerError(null)
          mutation.mutate(values)
        })}
      >
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <div className="space-y-1.5">
              <span id="tx-type-label" className="text-sm font-medium text-slate-700">
                Jenis
              </span>
              <div role="radiogroup" aria-labelledby="tx-type-label" className="grid grid-cols-2 gap-2">
                {(['expense', 'income'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={field.value === option}
                    onClick={() => field.onChange(option)}
                    className={cn(
                      'h-9 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600',
                      field.value === option
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
            </div>
          )}
        />

        {refsError ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Daftar dompet atau kategori gagal dimuat.{' '}
            <button
              type="button"
              className="font-medium underline"
              onClick={() => {
                void walletsQuery.refetch()
                void categoriesQuery.refetch()
              }}
            >
              Coba lagi
            </button>
          </p>
        ) : null}

        {noWallets ? (
          <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Anda belum punya dompet. Buat dompet lebih dulu di menu Dompet.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dompet" htmlFor="tx-wallet" error={errors.wallet_id?.message}>
            <Select id="tx-wallet" disabled={loadingRefs} aria-invalid={!!errors.wallet_id} {...register('wallet_id')}>
              <option value="">{loadingRefs ? 'Memuat…' : 'Pilih dompet'}</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kategori" htmlFor="tx-category" error={errors.category_id?.message}>
            <Select id="tx-category" disabled={loadingRefs} aria-invalid={!!errors.category_id} {...register('category_id')}>
              <option value="">{loadingRefs ? 'Memuat…' : 'Pilih kategori'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nominal (IDR)" htmlFor="tx-amount" error={errors.amount?.message}>
            <Input id="tx-amount" inputMode="decimal" placeholder="18000" aria-invalid={!!errors.amount} {...register('amount')} />
          </Field>
          <Field label="Tanggal" htmlFor="tx-date" error={errors.transaction_date?.message}>
            <Input id="tx-date" type="date" aria-invalid={!!errors.transaction_date} {...register('transaction_date')} />
          </Field>
        </div>

        <Field label="Catatan (opsional)" htmlFor="tx-note" error={errors.note?.message}>
          <Textarea id="tx-note" rows={2} placeholder="Mis. Makan siang" aria-invalid={!!errors.note} {...register('note')} />
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
          <Button type="submit" disabled={mutation.isPending || loadingRefs || noWallets}>
            {mutation.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}
