import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import { UserProvider } from './hooks/user-context'
import { queryClient } from './lib/query-client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </UserProvider>
    </QueryClientProvider>
  </StrictMode>,
)
