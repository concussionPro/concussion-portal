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
    // Check if blob exists
    const blobExists = await head(USERS_BLOB_PATH).catch(() => null)

    if (!blobExists) {
      return []
    }

    // Fetch the blob content with cache busting
    const response = await fetch(`${blobExists.url}?t=${Date.now()}`, {
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
