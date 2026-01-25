# Production Monitoring Guide

## Overview

The portal includes comprehensive monitoring to ensure high availability and quick issue detection.

## Health Check Endpoint

**URL:** `https://portal.concussion-education-australia.com/api/health`

**Response:**
```json
{
  "status": "healthy" | "degraded" | "down",
  "checks": {
    "blobStorage": boolean,
    "authentication": boolean,
    "environment": boolean
  },
  "timestamp": "ISO8601",
  "uptime": seconds
}
```

**Status Codes:**
- `200` - All systems healthy
- `503` - Degraded (some systems down)
- `500` - Critical failure (site down)

## Admin Monitoring Dashboard

**URL:** `https://portal.concussion-education-australia.com/api/admin/monitoring`

**Authentication:** Requires `X-Admin-Key` header with `ADMIN_API_KEY` value

**Response:**
```json
{
  "success": true,
  "timestamp": "ISO8601",
  "metrics": {
    "userCount": number,
    "todayEvents": number,
    "recentErrorCount": number,
    "criticalErrors": number
  },
  "recentErrors": [...],
  "systemHealth": {
    "blobStorage": boolean,
    "authentication": boolean
  }
}
```

## Error Logging

All critical errors are automatically logged to Blob storage:
- **Location:** `logs/errors-YYYY-MM-DD.jsonl`
- **Format:** JSONL (one JSON object per line)
- **Retention:** Manual cleanup required

**Error Log Format:**
```json
{
  "timestamp": number,
  "error": "Error message",
  "stack": "Stack trace",
  "severity": "critical" | "error" | "warning",
  "context": {},
  "endpoint": "/api/...",
  "userId": "optional"
}
```

## Monitored Operations

### Authentication
- Magic link send failures
- Invalid token attempts
- Email delivery failures

### Performance
- Slow operations (> 3 seconds)
- Database query times
- API response times

### System Health
- Blob storage connectivity
- JWT token validation
- Environment configuration

## Deployment Verification

After every deployment, run:

```bash
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh
```

This checks:
1. Health endpoint
2. Homepage load
3. Login page
4. Dashboard access
5. Module pages
6. Clinical toolkit
7. Security headers
8. Session endpoint

## Setting Up External Monitoring

### Recommended: UptimeRobot (Free)

1. Sign up at https://uptimerobot.com
2. Add HTTP(s) monitor
3. URL: `https://portal.concussion-education-australia.com/api/health`
4. Interval: 5 minutes
5. Alert contacts: Your email/SMS

### Alternative: Pingdom, StatusCake, or Checkly

Similar setup - monitor the `/api/health` endpoint every 5 minutes.

## Alert Thresholds

**Immediate Action Required:**
- Health check returns 500 (site down)
- > 5 critical errors in 10 minutes
- > 10 authentication failures in 5 minutes

**Investigation Needed:**
- Health check returns 503 (degraded)
- > 3 slow operations in 1 hour
- Email delivery failing

## Accessing Error Logs

### Via API (Admin Key Required):
```bash
curl -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  https://portal.concussion-education-australia.com/api/admin/monitoring
```

### Via Vercel Dashboard:
1. Go to Vercel Dashboard
2. Select project
3. Storage → Blob
4. Navigate to `logs/errors-YYYY-MM-DD.jsonl`
5. Download and review

## Performance Monitoring

Operations taking > 3 seconds are automatically logged. Check for:
- `findUserByEmail` - should be < 1s
- `sendWelcomeEmail` - should be < 2s
- `loadUsers` - should be < 500ms

If consistently slow, consider:
1. Migrating to PostgreSQL/MongoDB
2. Adding caching layer
3. Optimizing Blob storage access

## Best Practices

1. **Check health endpoint daily**
   ```bash
   curl https://portal.concussion-education-australia.com/api/health
   ```

2. **Review error logs weekly**
   ```bash
   curl -H "X-Admin-Key: YOUR_KEY" \
     https://portal.concussion-education-australia.com/api/admin/monitoring \
     | jq '.recentErrors'
   ```

3. **Run deployment verification after every push**
   ```bash
   ./scripts/verify-deployment.sh
   ```

4. **Set up email alerts** via UptimeRobot or similar service

5. **Monitor Vercel deployment status** - get mobile app notifications

## Troubleshooting

### Site Down
1. Check Vercel deployments tab
2. Look for build errors
3. Check `/api/health` response
4. Review recent error logs
5. Verify environment variables set

### Degraded Performance
1. Check error logs for slow operations
2. Verify Blob storage not hitting limits
3. Check email service (Resend) status
4. Review authentication failure rates

### User Login Issues
1. Check error logs for authentication failures
2. Verify MAGIC_LINK_SECRET is set
3. Test email delivery (check Resend dashboard)
4. Verify user exists in users.json

## Environment Variables Required

- `MAGIC_LINK_SECRET` - JWT signing
- `SESSION_SECRET` - Session tokens (fallback to MAGIC_LINK_SECRET)
- `BLOB_READ_WRITE_TOKEN` - Storage access
- `RESEND_API_KEY` - Email delivery
- `ADMIN_API_KEY` - Monitoring access
- `NEXT_PUBLIC_APP_URL` - Base URL

## Support

If monitoring detects issues:
1. Check Vercel deployment logs
2. Review error logs via monitoring endpoint
3. Run deployment verification script
4. Check GitHub for recent commits that may have caused issues
