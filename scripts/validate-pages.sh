#!/bin/bash
# Validates all page.tsx files for common issues that break Vercel deployments.
# Run before committing new city pages or after automated code generation.
#
# Usage: ./scripts/validate-pages.sh

set -e

errors=0

echo "Validating page files..."

# Check for markdown code fences in .tsx files
for f in $(find app -name "*.tsx" -type f); do
  if head -1 "$f" | grep -q '```'; then
    echo "ERROR: $f starts with a markdown code fence — remove it"
    errors=$((errors + 1))
  fi
  # Check for truncated files (JSX that never closes)
  last_line=$(tail -1 "$f" | tr -d '[:space:]')
  if [ -n "$last_line" ] && ! echo "$last_line" | grep -qE '^(}|;|\)|>)$'; then
    # Check if the file has balanced braces (rough heuristic)
    open=$(grep -o '{' "$f" | wc -l)
    close=$(grep -o '}' "$f" | wc -l)
    if [ "$open" -ne "$close" ]; then
      echo "WARNING: $f may be truncated (unbalanced braces: $open open, $close close)"
      errors=$((errors + 1))
    fi
  fi
done

if [ $errors -gt 0 ]; then
  echo ""
  echo "FAILED: $errors issue(s) found. Fix before deploying."
  exit 1
else
  echo "All pages valid."
fi
