// ─── src/main.jsx ─────────────────────────────────────────────────────────────
import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter'
import { AuthProvider } from './context/AuthContext'
import { supabase } from './lib/supabase'
import { loadPricing } from './config'

// Load live pricing from DB before rendering
// Falls back to config.js defaults if DB unavailable
loadPricing(supabase).then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </React.StrictMode>
  )
})
