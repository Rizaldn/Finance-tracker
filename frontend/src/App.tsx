import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { BudgetsPage } from '@/features/budgets/budgets-page'
import { CategoriesPage } from '@/features/categories/categories-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { DataIoPage } from '@/features/data-io/data-io-page'
import { ReportsPage } from '@/features/reports/reports-page'
import { TransactionsPage } from '@/features/transactions/transactions-page'
import { WalletsPage } from '@/features/wallets/wallets-page'
import { NotFoundPage } from '@/pages/not-found-page'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="transaksi" element={<TransactionsPage />} />
        <Route path="dompet" element={<WalletsPage />} />
        <Route path="kategori" element={<CategoriesPage />} />
        <Route path="anggaran" element={<BudgetsPage />} />
        <Route path="laporan" element={<ReportsPage />} />
        <Route path="ekspor-impor" element={<DataIoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
