import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EXPENSE_COLOR, INCOME_COLOR } from '@/lib/category-style'
import type { MonthlyFlow } from '@/lib/aggregate'
import { formatCompactIDR, formatIDR } from '@/lib/format'

/** Grafik batang pemasukan vs pengeluaran per bulan. */
export function CashflowChart({ data }: { data: MonthlyFlow[] }) {
  const summary = data
    .map((d) => `${d.label}: pemasukan ${formatIDR(d.income)}, pengeluaran ${formatIDR(d.expense)}`)
    .join('; ')

  return (
    <div className="h-64 w-full" role="img" aria-label={`Grafik pemasukan dan pengeluaran per bulan. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value: number) => formatCompactIDR(value)}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            formatter={(value) => formatIDR(Number(value))}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Pemasukan" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Pengeluaran" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
