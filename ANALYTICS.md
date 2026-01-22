# Analytics Suite Documentation

## Overview

Comprehensive analytics tracking system for monitoring user behavior, conversions, and engagement across the ConcussionPro portal.

## Features

- **Real-time Event Tracking**: Track all user interactions, page views, clicks, and conversions
- **User Session Tracking**: Monitor unique users, sessions, and engagement metrics
- **Conversion Funnel**: Track shop clicks, enroll button clicks, and purchase intent
- **Content Engagement**: Monitor module progress, video views, and quiz completion
- **Resource Downloads**: Track clinical toolkit and reference repository usage
- **Search Analytics**: Track search queries and result relevance
- **Admin Dashboard**: Visual dashboard for analyzing all metrics

## Accessing the Analytics Dashboard

### 1. Set Admin API Key

Add this to your `.env.local` file:

```bash
ADMIN_API_KEY=your-secure-admin-key-here
```

**Generate a secure key:**
```bash
openssl rand -hex 32
```

### 2. Access the Dashboard

Navigate to: `https://your-domain.com/admin/analytics`

Enter your `ADMIN_API_KEY` when prompted.

### 3. Dashboard Features

The analytics dashboard shows:

**Summary Cards:**
- Unique Users
- Total Events
- Shop Clicks (conversion tracking)
- Module Completions

**Event Types Breakdown:**
- All events categorized by type
- Frequency counts for each event

**Top Pages:**
- Most visited pages
- Traffic distribution

**Recent Events:**
- Real-time event stream
- User identification
- Event details and metadata

**Conversion Funnel:**
- Session → Pricing View → Shop Click → Enroll
- Conversion rates at each stage
- Drop-off analysis

## Tracked Events

### Navigation
- `page_view` - Every page visit
- `sidebar_click` - Navigation clicks
- `tab_switch` - Tab changes

### Authentication
- `login_attempt` - Login initiated
- `login_success` - Successful login
- `logout` - User logout

### Conversion
- `shop_click` - Any shop/enroll button click
- `enroll_button_click` - Specific enroll CTAs
- `pricing_view` - Pricing page viewed

### Content Engagement
- `module_start` - Module started
- `module_complete` - Module completed
- `video_play` - Video playback started
- `video_complete` - Video watched to end
- `quiz_start` - Quiz initiated
- `quiz_submit` - Quiz submitted

### Resources
- `toolkit_download` - Clinical resource downloaded
- `reference_view` - Research reference accessed
- `search_query` - Search performed

### Errors
- `error` - Error occurred (with stack trace)

## Tracked Locations

### Homepage
- Nav enroll button: `nav-desktop`
- Hero CTA
- Pricing section clicks

### Clinical Toolkit
- Resource downloads (all resources tracked)
- Locked resource clicks: `toolkit-locked-resource`
- Unauthenticated banner: `toolkit-unauthenticated-banner`
- Online-only upgrade: `toolkit-online-only-upgrade`

### Reference Repository
- Reference views (with title and category)
- Search queries
- Online-only upgrade: `references-online-only-upgrade`

### Workshop Page
- Enroll button clicks
- Workshop details views

## Data Storage

Analytics events are stored in **Vercel Blob Storage** as daily JSONL files:

```
analytics/
  └── YYYY-MM-DD.jsonl
```

Each event is a JSON object with:
```json
{
  "id": "event_123456789_abc123",
  "userId": "user_xyz",
  "email": "user@example.com",
  "timestamp": 1234567890,
  "eventType": "shop_click",
  "eventData": {
    "source": "nav-desktop"
  },
  "sessionId": "session_abc123",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://example.com",
  "path": "/pricing"
}
```

## API Endpoints

### Track Event
```
POST /api/analytics/track
```

Request body:
```json
{
  "eventType": "shop_click",
  "eventData": { "source": "homepage" },
  "sessionId": "session_123",
  "timestamp": 1234567890,
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://...",
  "path": "/pricing"
}
```

### Get Analytics Data
```
GET /api/analytics/data?days=30
```

Headers:
```
x-admin-key: your-admin-key
```

Query params:
- `days`: Number of days to retrieve (default: 30)
- `eventType`: Filter by specific event type

## Adding Custom Tracking

### Client-side Tracking

```typescript
import { trackEvent } from '@/lib/analytics'

// Track a custom event
trackEvent('custom_event', {
  customField: 'value',
  anotherField: 123
})

// Track a shop click
import { trackShopClick } from '@/lib/analytics'
trackShopClick('button-location', { additionalData: 'value' })

// Track a download
import { trackDownload } from '@/lib/analytics'
trackDownload('filename.pdf', 'category', { resourceId: '123' })
```

### Using the Hook

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function MyComponent() {
  useAnalytics() // Auto-tracks page views

  const handleClick = () => {
    trackEvent('button_click', { button: 'my-button' })
  }

  return <button onClick={handleClick}>Click Me</button>
}
```

## Privacy & Security

- **Anonymous by default**: Unauthenticated users tracked without PII
- **Session-based**: User identification only for logged-in users
- **Secure storage**: Events stored in Vercel Blob with access controls
- **Admin-only access**: Dashboard requires API key authentication
- **No third-party tracking**: All data stays in your infrastructure

## Conversion Optimization

Use analytics to optimize:

1. **Shop Click Rate**: Measure CTA effectiveness
2. **Page Engagement**: Identify high-performing content
3. **Funnel Drop-off**: Find conversion bottlenecks
4. **Resource Usage**: Understand toolkit value
5. **Search Patterns**: Improve content discoverability

## Time Ranges

Dashboard supports:
- Last 24 hours
- Last 7 days
- Last 30 days
- Last 90 days

## Export Data

To export analytics data:

```bash
curl -H "x-admin-key: YOUR_KEY" \
  https://your-domain.com/api/analytics/data?days=30 > analytics.json
```

## Performance

- **Edge runtime**: Fast, globally distributed
- **Async tracking**: No impact on user experience
- **Silent failures**: Errors don't disrupt UX
- **Minimal payload**: Small request sizes

## Troubleshooting

**Events not appearing:**
1. Check browser console for errors
2. Verify ADMIN_API_KEY is set correctly
3. Check Vercel Blob storage permissions
4. Ensure Vercel Blob integration is connected

**Dashboard not loading:**
1. Verify admin key is correct
2. Check network tab for API errors
3. Ensure Vercel deployment is live

**Missing user data:**
- User data only captured for authenticated users
- Anonymous sessions tracked by sessionId

## Future Enhancements

Potential additions:
- Real-time dashboard updates
- Email reports
- Conversion funnel visualization
- A/B testing integration
- Cohort analysis
- Retention tracking
- Revenue attribution
