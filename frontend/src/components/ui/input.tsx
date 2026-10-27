import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const base =
  'w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:ring-rose-500/20'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, 'h-9', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(base, 'h-9 pr-8', className)} {...props}>
      {children}
    </select>
  ),
)
Select.displayName = 'Select'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, 'min-h-20 py-2', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'
