import type { ReactNode } from 'react'
import { FilterX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import type { Category, Wallet } from '@/types/api'

export interface FilterState {
  type: '' | 'income' | 'expense'
  walletId: string
  categoryId: string
  startDate: string
  endDate: string
}

export const EMPTY_FILTERS: FilterState = {
  type: '',
  walletId: '',
  categoryId: '',
  startDate: '',
  endDate: '',
}

export function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some((v) => v !== '')
}

interface TransactionFiltersProps {
  value: FilterState
  onChange: (next: FilterState) => void
  wallets: Wallet[]
  categories: Category[]
}

function Labeled({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-slate-500">
        {label}
      </label>
      {children}
    </div>
  )
}

export function TransactionFilters({ value, onChange, wallets, categories }: TransactionFiltersProps) {
  const invalidRange = value.startDate !== '' && value.endDate !== '' && value.startDate > value.endDate
  // Kategori difilter menurut jenis yang dipilih agar kombinasi selalu masuk akal.
  const visibleCategories = value.type ? categories.filter((c) => c.type === value.type) : categories

  function patch(partial: Partial<FilterState>) {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="space-y-3 border-b border-slate-100 p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Labeled label="Jenis" htmlFor="f-type">
          <Select
            id="f-type"
            value={value.type}
            onChange={(e) => {
              const type = e.target.value as FilterState['type']
              const stillValid =
                value.categoryId === '' ||
                type === '' ||
                categories.some((c) => String(c.id) === value.categoryId && c.type === type)
              patch({ type, categoryId: stillValid ? value.categoryId : '' })
            }}
          >
            <option value="">Semua jenis</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </Select>
        </Labeled>
        <Labeled label="Dompet" htmlFor="f-wallet">
          <Select id="f-wallet" value={value.walletId} onChange={(e) => patch({ walletId: e.target.value })}>
            <option value="">Semua dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Labeled>
        <Labeled label="Kategori" htmlFor="f-category">
          <Select id="f-category" value={value.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
            <option value="">Semua kategori</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Labeled>
        <Labeled label="Dari tanggal" htmlFor="f-start">
          <Input id="f-start" type="date" value={value.startDate} max={value.endDate || undefined} onChange={(e) => patch({ startDate: e.target.value })} />
        </Labeled>
        <Labeled label="Sampai tanggal" htmlFor="f-end">
          <Input id="f-end" type="date" value={value.endDate} min={value.startDate || undefined} onChange={(e) => patch({ endDate: e.target.value })} />
        </Labeled>
      </div>
      <div className="flex items-center justify-between gap-3">
        {invalidRange ? (
          <p role="alert" className="text-xs text-rose-600">
            Tanggal awal tidak boleh setelah tanggal akhir.
          </p>
        ) : (
          <span />
        )}
        {hasActiveFilters(value) ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
            <FilterX className="h-3.5 w-3.5" />
            Reset filter
          </Button>
        ) : null}
      </div>
    </div>
  )
}
