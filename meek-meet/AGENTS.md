<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Meek Meet — Project Context

## Overview
Meek Meet is a faith-based community organizing platform targeting Bible-believing communities (Catholic, Protestant, Jehovah's Witness, Orthodox, etc.). The core mission: "The meek shall inherit the earth" (Matthew 5:5). Members gather in local **circles** led by **shepherds**, answer discussion questions in regular meetings, and the platform synthesizes their responses into anonymized insights and reports for civic authorities.

## Design Language
- **Aesthetic**: warm, reverent, editorial — parchment/paper feel rather than institutional navy
- **Palette tokens** (`src/app/globals.css` @theme): cream, parchment, charcoal, midnight, wheat, sage, terracotta, sky-soft, border-warm
- **Typography**: Cormorant Garamond (serif headings), Source Sans 3 (body), Caveat (scripture/script accents) — loaded via `next/font/google` in `src/app/layout.tsx`
- **Mood**: gentle, structured, trustworthy

## Architecture
- **Framework**: Next.js 16 (App Router, dynamic rendering) + TypeScript (strict) + Tailwind CSS v4
- **Backend**: Supabase (Postgres + RLS + Auth + Storage + Edge Functions + Realtime)
- **Auth**: magic link + Google OAuth via `@supabase/ssr`; session refresh in `src/middleware.ts` (protects `/dashboard`)
- **Email**: Resend (`src/lib/resend.ts`, lazy-initialized)
- **Animation**: Framer Motion · **Icons**: Lucide React
- **Deploy**: Vercel (workspace root `vercel.json`; 3 cron jobs — see CRON_SETUP.md)
- **Mobile**: sibling workspace `meek-meet-mobile` (Capacitor/React) shares the same Supabase project

## File Structure
```
src/
  app/
    (marketing)/          # public pages: /, /about, /circles, /circles/[slug], /shepherd
    dashboard/            # authenticated member area
      admin/              # admin-only: applications, verification, authorities
      shepherd/[circleId]/# shepherd area: meetings, questions, routine, reports, settings
    api/                  # route handlers (cron + public insights + upload)
    auth/callback/        # OAuth/magic-link callback
    login/ voice/ privacy/ terms/ delete-account/
  components/             # shared components (auth-provider)
  lib/
    supabase/             # client.ts (browser), server.ts (RSC), middleware.ts, service.ts (service role)
    reports/              # circle report generation + authority submission
    cron-auth.ts          # Bearer-only check shared by all /api cron routes
    env.ts                # requireEnv() fail-fast env validation
    validation.ts         # isValidUuid, escapeHtml, assertNonEmptyString, ...
  middleware.ts           # session refresh + /dashboard guard
supabase/
  migrations/             # ordered SQL; 000025 = production hardening (run in order)
  functions/              # 5 edge functions (Deno): synthesize-*, generate-*
  config.toml             # verify_jwt per function
```

## Invariants — do not break these
- **`profiles.role` is immutable from user-JWT clients** (DB trigger `guard_profile_role`). Role changes happen ONLY through the `review_shepherd_application(application_id, decision)` RPC, which enforces admin + atomicity. Never write `role` via `.from('profiles').update()`.
- **Service-role key never in the database.** It lives in Supabase Vault (`supabase_service_role_key` secret); `meek_meet_config` holds only non-secret config. See DEPLOYMENT.md §4.
- **Cron routes** accept only `Authorization: Bearer $CRON_SECRET` via `src/lib/cron-auth.ts`. No User-Agent checks, no URL secrets.
- **Anonymous meeting reads** go through the `public_meetings` view (no join_url/notes/coordinates). The `meetings` table itself is authenticated-only.
- **Admin stats** come from the `get_admin_stats()` RPC (admin-gated), not a view.
- Server actions must call `supabase.auth.getUser()` and verify role/membership before any mutation (see `src/app/dashboard/admin/actions.ts` for the pattern).
- Never expose `SUPABASE_SECRET_KEY` to client components; the `NEXT_PUBLIC_*` publishable key is the only key the browser sees.

## Testing / verification
- `npm run build` from the workspace root builds `@meekmeet/core` then this app (type-checks + lints).
- There is no web test suite yet; the mobile workspace (`meek-meet-mobile`) has vitest coverage.
- Docs: DEPLOYMENT.md (infra + env), CRON_SETUP.md (schedulers), API.md (routes), GOVERNANCE.md (data policy).
