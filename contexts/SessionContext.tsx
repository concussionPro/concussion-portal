'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface SessionUser {
  id: string
  email: string
  name: string
  accessLevel: 'preview' | 'online-only' | 'full-course'
  /**
   * Owns the CRM (Concussion Rehab Mastery / EP) course. CRM entitlement lives
   * in `course_purchases`, NOT `access_level` — the two streams are isolated on
   * purpose (lib/crm-course.ts). A CRM-only buyer therefore carries
   * accessLevel 'preview', so anything that gates on accessLevel alone will
   * render a paying customer as a free user. Check this too.
   */
  ownsCrm?: boolean
  stripeCustomerId?: string
  workshopCity?: string
  workshopDate?: string
  workshopLocation?: string | null
  createdAt?: string
  nurtureUnsubscribed?: boolean
  progressEmailsOptedOut?: boolean
}

interface SessionContextType {
  user: SessionUser | null
  isLoading: boolean
  error: string | null
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
          } else {
            setError('No active session')
          }
        } else {
          setError('Session fetch failed')
        }
      } catch (err) {
        console.error('Session fetch error:', err)
        setError('Failed to load session')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [])

  return (
    <SessionContext.Provider value={{ user, isLoading, error }}>
      {children}
    </SessionContext.Provider>
  )
}

/**
 * useSession hook — returns session data from the nearest SessionProvider.
 * When used outside a SessionProvider, fetches the session independently.
 * Wrapping in a SessionProvider avoids duplicate fetches across sibling components.
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext)

  // Standalone fetch state for when no provider is present
  const [standaloneUser, setStandaloneUser] = useState<SessionUser | null>(null)
  const [standaloneLoading, setStandaloneLoading] = useState(true)
  const [standaloneError, setStandaloneError] = useState<string | null>(null)

  const hasProvider = context !== undefined

  useEffect(() => {
    // Only fetch if there's no provider
    if (hasProvider) return

    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setStandaloneUser(data.user)
          } else {
            setStandaloneError('No active session')
          }
        } else {
          setStandaloneError('Session fetch failed')
        }
      } catch (err) {
        console.error('Session fetch error:', err)
        setStandaloneError('Failed to load session')
      } finally {
        setStandaloneLoading(false)
      }
    }

    fetchSession()
  }, [hasProvider])

  if (hasProvider) {
    return context
  }

  return {
    user: standaloneUser,
    isLoading: standaloneLoading,
    error: standaloneError,
  }
}
