import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider, type AuthConfig } from '@adolf94/ar-auth-client'

const authConfig: AuthConfig = {
  authority: (window as any).webConfig.authority,
  clientId: (window as any).webConfig.clientId,
  redirectUri: (window as any).webConfig.redirectUri,
  scope: 'openid profile email offline_access api://kuryente-api/user api://kuryente-api/admin',
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={authConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
