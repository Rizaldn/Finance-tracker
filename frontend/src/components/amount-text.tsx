import { cn } from '@/lib/utils'
import { formatIDR } from '@/lib/format'
import type { TxType } from '@/types/api'

interface AmountTextProps {
  amount: string | number
  type: TxType
  className?: string
}

/** Nominal berwarna: hijau (+) untuk pemasukan, merah (−) untuk pengeluaran. */
export function AmountText({ amount, type, className }: AmountTextProps) {
  const income = type === 'income'
  return (
    <span
      className={cn(
        'font-medium tabular-nums',
        income ? 'text-emerald-600' : 'text-rose-600',
        className,
      )}
    >
      {income ? '+' : '−'}
      {formatIDR(amount)}
    </span>
  )
}
