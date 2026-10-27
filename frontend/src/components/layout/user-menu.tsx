import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useUser } from '@/hooks/user-context'
import { DEFAULT_USER_ID } from '@/lib/env'
import { usersService } from '@/services/users'

export function UserSwitcherForm({ onDone }: { onDone: () => void }) {
  const { userId, setUserId, resetUserId } = useUser()
  const [value, setValue] = useState(String(userId))
  const parsed = Number(value)
  const valid = Number.isInteger(parsed) && parsed > 0

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!valid) return
        setUserId(parsed)
        onDone()
      }}
    >
      <Field
        label="ID pengguna"
        htmlFor="switch-user-id"
        error={valid ? undefined : 'Masukkan bilangan bulat positif'}
        hint="Aplikasi ini tidak memakai login. Data dipisahkan hanya berdasarkan ID pengguna."
      >
        <Input
          id="switch-user-id"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!valid}
        />
      </Field>
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            resetUserId()
            onDone()
          }}
        >
          Pakai ID bawaan ({DEFAULT_USER_ID})
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDone}>
            Batal
          </Button>
          <Button type="submit" disabled={!valid}>
            Simpan
          </Button>
        </div>
      </div>
    </form>
  )
}

export function UserMenu() {
  const { userId } = useUser()
  const [open, setOpen] = useState(false)
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersService.get(userId),
    retry: false,
  })

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="Ganti pengguna demo">
        <UserRound className="h-4 w-4" />
        <span className="max-w-40 truncate">{user ? user.name : `Pengguna #${userId}`}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">#{userId}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Ganti pengguna demo" description="Pilih ID pengguna yang datanya ingin dilihat.">
          <UserSwitcherForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
