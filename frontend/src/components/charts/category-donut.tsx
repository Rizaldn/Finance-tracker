import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_PALETTE } from '@/lib/category-style'
import { formatIDR, formatPercent } from '@/lib/format'
import type { CategorySpending } from '@/types/api'

/**
 * Donat pengeluaran per kategori beserta legenda.
 * Persentase di legenda adalah porsi terhadap total pengeluaran bulan itu
 * (bukan pemakaian anggaran).
 */
export function CategoryDonut({ categories }: { categories: CategorySpending[] }) {
  const data = categories.map((c) => ({ name: c.category_name, value: Number(c.total_expense) }))
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div
        className="h-48 w-48 shrink-0"
        role="img"
        aria-label={`Donat pengeluaran per kategori. ${data
          .map((d) => `${d.name} ${formatIDR(d.value)}`)
          .join(', ')}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={84}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatIDR(Number(value))}
              contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }}
              />
              <span className="truncate text-slate-700">{entry.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-900">
              {formatIDR(entry.value)}
              <span className="ml-2 text-xs text-slate-400">
                {formatPercent(total > 0 ? (entry.value / total) * 100 : 0)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
