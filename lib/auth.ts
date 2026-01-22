// Simple authentication utilities
// In production, integrate with your course enrollment/payment system

export interface User {
  id: string
  email: string
  name: string
  enrolledAt: string
  expiresAt?: string
}

const ENROLLED_USERS_KEY = 'enrolled_users'
const CURRENT_USER_KEY = 'current_user'

// Demo credentials for testing (remove in production)
const DEMO_CREDENTIALS = {
  email: 'demo@concussionpro.com',
  password: 'demo123'
}

export function authenticate(email: string, password: string): User | null {
  // Demo authentication (replace with actual API call to your enrollment system)
  if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
    return {
      id: '1',
      email: email,
      name: 'Demo User',
      enrolledAt: new Date().toISOString(),
    }
  }

  // Check against enrolled users in localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(ENROLLED_USERS_KEY)
    if (stored) {
      try {
        const users = JSON.parse(stored) as User[]
        const user = users.find(u => u.email === email)
        if (user) {
          // In production, verify password hash
          return user
        }
      } catch (error) {
        console.error('Failed to parse enrolled users:', error)
      }
    }
  }

  return null
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(CURRENT_USER_KEY)
  if (stored) {
    try {
      const user = JSON.parse(stored) as User

      // Check if enrollment is still valid
      if (user.expiresAt) {
        const expiresAt = new Date(user.expiresAt)
        if (expiresAt < new Date()) {
          logout()
          return null
        }
      }

      return user
    } catch (error) {
      console.error('Failed to parse current user:', error)
      return null
    }
  }

  return null
}

export function login(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

export function logout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CURRENT_USER_KEY)
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

export function requireAuth(): User {
  const user = getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

// For testing: Add a demo user to enrolled users
export function addDemoUser(): void {
  if (typeof window === 'undefined') return

  const demoUser: User = {
    id: '1',
    email: DEMO_CREDENTIALS.email,
    name: 'Demo User',
    enrolledAt: new Date().toISOString(),
  }

  const stored = localStorage.getItem(ENROLLED_USERS_KEY)
  let users: User[] = []

  if (stored) {
    try {
      users = JSON.parse(stored)
    } catch (error) {
      console.error('Failed to parse enrolled users:', error)
    }
  }

  // Add demo user if not already present
  if (!users.find(u => u.email === demoUser.email)) {
    users.push(demoUser)
    localStorage.setItem(ENROLLED_USERS_KEY, JSON.stringify(users))
  }
}

// Check if user has full access to premium content
// SECURITY: Only authentication is checked - no separate localStorage flags
// In production, this should verify against a server-side enrollment/payment database
export function hasFullAccess(): boolean {
  const user = getCurrentUser()
  return user !== null
}
