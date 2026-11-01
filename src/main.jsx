import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/cazatesoros.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { LanguageProvider } from './i18n'

// Vista previa del tema Cazatesoros: solo en desarrollo, con ?cazatesoros=1.
if (import.meta.env.DEV && new URLSearchParams(location.search).get('cazatesoros') === '1') {
  document.documentElement.classList.add('theme-cazatesoros')
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
