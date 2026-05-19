# CLAUDE.md — The Assumable Guy Website

> Claude Code reads this file automatically at session start.

## Shared Memory (Read First)

Always read `/Users/ryanthomson/.openclaw/workspace/shared-memory/ACTIVE_CONTEXT.md` at the start of any session.
Check `/Users/ryanthomson/.openclaw/workspace/shared-memory/handoffs/LATEST.md` for context from the last Opus run.

When your session ends, update LATEST.md with what you did and what's next.

---

## This Repository

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS
**Deploy:** git push to `main` → Vercel auto-deploys
**Domain:** assumableguy.com

## Key Directories

```
app/              Pages and API routes
content/blog/     Blog posts (MDX — each file = one published post)
lib/              Shared libraries
public/data/      Static JSON (listings, etc.)
components/       Reusable React components
```

## Before Any Change

1. Read the existing code. Don't guess the pattern.
2. Check if there's a relevant existing component before creating new ones.
3. Run `npm run build` to verify no TypeScript errors before committing.

## After Any Change

```bash
git add -A
git commit -m "Brief description of what changed and why"
git push origin main
```

## Blog Posts

Blog posts live in `content/blog/` as `.mdx` files.

Draft posts from Opus are in:
- `../agents/opus-tasks/output/blog-drafts/`
- `../agents/opus-tasks/output/blog-drafts-2026-04-22/`

To publish a draft: copy from output/ to `content/blog/`, verify frontmatter, commit + push.

**Required frontmatter:**
```yaml
---
title: "Post Title"
date: "YYYY-MM-DD"
description: "One sentence description for SEO"
tags: ["assumable mortgage", "colorado"]
---
```

## Brand Rules (non-negotiable)

- Domain: `assumableguy.com` (NEVER theassumableguy.com)
- Only FHA and VA loans are assumable (NEVER mention USDA)
- Dollar-led: "$1,083/month less" not "a lower rate"
- No em dashes (use commas, colons, or periods instead)
- Banned words: stunning, gorgeous, leverage, synergy, game-changer, navigate, seamless, transformative
- Max 1 exclamation point per piece of content
- Ryan Thomson, Keller Williams. Equal Housing Opportunity.

## Safety

- Never edit `.env.local` or any env file
- Never `git push --force` or `git reset --hard`
- Never delete listings data without explicit instruction
- Test your build before pushing to production
