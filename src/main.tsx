import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { AuthProvider } from './features/auth/AuthProvider'
import { PwaInstallProvider } from './hooks/usePwaInstall'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaInstallProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </PwaInstallProvider>
  </StrictMode>,
)
