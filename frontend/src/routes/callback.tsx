import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@adolf94/ar-auth-client'

const CallbackComponent = () => {
    const { isAuthenticated, isLoading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                navigate({ to: '/user' })
            } else {
                navigate({ to: '/' })
            }
        }
    }, [isAuthenticated, isLoading, navigate])

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner"></div> {/* Add a spinner if you have one */}
            <p>Finishing authentication...</p>
        </div>
    )
}

export const Route = createFileRoute('/callback' as any)({
    component: CallbackComponent,
})
