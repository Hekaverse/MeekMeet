# Cron & Automation Setup

Meek Meet relies on three scheduled jobs to keep the platform alive:

1. **Daily meeting reminders** — `/api/send-reminders` (18:00)
2. **Daily news-driven questions** — `/api/trigger-news-questions` (09:00)
3. **Meeting lifecycle** — `/api/meeting-lifecycle` (02:00): completes past meetings, triggers insight synthesis, generates monthly draft reports

## Authorization

All three endpoints accept exactly one credential:

```
Authorization: Bearer <CRON_SECRET>
```

There is no User-Agent check and no `?secret=` URL parameter (both were removed — User-Agent is spoofable and URL secrets leak into access logs). When `CRON_SECRET` is set as a Vercel environment variable, **Vercel Cron automatically sends this header** on every invocation, so no extra configuration is needed.

## Required Environment Variables

```bash
# Shared secret for all cron endpoints (generate a long random string)
CRON_SECRET=your-random-secret

# Used by the lifecycle route and the document upload flow
SUPABASE_SECRET_KEY=your-secret-key

# Public Supabase URL (already present for the app)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## Option A: Vercel Cron (Recommended)

The `vercel.json` defines all three jobs (18:00, 09:00, 02:00 daily). Vercel calls the endpoints automatically on deploy with the Bearer header attached. Confirm under **Vercel Dashboard → Your Project → Cron Jobs** after deploying.

## Option B: External Scheduler (cron-job.org, Supabase Cron, etc.)

Configure your scheduler to send the header (never put the secret in the URL):

```
GET https://your-domain.com/api/send-reminders
GET https://your-domain.com/api/trigger-news-questions
GET https://your-domain.com/api/meeting-lifecycle
Header: Authorization: Bearer <CRON_SECRET>
```

## Securing the Endpoints

The Bearer check is the only gate. For additional protection, add a reverse-proxy rate limit in production. `CRON_SECRET` must be long, random, and stored only in environment variables — rotate it if it ever appears in a log or URL.
