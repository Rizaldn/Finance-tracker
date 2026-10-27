import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
}

/** Dialog konfirmasi seragam untuk semua aksi hapus / berisiko. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-slate-900/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl focus:outline-none">
          <AlertDialog.Title className="text-lg font-semibold text-slate-900">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-slate-600">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={loading}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button variant={destructive ? 'danger' : 'primary'} disabled={loading} onClick={onConfirm}>
              {loading ? 'Memproses…' : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
