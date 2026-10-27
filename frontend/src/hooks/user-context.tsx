import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_USER_ID } from '@/lib/env'

const STORAGE_KEY = 'finance.demoUserId'

function readStoredUserId(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isInteger(stored) && stored > 0 ? stored : DEFAULT_USER_ID
  } catch {
    return DEFAULT_USER_ID
  }
}

interface UserContextValue {
  userId: number
  setUserId: (id: number) => void
  resetUserId: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

/**
 * Aplikasi demo tanpa autentikasi: identitas pengguna = `user_id`.
 * Nilai awal dari VITE_DEMO_USER_ID, bisa diganti dari UI tanpa mengubah kode.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number>(readStoredUserId)

  const setUserId = useCallback((id: number) => {
    setUserIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, String(id))
    } catch {
      /* penyimpanan tidak tersedia: nilai tetap berlaku selama sesi */
    }
  }, [])

  const resetUserId = useCallback(() => {
    setUserIdState(DEFAULT_USER_ID)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* diabaikan */
    }
  }, [])

  const value = useMemo(() => ({ userId, setUserId, resetUserId }), [userId, setUserId, resetUserId])
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser harus dipakai di dalam <UserProvider>')
  return ctx
}
