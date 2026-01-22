// Simple user storage system
// For production, migrate to a proper database (Supabase, Prisma, etc.)

import fs from 'fs'
import path from 'path'
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

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load all users
export function loadUsers(): User[] {
  try {
    ensureDataDir()
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf8')
      return []
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

// Save users
function saveUsers(users: User[]) {
  ensureDataDir()
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
}

// Find user by email
export function findUserByEmail(email: string): User | null {
  const users = loadUsers()
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Find user by ID
export function findUserById(id: string): User | null {
  const users = loadUsers()
  return users.find(u => u.id === id) || null
}

// Create new user
export function createUser(data: {
  email: string
  name: string
  accessLevel: 'online-only' | 'full-course'
  squarespaceOrderId?: string
}): User {
  const users = loadUsers()

  // Check if user already exists
  const existing = findUserByEmail(data.email)
  if (existing) {
    // Update access level if upgrading
    if (existing.accessLevel === 'online-only' && data.accessLevel === 'full-course') {
      existing.accessLevel = 'full-course'
      saveUsers(users)
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
  saveUsers(users)
  return newUser
}

// Update user's last login
export function updateLastLogin(userId: string) {
  const users = loadUsers()
  const user = users.find(u => u.id === userId)
  if (user) {
    user.lastLoginAt = new Date().toISOString()
    saveUsers(users)
  }
}

// Upgrade user from online-only to full-course
export function upgradeUser(email: string): User | null {
  const users = loadUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (user && user.accessLevel === 'online-only') {
    user.accessLevel = 'full-course'
    saveUsers(users)
    return user
  }
  return user || null
}
