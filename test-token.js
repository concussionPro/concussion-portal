// Test token generation and verification
const crypto = require('crypto')

// Use the dev secret from .env.local
const SECRET = 'dev_magic_link_secret_replace_in_production_with_secure_random_key'

function createToken(userId, email, name, accessLevel) {
  const payload = {
    userId,
    email,
    name,
    accessLevel,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  }

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payloadStr)
    .digest('base64url')

  return `${payloadStr}.${signature}`
}

function verifyToken(token) {
  try {
    const [payloadStr, signature] = token.split('.')

    if (!payloadStr || !signature) {
      console.error('❌ Token split failed')
      return null
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(payloadStr)
      .digest('base64url')

    if (signature !== expectedSignature) {
      console.error('❌ Signature mismatch')
      console.log('Expected:', expectedSignature)
      console.log('Got:', signature)
      return null
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString()
    )

    // Check expiration
    if (payload.exp < Date.now()) {
      console.error('❌ Token expired')
      return null
    }

    return payload
  } catch (error) {
    console.error('❌ Error:', error.message)
    return null
  }
}

// Test
console.log('🧪 Testing token generation and verification...\n')

const token = createToken('test-user-id', 'test@example.com', 'Test User', 'preview')
console.log('✓ Token created:', token.substring(0, 50) + '...')

const verified = verifyToken(token)
if (verified) {
  console.log('✓ Token verified successfully')
  console.log('  User ID:', verified.userId)
  console.log('  Email:', verified.email)
  console.log('  Name:', verified.name)
  console.log('  Access Level:', verified.accessLevel)
} else {
  console.log('❌ Token verification FAILED')
}

// Test URL encoding issue
const encodedToken = encodeURIComponent(token)
console.log('\n🔗 Testing URL encoding...')
console.log('Original length:', token.length)
console.log('Encoded length:', encodedToken.length)
const decodedToken = decodeURIComponent(encodedToken)
console.log('Decoded matches:', token === decodedToken ? '✓' : '❌')

if (token === decodedToken) {
  const verifiedDecoded = verifyToken(decodedToken)
  console.log('Decoded token verifies:', verifiedDecoded ? '✓' : '❌')
}
