import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Backend tidak mengirim header CORS, jadi browser tidak boleh memanggilnya
// langsung dari origin lain. Saat development dan `vite preview`, request ke
// /api diteruskan (proxy) oleh Vite ke backend. Di produksi, vercel.json
// melakukan hal yang sama lewat rewrites.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_PROXY_TARGET || 'https://finance-tracker-rizall.vercel.app'
  const proxy = {
    '/api': { target, changeOrigin: true, secure: true },
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { proxy },
    preview: { proxy },
  }
})
