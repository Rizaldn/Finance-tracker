import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { ErrorState } from '@/components/states'
import { Skeleton } from '@/components/ui/skeleton'

interface AsyncBoundaryProps<T> {
  query: UseQueryResult<T, Error>
  skeleton?: ReactNode
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  children: (data: T) => ReactNode
}

/**
 * Menyeragamkan tampilan loading, error (dengan tombol coba lagi), dan kosong
 * untuk satu query. Error tidak pernah ditelan diam-diam.
 */
export function AsyncBoundary<T>({ query, skeleton, isEmpty, empty, children }: AsyncBoundaryProps<T>) {
  if (query.isPending) {
    return <>{skeleton ?? <Skeleton className="h-32 w-full" />}</>
  }
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  }
  if (isEmpty?.(query.data)) {
    return <>{empty}</>
  }
  return <>{children(query.data)}</>
}
