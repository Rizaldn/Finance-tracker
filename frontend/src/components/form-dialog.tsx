import { useState, type ReactNode } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface FormDialogProps {
  onClose: () => void
  title: string
  description?: string
  /** true bila form berisi perubahan yang belum disimpan */
  dirty: boolean
  children: ReactNode
}

/**
 * Dialog untuk form. Bila ada perubahan yang belum disimpan, menutup dialog
 * (Esc, klik di luar, tombol tutup) meminta konfirmasi lebih dulu.
 * Komponen ini selalu dalam keadaan terbuka; induk yang memasang/melepasnya.
 */
export function FormDialog({ onClose, title, description, dirty, children }: FormDialogProps) {
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)

  function handleOpenChange(next: boolean) {
    if (next) return
    if (dirty) setConfirmingDiscard(true)
    else onClose()
  }

  return (
    <>
      <Dialog open onOpenChange={handleOpenChange}>
        <DialogContent title={title} description={description}>
          {children}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmingDiscard}
        onOpenChange={setConfirmingDiscard}
        title="Buang perubahan?"
        description="Perubahan yang belum disimpan akan hilang."
        confirmLabel="Buang perubahan"
        cancelLabel="Lanjut mengedit"
        destructive
        onConfirm={() => {
          setConfirmingDiscard(false)
          onClose()
        }}
      />
    </>
  )
}
