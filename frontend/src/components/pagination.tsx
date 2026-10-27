import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PageMeta } from '@/types/api'

interface PaginationProps {
  meta: PageMeta
  /** Dipanggil dengan offset baru. */
  onChange: (offset: number) => void
  disabled?: boolean
}

export function Pagination({ meta, onChange, disabled }: PaginationProps) {
  const { total, limit, offset } = meta
  if (total === 0) return null
  const from = offset + 1
  const to = Math.min(offset + limit, total)
  const hasPrev = offset > 0
  const hasNext = offset + limit < total

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
      <p className="text-xs text-slate-500">
        Menampilkan <span className="font-medium text-slate-700">{from}–{to}</span> dari{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev || disabled}
          onClick={() => onChange(Math.max(0, offset - limit))}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || disabled}
          onClick={() => onChange(offset + limit)}
        >
          Berikutnya
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
