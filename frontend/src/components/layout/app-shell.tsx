import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  ArrowDownUp,
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Tags,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UserGate } from './user-gate'
import { UserMenu } from './user-menu'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Ringkasan', icon: LayoutDashboard, end: true },
  { to: '/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
  { to: '/dompet', label: 'Dompet', icon: Wallet },
  { to: '/kategori', label: 'Kategori', icon: Tags },
  { to: '/anggaran', label: 'Anggaran', icon: PiggyBank },
  { to: '/laporan', label: 'Laporan', icon: BarChart3 },
  { to: '/ekspor-impor', label: 'Ekspor & Impor', icon: ArrowDownUp },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-emerald-400">
          <TrendingUp className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-slate-900">Finance Tracker</span>
      </div>
      <nav aria-label="Navigasi utama" className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <p className="px-5 pb-5 text-xs leading-relaxed text-slate-400">
        Versi demo tanpa autentikasi. Gunakan data uji.
      </p>
    </div>
  )
}

function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-xl focus:outline-none lg:hidden"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Menu navigasi</DialogPrimitive.Title>
          <SidebarContent onNavigate={() => onOpenChange(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Buka menu navigasi"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <UserMenu />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          <UserGate>
            <Outlet />
          </UserGate>
        </main>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </div>
  )
}
