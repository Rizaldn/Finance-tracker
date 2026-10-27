import type { ComponentType, ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getErrorMessage } from '@/lib/api-client'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ComponentType<{ className?: string }>
  action?: ReactNode
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-500">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  title?: string
}

export function ErrorState({ error, onRetry, title = 'Data gagal dimuat' }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-rose-50 p-3 text-rose-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{getErrorMessage(error)}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Coba lagi
        </Button>
      ) : null}
    </div>
  )
}

/** Pembungkus kartu untuk state yang berdiri sendiri. */
export function StateCard({ children }: { children: ReactNode }) {
  return <Card>{children}</Card>
}
