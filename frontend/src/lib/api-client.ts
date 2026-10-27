import { API_BASE_URL, API_PREFIX } from './env'

export type ApiErrorKind =
  | 'network'
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'unavailable'
  | 'server'
  | 'unknown'

function kindFor(status: number): ApiErrorKind {
  if (status === 0) return 'network'
  if (status === 400 || status === 422) return 'validation'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 502 || status === 503 || status === 504) return 'unavailable'
  if (status >= 500) return 'server'
  return 'unknown'
}

/** Error dari API. `message` adalah pesan yang aman ditampilkan ke pengguna. */
export class ApiError extends Error {
  readonly status: number
  readonly kind: ApiErrorKind

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kindFor(status)
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Terjadi kesalahan yang tidak diketahui.'
}

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: QueryParams
  body?: unknown
  signal?: AbortSignal
}

/** Parameter opsional yang kosong dibuang, bukan dikirim sebagai string kosong. */
function buildUrl(path: string, query?: QueryParams): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  const url = `${API_BASE_URL}${API_PREFIX}${path}`
  return qs ? `${url}?${qs}` : url
}

function isErrorBody(payload: unknown): payload is { error: string } {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof (payload as { error: unknown }).error === 'string'
  )
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options
  const hasBody = body !== undefined

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: hasBody
        ? { 'Content-Type': 'application/json', Accept: 'application/json' }
        : { Accept: 'application/json' },
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(
      'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.',
      0,
    )
  }

  let payload: unknown = null
  const text = await response.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    if (isErrorBody(payload)) throw new ApiError(payload.error, response.status)
    const fallback =
      response.status === 503 || response.status === 502 || response.status === 504
        ? 'Layanan sedang tidak tersedia. Coba lagi beberapa saat lagi.'
        : `Permintaan gagal (HTTP ${response.status}).`
    throw new ApiError(fallback, response.status)
  }

  if (payload === null) {
    throw new ApiError('Respons server tidak valid (bukan JSON).', response.status)
  }
  return payload as T
}
