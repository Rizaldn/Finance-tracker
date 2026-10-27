import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  icon: LucideIcon
  tone?: 'neutral' | 'income' | 'expense'
  /** null/undefined saat data belum tersedia */
  value?: ReactNode
  loading?: boolean
  footer?: ReactNode
}

const iconTone = {
  neutral: 'bg-slate-100 text-slate-600',
  income: 'bg-emerald-50 text-emerald-600',
  expense: 'bg-rose-50 text-rose-600',
} as const

export function StatCard({ title, icon: Icon, tone = 'neutral', value, loading, footer }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={cn('rounded-lg p-2', iconTone[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {loading ? <Skeleton className="h-8 w-36" /> : (value ?? '—')}
      </div>
      {footer ? <div className="mt-2 text-xs text-slate-500">{footer}</div> : null}
    </Card>
  )
}
