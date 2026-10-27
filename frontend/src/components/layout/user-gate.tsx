import { useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { UserPlus, UserRoundX } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState, EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/user-context'
import { ApiError, getErrorMessage } from '@/lib/api-client'
import { usersService } from '@/services/users'
import { UserSwitcherForm } from './user-menu'

function MissingUser({ userId }: { userId: number }) {
  const { setUserId } = useUser()
  const [switching, setSwitching] = useState(false)

  const create = useMutation({
    mutationFn: () =>
      usersService.create({
        name: 'Pengguna Demo',
        email: `demo-${Date.now()}@example.com`,
      }),
    onSuccess: (user) => {
      toast.success(`Pengguna demo dibuat (ID ${user.id}).`)
      setUserId(user.id)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <Card>
      <EmptyState
        icon={UserRoundX}
        title={`Pengguna dengan ID ${userId} tidak ditemukan`}
        description="Aplikasi membutuhkan satu pengguna demo di backend. Ganti ke ID pengguna yang sudah ada, atau buat pengguna demo baru (menambah satu baris data di database)."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setSwitching(true)}>
              Ganti ID pengguna
            </Button>
            <Button variant="accent" disabled={create.isPending} onClick={() => create.mutate()}>
              <UserPlus className="h-4 w-4" />
              {create.isPending ? 'Membuat…' : 'Buat pengguna demo'}
            </Button>
          </div>
        }
      />
      <Dialog open={switching} onOpenChange={setSwitching}>
        <DialogContent title="Ganti pengguna demo">
          <UserSwitcherForm onDone={() => setSwitching(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/** Memastikan pengguna demo ada di backend sebelum halaman lain dirender. */
export function UserGate({ children }: { children: ReactNode }) {
  const { userId } = useUser()
  const query = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersService.get(userId),
  })

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Memuat pengguna">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.kind === 'not_found') {
      return <MissingUser userId={userId} />
    }
    return (
      <Card>
        <ErrorState
          title="Tidak dapat memuat pengguna demo"
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      </Card>
    )
  }

  return <>{children}</>
}
