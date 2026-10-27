import { z } from 'zod'
import type { ImportTransactionInput } from '@/types/api'

/**
 * Format impor yang didukung backend (POST /api/v1/import):
 *   { "user_id": number, "transactions": [ {wallet_id, category_id, type, amount, transaction_date?, note?} ] }
 * Berkas hasil ekspor (GET /api/v1/export) juga diterima: bagian `transactions`-nya dipakai
 * dan field tambahan (id, user_id, created_at, ...) dibuang. `user_id` selalu diganti dengan
 * pengguna aktif di aplikasi.
 */
export const MAX_IMPORT = 500

const rowSchema = z.object({
  wallet_id: z.number().int().min(1, 'wallet_id harus bilangan bulat ≥ 1'),
  category_id: z.number().int().min(1, 'category_id harus bilangan bulat ≥ 1'),
  type: z.enum(['income', 'expense'], { message: "type harus 'income' atau 'expense'" }),
  amount: z.preprocess(
    (v) => (typeof v === 'string' ? Number(v) : v),
    z
      .number({ message: 'amount harus berupa angka' })
      .gt(0, 'amount harus lebih dari 0')
      .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, 'amount maksimal 2 desimal'),
  ),
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'transaction_date harus berformat YYYY-MM-DD')
    .optional(),
  note: z.string().max(500, 'note maksimal 500 karakter').nullable().optional(),
})

const fileSchema = z.object({
  transactions: z.array(z.unknown()).min(1, 'Berkas tidak berisi transaksi').max(MAX_IMPORT, `Maksimal ${MAX_IMPORT} transaksi per impor`),
})

export interface ParsedImport {
  transactions: ImportTransactionInput[]
}

export type ParseResult =
  | { ok: true; value: ParsedImport }
  | { ok: false; errors: string[] }

/** Menjelaskan seluruh masalah (maks. 10) agar pengguna bisa memperbaiki berkas sekaligus. */
export function parseImportText(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['Berkas bukan JSON yang valid.'] }
  }

  // Hasil ekspor dibungkus {message, data: {...}}
  const root =
    typeof raw === 'object' && raw !== null && 'data' in raw && typeof (raw as { data: unknown }).data === 'object'
      ? (raw as { data: unknown }).data
      : raw

  const file = fileSchema.safeParse(root)
  if (!file.success) {
    const missing = typeof root !== 'object' || root === null || !('transactions' in root)
    return {
      ok: false,
      errors: missing
        ? ['Berkas harus berisi daftar "transactions" (format impor atau hasil ekspor aplikasi ini).']
        : file.error.issues.map((i) => i.message),
    }
  }

  const errors: string[] = []
  const transactions: ImportTransactionInput[] = []
  file.data.transactions.forEach((item, index) => {
    const parsed = rowSchema.safeParse(item)
    if (parsed.success) {
      const { wallet_id, category_id, type, amount, transaction_date, note } = parsed.data
      transactions.push({
        wallet_id,
        category_id,
        type,
        amount,
        ...(transaction_date ? { transaction_date } : {}),
        ...(note !== undefined ? { note } : {}),
      })
    } else {
      for (const issue of parsed.error.issues) {
        errors.push(`transactions[${index}]: ${issue.message}`)
      }
    }
  })

  if (errors.length > 0) {
    const shown = errors.slice(0, 10)
    if (errors.length > shown.length) shown.push(`…dan ${errors.length - shown.length} masalah lain.`)
    return { ok: false, errors: shown }
  }
  return { ok: true, value: { transactions } }
}
