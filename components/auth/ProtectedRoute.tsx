'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session via server-side API (validates JWT session cookie)
        const response = await fetch('/api/auth/session', {
          credentials: 'include', // Include httpOnly cookies
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setIsAuthenticated(true)
            setIsChecking(false)
            return
          }
        }

        // Not authenticated - redirect to login
        const redirectUrl = encodeURIComponent(pathname)
        router.push(`/login?redirect=${redirectUrl}`)
        setIsChecking(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        const redirectUrl = encodeURIComponent(pathname)
        router.push(`/login?redirect=${redirectUrl}`)
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
