// ─── src/main.jsx ─────────────────────────────────────────────────────────────
// Replace your existing main.jsx with this

import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter'
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
)
