import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element was not found')
}

const app = <StrictMode><App /></StrictMode>

if (rootElement.hasAttribute('data-prerendered')) {
  hydrateRoot(rootElement, app)
} else {
  createRoot(rootElement).render(app)
}
