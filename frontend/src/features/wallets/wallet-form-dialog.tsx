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
import { useUser } from '@/hooks/user-context'
import { useInvalidateFinance } from '@/hooks/queries'
import { getErrorMessage } from '@/lib/api-client'
import { moneyToInput, nonNegativeMoney, parseMoneyInput } from '@/lib/money-input'
import { walletsService } from '@/services/wallets'
import type { Wallet } from '@/types/api'

const schema = z.object({
  name: z.string().trim().min(1, 'Nama dompet wajib diisi').max(100, 'Maksimal 100 karakter'),
  initial_balance: nonNegativeMoney,
})

type FormValues = z.infer<typeof schema>

interface WalletFormDialogProps {
  wallet?: Wallet
  onClose: () => void
}

export function WalletFormDialog({ wallet, onClose }: WalletFormDialogProps) {
  const { userId } = useUser()
  const invalidate = useInvalidateFinance()
  const [serverError, setServerError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: wallet?.name ?? '',
      initial_balance: wallet ? moneyToInput(wallet.initial_balance) : '0',
    },
  })

  useEffect(() => setDirty(isDirty), [isDirty])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input = { name: values.name, initial_balance: parseMoneyInput(values.initial_balance) }
      return wallet ? walletsService.update(wallet.id, input) : walletsService.create(userId, input)
    },
    onSuccess: () => {
      toast.success(wallet ? 'Dompet diperbarui.' : 'Dompet dibuat.')
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
      title={wallet ? 'Edit dompet' : 'Tambah dompet'}
      description={wallet ? 'Ubah nama atau saldo awal dompet.' : 'Buat dompet baru, misalnya Tunai atau Rekening Bank.'}
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit((values) => {
          setServerError(null)
          mutation.mutate(values)
        })}
      >
        <Field label="Nama dompet" htmlFor="wallet-name" error={errors.name?.message}>
          <Input id="wallet-name" autoFocus aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field
          label="Saldo awal (IDR)"
          htmlFor="wallet-initial"
          error={errors.initial_balance?.message}
          hint="Saldo sebelum transaksi pertama. Tidak boleh negatif."
        >
          <Input
            id="wallet-initial"
            inputMode="decimal"
            aria-invalid={!!errors.initial_balance}
            {...register('initial_balance')}
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
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </FormDialog>
  )
}
