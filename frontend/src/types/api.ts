/**
 * Tipe ini disalin dari skema Pydantic backend (app/schemas.py).
 * Nilai uang dikirim backend sebagai string 2 desimal ("18000.00").
 */

export type TxType = 'income' | 'expense'

export interface Envelope<T> {
  message: string
  data: T
}

export interface PageMeta {
  total: number
  limit: number
  offset: number
}

export interface PagedEnvelope<T> {
  message: string
  data: T[]
  meta: PageMeta
}

export interface DeletedOut {
  id: number
}

export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface Wallet {
  id: number
  user_id: number
  name: string
  initial_balance: string
  created_at: string
}

export interface Category {
  id: number
  /** null = kategori bawaan */
  user_id: number | null
  name: string
  type: TxType
  is_default: boolean
  created_at: string
}

export interface Transaction {
  id: number
  user_id: number
  wallet_id: number
  category_id: number
  type: TxType
  amount: string
  /** YYYY-MM-DD */
  transaction_date: string
  note: string | null
  created_at: string
  updated_at: string
}

export interface Budget {
  id: number
  user_id: number
  category_id: number
  amount_limit: string
  /** Selalu tanggal 1, YYYY-MM-01 */
  budget_month: string
  created_at: string
  spent: string | null
  remaining: string | null
  /** Persen (0-100+), dihitung backend */
  percentage_used: number | null
}

export interface Summary {
  initial_balance: string
  total_income: string
  total_expense: string
  current_balance: string
  total_transactions: number
}

export interface CategorySpending {
  category_id: number
  category_name: string
  total_expense: string
  budget_limit: string | null
  percentage_used: number | null
}

export interface CategorySummary {
  /** YYYY-MM */
  month: string
  total_expense: string
  categories: CategorySpending[]
}

export interface ExportData {
  exported_at: string
  user: User
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
}

/** Bentuk satu transaksi pada payload impor (TransactionBase di backend). */
export interface ImportTransactionInput {
  wallet_id: number
  category_id: number
  type: TxType
  amount: number
  transaction_date?: string
  note?: string | null
}

export interface ImportPayload {
  user_id: number
  transactions: ImportTransactionInput[]
}

export interface ImportResult {
  imported: number
}
