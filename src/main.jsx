import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/cazatesoros.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { LanguageProvider } from './i18n'
import { applyCazatesorosTheme, resolveCazatesorosState, CAZATESOROS_STORAGE_KEY } from './config/cazatesoros'
import { safeStorage } from './utils/safeStorage'

// Vista previa del tema Cazatesoros: activa por defecto en desarrollo; ?cazatesoros=0 la apaga.
// En produccion nunca se aplica. El arranque de index.html ya la enciende antes del primer
// pintado; esto mantiene el mismo estado cuando el bundle corre fuera de un host local.
if (import.meta.env.DEV) {
  let storedOverride = null
  try {
    storedOverride = safeStorage.getItem(CAZATESOROS_STORAGE_KEY)
  } catch {
    storedOverride = null
  }
  applyCazatesorosTheme(resolveCazatesorosState({
    isDev: true,
    search: location.search,
    storedOverride
  }))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
)
