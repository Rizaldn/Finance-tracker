import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root

interface DialogContentProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function DialogContent({ title, description, children, className }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl focus:outline-none',
          className,
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-lg font-semibold text-slate-900">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className={description ? 'mt-1 text-sm text-slate-500' : 'sr-only'}
            >
              {description ?? title}
            </DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close
            aria-label="Tutup"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
