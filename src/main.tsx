import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { QueryProvider } from './app/providers/query-provider/QueryProvider'
import { ThemeProvider } from './app/providers/theme-provider/ThemeProvider'
import { ShikiProvider } from './shared/lib/shiki/ShikiProvider'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <ThemeProvider>
        <ShikiProvider>
          <App />
        </ShikiProvider>
      </ThemeProvider>
    </QueryProvider>
  </React.StrictMode>,
)
