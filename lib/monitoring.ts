// Production monitoring and error logging system

export interface ErrorLog {
  timestamp: number
  error: string
  stack?: string
  context?: Record<string, unknown>
  severity: 'critical' | 'error' | 'warning'
  endpoint?: string
  userId?: string
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'down'
  checks: {
    database: boolean
    blobStorage: boolean
    authentication: boolean
  }
  timestamp: number
}

// Log errors to console (production logs visible in Vercel dashboard)
export async function logError(error: ErrorLog): Promise<void> {
  try {
    const prefix = error.severity === 'critical' ? '[CRITICAL]' : error.severity === 'error' ? '[ERROR]' : '[WARN]'
    console.error(`${prefix} ${error.error}`, {
      ...(error.context || {}),
      ...(error.endpoint ? { endpoint: error.endpoint } : {}),
      ...(error.userId ? { userId: error.userId } : {}),
    })
  } catch (e) {
    console.error('Failed to log error:', e)
    console.error('Original error:', error)
  }
}

// Log authentication failures
export async function logAuthFailure(context: {
  endpoint: string
  email?: string
  reason: string
  ip?: string
}): Promise<void> {
  await logError({
    timestamp: Date.now(),
    error: 'Authentication failure',
    severity: 'warning',
    context,
    endpoint: context.endpoint,
  })
}

// Log critical system errors
export async function logCriticalError(
  error: Error,
  context: Record<string, unknown>
): Promise<void> {
  await logError({
    timestamp: Date.now(),
    error: error.message,
    stack: error.stack,
    severity: 'critical',
    context,
  })
}

// Performance monitoring
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()

  return fn()
    .then((result) => {
      const duration = Date.now() - start

      // Log slow operations (> 3 seconds)
      if (duration > 3000) {
        logError({
          timestamp: Date.now(),
          error: 'Slow operation detected',
          severity: 'warning',
          context: {
            operation,
            duration,
          },
        }).catch(console.error)
      }

      return result
    })
    .catch((error) => {
      const duration = Date.now() - start

      // Log failed operations
      logCriticalError(error, {
        operation,
        duration,
      }).catch(console.error)

      throw error
    })
}
