import { cn } from '@/lib/utils'

export type BudgetTone = 'ok' | 'warning' | 'over' | 'neutral'

/** Status anggaran berdasarkan persentase yang dihitung backend. */
export function budgetTone(percentage: number | null | undefined): BudgetTone {
  if (percentage === null || percentage === undefined) return 'neutral'
  if (percentage > 100) return 'over'
  if (percentage >= 80) return 'warning'
  return 'ok'
}

const toneClass: Record<BudgetTone, string> = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  over: 'bg-rose-500',
  neutral: 'bg-slate-300',
}

interface ProgressBarProps {
  /** Persen; nilai di atas 100 tetap ditampilkan penuh. */
  value: number | null | undefined
  tone?: BudgetTone
  label: string
}

export function ProgressBar({ value, tone, label }: ProgressBarProps) {
  const pct = value ?? 0
  const resolved = tone ?? budgetTone(value)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(Math.round(pct), 100)}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
    >
      <div
        className={cn('h-full rounded-full transition-all', toneClass[resolved])}
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
      />
    </div>
  )
}
