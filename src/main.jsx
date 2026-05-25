// ─── src/main.jsx ─────────────────────────────────────────────────────────────
import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter'
import { AuthProvider } from './context/AuthContext'

// AuthContext now handles live pricing via React state
// No need to loadPricing before render — it fetches and updates reactively

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
)
