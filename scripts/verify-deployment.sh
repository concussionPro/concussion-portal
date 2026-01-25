#!/bin/bash
# Deployment verification script
# Run this after every deployment to ensure the site is working

set -e

SITE_URL="${1:-https://portal.concussion-education-australia.com}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying deployment for: $SITE_URL"
echo ""

# Check health endpoint
echo "1️⃣  Checking health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/api/health")
if [ "$HEALTH_STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} Health check passed (HTTP $HEALTH_STATUS)"
else
  echo -e "${RED}✗${NC} Health check failed (HTTP $HEALTH_STATUS)"
  exit 1
fi

# Check homepage loads
echo "2️⃣  Checking homepage..."
HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")
if [ "$HOMEPAGE_STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} Homepage loads (HTTP $HOMEPAGE_STATUS)"
else
  echo -e "${RED}✗${NC} Homepage failed (HTTP $HOMEPAGE_STATUS)"
  exit 1
fi

# Check login page
echo "3️⃣  Checking login page..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/login")
if [ "$LOGIN_STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} Login page loads (HTTP $LOGIN_STATUS)"
else
  echo -e "${RED}✗${NC} Login page failed (HTTP $LOGIN_STATUS)"
  exit 1
fi

# Check dashboard (should redirect or show auth)
echo "4️⃣  Checking dashboard..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/dashboard")
if [ "$DASHBOARD_STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} Dashboard responds (HTTP $DASHBOARD_STATUS)"
else
  echo -e "${YELLOW}⚠${NC} Dashboard status: HTTP $DASHBOARD_STATUS (expected if not logged in)"
fi

# Check module 1
echo "5️⃣  Checking module pages..."
MODULE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/modules/1")
if [ "$MODULE_STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} Module pages load (HTTP $MODULE_STATUS)"
else
  echo -e "${YELLOW}⚠${NC} Module status: HTTP $MODULE_STATUS (may require auth)"
fi

# Check clinical toolkit
echo "6️⃣  Checking clinical toolkit..."
TOOLKIT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/clinical-toolkit")
if [ "$TOOLKIT_STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} Clinical toolkit loads (HTTP $TOOLKIT_STATUS)"
else
  echo -e "${RED}✗${NC} Clinical toolkit failed (HTTP $TOOLKIT_STATUS)"
  exit 1
fi

# Check security headers
echo "7️⃣  Checking security headers..."
HEADERS=$(curl -s -I "$SITE_URL" | grep -i "strict-transport-security\|x-frame-options\|content-security-policy")
if [ ! -z "$HEADERS" ]; then
  echo -e "${GREEN}✓${NC} Security headers present"
else
  echo -e "${RED}✗${NC} Security headers missing"
  exit 1
fi

# Check session endpoint
echo "8️⃣  Checking session endpoint..."
SESSION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/api/auth/session")
if [ "$SESSION_STATUS" = "401" ]; then
  echo -e "${GREEN}✓${NC} Session endpoint works (correctly returns 401)"
else
  echo -e "${YELLOW}⚠${NC} Session endpoint status: HTTP $SESSION_STATUS"
fi

echo ""
echo -e "${GREEN}✅ Deployment verification complete!${NC}"
echo ""
echo "Site is operational at: $SITE_URL"
