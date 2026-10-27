import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { currentMonth, formatMonth, shiftMonth } from '@/lib/format'

interface MonthPickerProps {
  /** YYYY-MM */
  value: string
  onChange: (month: string) => void
}

/** Pemilih bulan berbasis tombol (konsisten di semua browser). */
export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const isCurrent = value === currentMonth()
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Bulan sebelumnya"
        onClick={() => onChange(shiftMonth(value, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-32 px-1 text-center text-sm font-medium text-slate-900" aria-live="polite">
        {formatMonth(value)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Bulan berikutnya"
        onClick={() => onChange(shiftMonth(value, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrent ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(currentMonth())}>
          Bulan ini
        </Button>
      ) : null}
    </div>
  )
}
