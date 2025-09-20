import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import { createRouter, RouterProvider } from '@tanstack/react-router'
import { AuthContextProvider } from './components/GoogleLoginWrapper.tsx'



createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <AuthContextProvider>
          <App />
        </AuthContextProvider>
  </StrictMode>,
)
