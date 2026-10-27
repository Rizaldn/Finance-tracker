import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { TxType } from '@/types/api'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-slate-100 text-slate-700',
        income: 'bg-emerald-50 text-emerald-700',
        expense: 'bg-rose-50 text-rose-700',
        warning: 'bg-amber-50 text-amber-700',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export function TypeBadge({ type }: { type: TxType }) {
  return type === 'income' ? (
    <Badge tone="income">Pemasukan</Badge>
  ) : (
    <Badge tone="expense">Pengeluaran</Badge>
  )
}
