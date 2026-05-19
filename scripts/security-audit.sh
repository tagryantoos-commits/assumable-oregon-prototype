#!/bin/bash
# Security audit script for assumableguy.com
# Run before deploys or on a weekly schedule
# Usage: bash scripts/security-audit.sh

set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

echo "=== Security Audit: assumableguy.com ==="
echo ""

# 1. Check for hardcoded secrets in source files
echo "1. Checking for hardcoded secrets in source..."
SECRETS=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
  -E '(sk-ant-|xoxb-|xapp-|fka_|AC[0-9a-f]{32}|EAA[A-Za-z0-9]+)' \
  "$DIR/app/" "$DIR/lib/" "$DIR/components/" 2>/dev/null || true)

if [ -n "$SECRETS" ]; then
  echo "   FAIL: Hardcoded secrets found:"
  echo "$SECRETS" | head -10
  ERRORS=$((ERRORS + 1))
else
  echo "   PASS: No hardcoded secrets in source"
fi

# 2. Check for httpOnly:false on cookies
echo "2. Checking cookie security..."
INSECURE_COOKIES=$(grep -rn "httpOnly.*false" "$DIR/app/api/" 2>/dev/null || true)
if [ -n "$INSECURE_COOKIES" ]; then
  echo "   FAIL: Cookies with httpOnly:false found:"
  echo "$INSECURE_COOKIES"
  ERRORS=$((ERRORS + 1))
else
  echo "   PASS: All cookies are httpOnly"
fi

# 3. Check for SERVICE_ROLE_KEY usage in API routes
echo "3. Checking for SERVICE_ROLE_KEY in API routes..."
SRK=$(grep -rn "SERVICE_ROLE_KEY" "$DIR/app/api/" 2>/dev/null || true)
if [ -n "$SRK" ]; then
  echo "   WARN: SERVICE_ROLE_KEY referenced in API routes:"
  echo "$SRK"
  ERRORS=$((ERRORS + 1))
else
  echo "   PASS: No SERVICE_ROLE_KEY in API routes"
fi

# 4. Check for PII in console.log
echo "4. Checking for PII in logs..."
PII_LOGS=$(grep -rn --include="*.ts" \
  -E 'console\.(log|error).*\$\{(from|email|phone|name)\}' \
  "$DIR/app/api/" 2>/dev/null || true)
if [ -n "$PII_LOGS" ]; then
  echo "   FAIL: PII found in console.log:"
  echo "$PII_LOGS" | head -10
  ERRORS=$((ERRORS + 1))
else
  echo "   PASS: No PII in log statements"
fi

# 5. Check for /tmp PII file writes (excludes rate-limit/conversation state dirs)
echo "5. Checking for /tmp PII writes..."
TMP_PII=$(grep -rn --include="*.ts" "tmpdir\|/tmp/" "$DIR/app/api/" 2>/dev/null \
  | grep -v "ratelimit\|conversations\|oauth" || true)
if [ -n "$TMP_PII" ]; then
  echo "   WARN: /tmp file writes found (check for PII):"
  echo "$TMP_PII"
  ERRORS=$((ERRORS + 1))
else
  echo "   PASS: No /tmp PII file writes"
fi

# 6. Check that auth is required on sensitive endpoints
echo "6. Checking auth on sensitive endpoints..."
for ROUTE in "report/[id]/route.ts" "compare/[id]/route.ts" "report/search/route.ts"; do
  FILE="$DIR/app/api/$ROUTE"
  if [ -f "$FILE" ]; then
    if ! grep -q "getAuthenticatedEmail" "$FILE"; then
      echo "   FAIL: $ROUTE missing auth check"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done
echo "   PASS: Sensitive endpoints have auth checks"

# 7. Check .env.local is gitignored
echo "7. Checking .env.local is gitignored..."
if grep -qE '\.env\*|\.env\.local' "$DIR/.gitignore" 2>/dev/null; then
  echo "   PASS: .env.local is gitignored"
else
  echo "   FAIL: .env.local is NOT in .gitignore"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "All checks passed."
else
  echo "FAILED: $ERRORS issue(s) found."
  exit 1
fi
