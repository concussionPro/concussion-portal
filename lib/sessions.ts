// Session management system using Vercel Blob
import { put, head } from '@vercel/blob'
import crypto from 'crypto'

export interface Session {
  sessionId: string
  userId: string
  email: string
  createdAt: string
  expiresAt: string
  rememberMe: boolean
}

const SESSIONS_BLOB_PATH = 'sessions.json'

// Session durations
const SHORT_SESSION = 7 * 24 * 60 * 60 * 1000 // 7 days (default)
const LONG_SESSION = 30 * 24 * 60 * 60 * 1000 // 30 days (remember me)

// Load all sessions from Blob storage
async function loadSessions(): Promise<Session[]> {
  try {
    const blobExists = await head(SESSIONS_BLOB_PATH).catch(() => null)

    if (!blobExists) {
      return []
    }

    const response = await fetch(blobExists.url)
    const sessions = await response.json()
    return sessions
  } catch (error) {
    console.error('Error loading sessions:', error)
    return []
  }
}

// Save sessions to Blob storage
async function saveSessions(sessions: Session[]) {
  try {
    await put(SESSIONS_BLOB_PATH, JSON.stringify(sessions, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })
  } catch (error) {
    console.error('Error saving sessions:', error)
    throw error
  }
}

// Create a new session
export async function createSession(
  userId: string,
  email: string,
  rememberMe: boolean = false
): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex')
  const duration = rememberMe ? LONG_SESSION : SHORT_SESSION
  const expiresAt = new Date(Date.now() + duration)

  const sessions = await loadSessions()

  // Clean up expired sessions
  const validSessions = sessions.filter(s => new Date(s.expiresAt) > new Date())

  // Add new session
  validSessions.push({
    sessionId,
    userId,
    email,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    rememberMe,
  })

  await saveSessions(validSessions)

  return sessionId
}

// Verify session is valid
export async function verifySession(sessionId: string): Promise<{ userId: string; email: string } | null> {
  const sessions = await loadSessions()
  const session = sessions.find(s => s.sessionId === sessionId)

  if (!session) {
    return null
  }

  // Check if expired
  if (new Date(session.expiresAt) < new Date()) {
    return null
  }

  return {
    userId: session.userId,
    email: session.email,
  }
}

// Delete a session (logout)
export async function deleteSession(sessionId: string) {
  const sessions = await loadSessions()
  const filteredSessions = sessions.filter(s => s.sessionId !== sessionId)
  await saveSessions(filteredSessions)
}

// Clean up old sessions (run periodically)
export async function cleanupExpiredSessions() {
  const sessions = await loadSessions()
  const validSessions = sessions.filter(s => new Date(s.expiresAt) > new Date())
  await saveSessions(validSessions)
}
