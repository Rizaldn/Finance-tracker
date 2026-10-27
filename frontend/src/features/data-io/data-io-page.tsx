import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Download, FileJson, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { useInvalidateFinance } from '@/hooks/queries'
import { useUser } from '@/hooks/user-context'
import { getErrorMessage } from '@/lib/api-client'
import { dataIoService } from '@/services/data-io'
import { MAX_IMPORT, parseImportText, type ParsedImport } from './import-schema'

const MAX_FILE_BYTES = 2 * 1024 * 1024

export function DataIoPage() {
  const { userId } = useUser()
  const invalidate = useInvalidateFinance()
  const inputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedImport | null>(null)
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [imported, setImported] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)

  const exportMutation = useMutation({
    mutationFn: () => dataIoService.exportData(userId),
    onSuccess: (payload) => {
      // File unduhan = isi respons API apa adanya.
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `finance-export-user-${userId}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('Data berhasil diekspor.')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const importMutation = useMutation({
    mutationFn: (value: ParsedImport) =>
      dataIoService.importTransactions({ user_id: userId, transactions: value.transactions }),
    onSuccess: (result) => {
      setImported(result.imported)
      setServerError(null)
      setConfirming(false)
      toast.success(`${result.imported} transaksi berhasil diimpor.`)
      void invalidate()
      resetFile()
    },
    onError: (error) => {
      // Mis. 400 "transactions[3]: wallet_id tidak ditemukan untuk pengguna ini"; tidak ada yang tersimpan.
      setServerError(getErrorMessage(error))
      setConfirming(false)
    },
  })

  function resetFile() {
    setFileName(null)
    setParsed(null)
    setFileErrors([])
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setImported(null)
    setServerError(null)
    if (!file) return
    setFileName(file.name)
    setParsed(null)

    if (file.size > MAX_FILE_BYTES) {
      setFileErrors(['Ukuran berkas terlalu besar (maks. 2 MB).'])
      return
    }
    const result = parseImportText(await file.text())
    if (result.ok) {
      setParsed(result.value)
      setFileErrors([])
    } else {
      setFileErrors(result.errors)
    }
  }

  return (
    <>
      <PageHeader title="Ekspor & Impor" description="Cadangkan data Anda ke berkas JSON atau impor transaksi dari berkas JSON." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Ekspor data" description="Unduh cadangan seluruh data pengguna aktif." />
          <CardBody className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-600">
              Berkas berisi profil pengguna, dompet, kategori milik Anda (bukan kategori bawaan), seluruh transaksi, dan anggaran,
              langsung dari server.
            </p>
            <Button variant="accent" disabled={exportMutation.isPending} onClick={() => exportMutation.mutate()}>
              <Download className="h-4 w-4" />
              {exportMutation.isPending ? 'Menyiapkan…' : 'Unduh berkas JSON'}
            </Button>
            {exportMutation.isError ? (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {getErrorMessage(exportMutation.error)}
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Impor transaksi" description={`Maksimal ${MAX_IMPORT} transaksi per berkas.`} />
          <CardBody className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              <p className="font-medium text-slate-700">Format yang didukung</p>
              <p className="mt-1">
                JSON dengan daftar <code className="rounded bg-white px-1">transactions</code>. Tiap item memuat{' '}
                <code className="rounded bg-white px-1">wallet_id</code>, <code className="rounded bg-white px-1">category_id</code>,{' '}
                <code className="rounded bg-white px-1">type</code>, <code className="rounded bg-white px-1">amount</code>, serta
                opsional <code className="rounded bg-white px-1">transaction_date</code> dan <code className="rounded bg-white px-1">note</code>.
                Berkas hasil ekspor aplikasi ini juga diterima. CSV tidak didukung.
              </p>
              <p className="mt-1">
                Dompet dan kategori harus sudah ada dan milik pengguna aktif. Jika satu baris gagal, seluruh impor dibatalkan.
              </p>
            </div>

            <div>
              <label
                htmlFor="import-file"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-600 transition-colors hover:bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-600"
              >
                <FileJson className="h-6 w-6 text-slate-400" />
                <span className="font-medium text-slate-900">{fileName ?? 'Pilih berkas .json'}</span>
                <span className="text-xs text-slate-500">Klik untuk memilih berkas</span>
                <input id="import-file" ref={inputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void handleFile(e)} />
              </label>
            </div>

            {fileErrors.length > 0 ? (
              <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Berkas tidak dapat diimpor
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-6 text-xs">
                  {fileErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {parsed ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Berkas valid: <strong>{parsed.transactions.length}</strong> transaksi siap diimpor ke pengguna #{userId}.
              </p>
            ) : null}

            {serverError ? (
              <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <p className="font-medium">Server menolak impor (tidak ada data yang tersimpan)</p>
                <p className="mt-0.5 text-xs">{serverError}</p>
              </div>
            ) : null}

            {imported !== null ? (
              <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                {imported} transaksi berhasil diimpor.
              </p>
            ) : null}

            <Button disabled={!parsed || importMutation.isPending} onClick={() => setConfirming(true)}>
              <Upload className="h-4 w-4" />
              Impor transaksi
            </Button>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Impor ${parsed?.transactions.length ?? 0} transaksi?`}
        description={`Transaksi akan ditambahkan ke pengguna #${userId}. Backend tidak mendeteksi duplikat, jadi mengimpor berkas yang sama dua kali (termasuk berkas hasil ekspor akun ini) akan menggandakan transaksi dan mengubah saldo.`}
        confirmLabel="Ya, impor"
        loading={importMutation.isPending}
        onConfirm={() => parsed && importMutation.mutate(parsed)}
      />
    </>
  )
}
