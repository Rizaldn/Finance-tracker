/**
 * Konfigurasi runtime dari environment Vite.
 *
 * Prefix `/api/v1` didefinisikan HANYA di sini (API_PREFIX) dan digabung
 * satu kali di `api-client.ts`. Jangan menulis `/api/v1` di tempat lain.
 */

const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')

/** Kosong = same-origin (lewat proxy Vite / rewrites Vercel). */
export const API_BASE_URL = rawBase

export const API_PREFIX = '/api/v1'

const rawUserId = Number(import.meta.env.VITE_DEMO_USER_ID)

/** ID pengguna demo awal. Bisa diganti dari UI (disimpan di localStorage). */
export const DEFAULT_USER_ID =
  Number.isInteger(rawUserId) && rawUserId > 0 ? rawUserId : 16
