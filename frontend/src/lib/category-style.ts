import {
  Bus,
  Coins,
  Film,
  GraduationCap,
  Tag,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from '@/types/api'

const ICONS: Record<string, LucideIcon> = {
  makanan: Utensils,
  transportasi: Bus,
  kuliah: GraduationCap,
  hiburan: Film,
  'gaji / uang saku': Wallet,
  'pendapatan lain': Coins,
}

const EXPENSE_ACCENTS = [
  'bg-rose-50 text-rose-600',
  'bg-orange-50 text-orange-600',
  'bg-amber-50 text-amber-600',
  'bg-violet-50 text-violet-600',
  'bg-sky-50 text-sky-600',
  'bg-pink-50 text-pink-600',
]

const INCOME_ACCENT = 'bg-emerald-50 text-emerald-600'

/** Ikon dan warna aksen kategori. Pemasukan selalu hijau, pengeluaran bervariasi. */
export function categoryStyle(category: Pick<Category, 'id' | 'name' | 'type'>) {
  const Icon = ICONS[category.name.trim().toLowerCase()] ?? Tag
  const accent =
    category.type === 'income'
      ? INCOME_ACCENT
      : EXPENSE_ACCENTS[category.id % EXPENSE_ACCENTS.length]
  return { Icon, accent }
}

/** Warna seri untuk grafik donat pengeluaran per kategori. */
export const CHART_PALETTE = [
  '#e11d48',
  '#f97316',
  '#eab308',
  '#8b5cf6',
  '#0ea5e9',
  '#14b8a6',
  '#64748b',
  '#ec4899',
]

export const INCOME_COLOR = '#059669'
export const EXPENSE_COLOR = '#e11d48'
