import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { EmptyState } from '@/components/states'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={SearchX}
        title="Halaman tidak ditemukan"
        description="Alamat yang Anda buka tidak tersedia di aplikasi ini."
        action={
          <Link to="/" className={cn(buttonVariants({ variant: 'primary' }))}>
            Kembali ke Ringkasan
          </Link>
        }
      />
    </Card>
  )
}
