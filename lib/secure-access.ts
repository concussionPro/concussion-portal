// Client-side helper to check server-validated access
export async function checkUserAccess(): Promise<{
  hasAccess: boolean
  accessLevel: 'online-only' | 'full-course' | null
}> {
  try {
    const response = await fetch('/api/access/check', {
      credentials: 'include', // Include cookies
    })

    if (!response.ok) {
      return { hasAccess: false, accessLevel: null }
    }

    const data = await response.json()
    return {
      hasAccess: data.hasAccess,
      accessLevel: data.accessLevel,
    }
  } catch (error) {
    console.error('Access check failed:', error)
    return { hasAccess: false, accessLevel: null }
  }
}

// Helper to check if user has paid access (full-course)
export async function hasPaidAccess(): Promise<boolean> {
  const { accessLevel } = await checkUserAccess()
  return accessLevel === 'full-course'
}

// Helper to check if user has any access (logged in)
export async function hasAnyAccess(): Promise<boolean> {
  const { hasAccess } = await checkUserAccess()
  return hasAccess
}
