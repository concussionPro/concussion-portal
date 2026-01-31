// User storage system using Vercel Blob with local file fallback
import { put, head } from '@vercel/blob'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

export interface User {
  id: string
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course' | 'preview'
  createdAt: string
  squarespaceOrderId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  lastLoginAt?: string
}

const USERS_BLOB_PATH = 'users.json'
const LOCAL_USERS_PATH = path.join(process.cwd(), 'data', 'users.local.json')

// Check if Vercel Blob is configured
function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

// Load users from local file (development fallback)
async function loadUsersFromLocalFile(): Promise<User[]> {
  try {
    const data = await fs.readFile(LOCAL_USERS_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading users from local file:', error)
    return []
  }
}

// Save users to local file (development fallback)
async function saveUsersToLocalFile(users: User[]): Promise<void> {
  try {
    await fs.writeFile(LOCAL_USERS_PATH, JSON.stringify(users, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving users to local file:', error)
    throw error
  }
}

// Load all users from Blob storage or local file
export async function loadUsers(): Promise<User[]> {
  // If Blob storage is not configured, use local file
  if (!isBlobConfigured()) {
    console.log('📝 Using local file storage for users (development mode)')
    return loadUsersFromLocalFile()
  }

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
    console.error('Error loading users from Blob:', error)
    // Fallback to local file if Blob fails
    console.log('⚠️  Blob storage failed, falling back to local file')
    return loadUsersFromLocalFile()
  }
}

// Save users to Blob storage or local file
// NOTE: Vercel Blob only supports 'public' access. URLs are hard to guess but technically public.
// For production, consider migrating to a database with proper access control.
async function saveUsers(users: User[]) {
  // If Blob storage is not configured, use local file
  if (!isBlobConfigured()) {
    console.log('📝 Saving users to local file (development mode)')
    return saveUsersToLocalFile(users)
  }

  try {
    await put(USERS_BLOB_PATH, JSON.stringify(users, null, 2), {
      access: 'public',
      contentType: 'application/json',
    })
  } catch (error) {
    console.error('Error saving users to Blob:', error)
    // Fallback to local file if Blob fails
    console.log('⚠️  Blob storage failed, falling back to local file')
    return saveUsersToLocalFile(users)
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
  accessLevel: 'online-only' | 'full-course' | 'preview'
  squarespaceOrderId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}): Promise<string> {
  const users = await loadUsers()

  // Check if user already exists
  const existing = await findUserByEmail(data.email)
  if (existing) {
    // Update access level if upgrading
    if ((existing.accessLevel === 'online-only' || existing.accessLevel === 'preview') &&
        (data.accessLevel === 'full-course' || data.accessLevel === 'online-only')) {
      existing.accessLevel = data.accessLevel
      if (data.stripeCustomerId) existing.stripeCustomerId = data.stripeCustomerId
      if (data.stripeSubscriptionId) existing.stripeSubscriptionId = data.stripeSubscriptionId
      await saveUsers(users)
    }
    return existing.id
  }

  // Create new user
  const newUser: User = {
    id: crypto.randomBytes(16).toString('hex'),
    email: data.email,
    name: data.name,
    accessLevel: data.accessLevel,
    createdAt: new Date().toISOString(),
    squarespaceOrderId: data.squarespaceOrderId,
    stripeCustomerId: data.stripeCustomerId,
    stripeSubscriptionId: data.stripeSubscriptionId,
  }

  users.push(newUser)
  await saveUsers(users)
  return newUser.id
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
