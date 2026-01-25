// User storage system using Vercel Blob
import { put, head } from '@vercel/blob'
import crypto from 'crypto'

export interface User {
  id: string
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course'
  createdAt: string
  squarespaceOrderId?: string
  lastLoginAt?: string
}

const USERS_BLOB_PATH = 'users.json'

// Load all users from Blob storage
export async function loadUsers(): Promise<User[]> {
  try {
    // List all blobs and find users.json files (there may be multiple versions)
    const { list: listBlobs } = await import('@vercel/blob')
    const { blobs } = await listBlobs()

    // Find all users.json files and get the most recent one
    const userBlobs = blobs.filter(b => b.pathname === 'users.json')

    if (userBlobs.length === 0) {
      return []
    }

    // Sort by upload date descending and get the latest
    const latestBlob = userBlobs.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0]

    // Fetch the blob content with cache busting
    const response = await fetch(`${latestBlob.url}?t=${Date.now()}`, {
      cache: 'no-store'
    })
    const users = await response.json()
    return users
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

// Save users to Blob storage
// NOTE: Vercel Blob only supports 'public' access. URLs are hard to guess but technically public.
// For production, consider migrating to a database with proper access control.
async function saveUsers(users: User[]) {
  try {
    await put(USERS_BLOB_PATH, JSON.stringify(users, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })
  } catch (error) {
    console.error('Error saving users:', error)
    throw error
  }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await loadUsers()
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Find user by ID
export async function findUserById(id: string): Promise<User | null> {
  const users = await loadUsers()
  return users.find(u => u.id === id) || null
}

// Create new user
export async function createUser(data: {
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course'
  squarespaceOrderId?: string
}): Promise<User> {
  const users = await loadUsers()

  // Check if user already exists
  const existing = await findUserByEmail(data.email)
  if (existing) {
    // Update access level if upgrading
    if (existing.accessLevel === 'online-only' && data.accessLevel === 'full-course') {
      existing.accessLevel = 'full-course'
      await saveUsers(users)
      return existing
    }
    return existing
  }

  // Create new user
  const newUser: User = {
    id: crypto.randomBytes(16).toString('hex'),
    email: data.email,
    name: data.name,
    accessLevel: data.accessLevel,
    createdAt: new Date().toISOString(),
    squarespaceOrderId: data.squarespaceOrderId,
  }

  users.push(newUser)
  await saveUsers(users)
  return newUser
}

// Update user's last login
export async function updateLastLogin(userId: string) {
  const users = await loadUsers()
  const user = users.find(u => u.id === userId)
  if (user) {
    user.lastLoginAt = new Date().toISOString()
    await saveUsers(users)
  }
}

// Upgrade user from online-only to full-course
export async function upgradeUser(email: string): Promise<User | null> {
  const users = await loadUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (user && user.accessLevel === 'online-only') {
    user.accessLevel = 'full-course'
    await saveUsers(users)
    return user
  }
  return user || null
}
