# Meek Meet — Deployment & Operations Runbook

This guide walks you through deploying and operating the complete Meek Meet platform: Next.js web app, Capacitor mobile app, Supabase backend, Edge Functions, and cron automation.

---

## 1. Prerequisites

- **Node.js** 20+ (check `.nvmrc`)
- **npm** 10+
- A **Supabase** project (cloud or self-hosted)
- A **Vercel** account (for web hosting and cron jobs)
- A **Resend** account (for email)
- A **Groq** account (for AI synthesis)
- (Optional) **Google Cloud** project with Maps API enabled
- (Optional) **NewsAPI** key (for daily news questions)

---

## 2. Initial Repository Setup

```bash
# Clone / navigate to the project root
 cd "C:/projects/Meek Meet"

# Install all workspace dependencies
 npm install --workspaces

# Build the shared core package
 npm run build --workspace=@meekmeet/core
```

---

## 3. Environment Variables

Create `meek-meet/.env.local` from the template and fill in all values:

```bash
 cp meek-meet/.env.local.example meek-meet/.env.local
```

### Required variables for the web app

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
SUPABASE_SECRET_KEY=<your-secret-key>

# Email
RESEND_API_KEY=<your-resend-api-key>

# Cron protection (set a strong random string)
CRON_SECRET=<random-32-char-string>

# AI synthesis & question generation
GROQ_API_KEY=<your-groq-key>

# Optional: news-driven questions
NEWS_API_KEY=<your-newsapi-key>

# Optional: geocoding circle locations
GOOGLE_MAPS_API_KEY=<your-google-maps-key>
```

### Required variables for the mobile app

Create `meek-meet-mobile/.env`:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

### Edge Function secrets (set in Supabase Dashboard)

In your Supabase project, go to **Project Settings → Edge Functions → Secrets** and add:

```
GROQ_API_KEY=<your-groq-key>
SB_URL=https://<project-ref>.supabase.co
SB_SECRET_KEY=<your-secret-key>
NEWS_API_KEY=<your-newsapi-key>  # optional
```

---

## 4. Database Migrations

### Apply migrations to Supabase

From the `meek-meet` directory:

```bash
 npx supabase login
 npx supabase link --project-ref <project-ref>
 npx supabase db push
```

This will apply all migrations in `supabase/migrations/` in order.

### Verify key tables exist

In the Supabase SQL Editor, run:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:

```
applications (legacy, dropped by migration 000017)
authorities
authority_submissions
circle_actions
circle_insights
circle_questions
circle_routines
circle_shepherds
circles
cross_references
curated_daily
generated_questions
global_insights
meeting_analytics
meeting_questions
meetings
news_questions
place_service_times
profiles
question_lineage
reports
responses
rsvps
shepherd_application_documents
shepherd_applications
weekly_themes
```

### Configure database settings for the synthesis trigger

The automatic meeting-synthesis trigger needs two values: the project ref (stored in `public.meek_meet_config`) and the service-role key (stored in **Supabase Vault** — never in a table; migration `000025` removed it from `meek_meet_config` and made that table read-only for admins).

Run this in the Supabase SQL Editor, replacing the placeholders with your actual values:

```sql
INSERT INTO public.meek_meet_config (key, value)
VALUES ('supabase_project_ref', '<your-project-ref>')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

SELECT vault.create_secret('<your-service-role-key>', 'supabase_service_role_key');
```

> **Security note:** the service-role key lives only in the Vault. The `trigger_meeting_synthesis()` function (SECURITY DEFINER) reads it from `vault.decrypted_secrets` at fire time to invoke the `synthesize-meeting` Edge Function. API roles cannot read the Vault, and `meek_meet_config` holds no secrets.

To verify:

```sql
SELECT value FROM public.meek_meet_config WHERE key = 'supabase_project_ref';
SELECT name FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';
```

---

## 5. Supabase Storage Bucket

Migration `000018` creates the `shepherd-documents` bucket automatically. Verify it exists:

1. Go to **Supabase Dashboard → Storage → Buckets**.
2. You should see `shepherd-documents` with a 10 MB file size limit and allowed types:
   - `application/pdf`
   - `image/jpeg`
   - `image/png`
   - `image/webp`

If the bucket is missing, run:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shepherd-documents',
  'shepherd-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

---

## 6. Edge Functions Deployment

Deploy all Edge Functions to Supabase:

```bash
 cd meek-meet
 npx supabase functions deploy generate-news-questions
 npx supabase functions deploy synthesize-meeting
 npx supabase functions deploy synthesize-circle
 npx supabase functions deploy synthesize-region
 npx supabase functions deploy generate-next-questions
```

Verify they appear in **Supabase Dashboard → Edge Functions**.

---

## 7. Vercel Deployment

### Deploy the web app

Because Meek Meet uses npm workspaces, deploy from the workspace root:

```bash
 cd "C:/projects/Meek Meet"
 npx vercel --prod
```

The root `package.json` builds `@meekmeet/core` first, then the Next.js app. The root `vercel.json` tells Vercel to output from `meek-meet/.next`.

### Configure environment variables in Vercel

In the Vercel dashboard for your project, add all variables from `meek-meet/.env.local` to **Settings → Environment Variables**.

### Verify cron jobs

The `vercel.json` in `meek-meet/` defines three cron jobs:

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/send-reminders` | 0 18 * * * | Daily meeting reminder emails |
| `/api/trigger-news-questions` | 0 9 * * * | Daily news-driven question generation |
| `/api/meeting-lifecycle` | 0 2 * * * | Complete past meetings, synthesise insights, generate reports |

After deploying, go to **Vercel Dashboard → Your Project → Cron Jobs** to confirm they are registered.

### Test cron endpoints manually

```bash
 curl -H "Authorization: Bearer $CRON_SECRET" "https://your-domain.com/api/send-reminders"
 curl -H "Authorization: Bearer $CRON_SECRET" "https://your-domain.com/api/trigger-news-questions"
 curl -H "Authorization: Bearer $CRON_SECRET" "https://your-domain.com/api/meeting-lifecycle"
```

The endpoints accept ONLY the `Authorization: Bearer` header — no URL secrets, no User-Agent checks. Vercel Cron sends this header automatically when the `CRON_SECRET` environment variable is set on the project.

---

## 8. Mobile App Build

### Install Capacitor platforms and sync

```bash
 cd meek-meet-mobile
 npm install
 npx cap sync android
```

### Build the web bundle

```bash
 npm run build
```

### Open Android Studio

```bash
 npx cap open android
```

From Android Studio, build and run on a device or emulator.

---

## 9. First-Time Configuration

### Create an admin user

1. Sign up through the web or mobile app.
2. In Supabase SQL Editor, promote your user:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

### Seed sample authorities

1. Log in as admin on the web.
2. Go to **Dashboard → Admin → Authorities**.
3. Click **Seed Samples** to add Sydney, Brisbane, and Melbourne councils.
4. Add your own local authorities as needed.

### Geocode existing circles

For each circle you want to link to regional insights:

1. Go to **Dashboard → Shepherd → [Circle] → Settings** (or use SQL).
2. Ensure the circle has a `location` or `meeting_address`.
3. The `updateCircleRegion` server action can be called manually or wired into the settings page.

Alternatively, run geocoding via SQL if you have the Google Maps API key configured in the app:

```sql
-- Note: geocoding currently happens through the Next.js server action.
-- For bulk geocoding, use the mobile/web UI or extend the settings page.
```

---

## 10. Testing the Full Flow

### Web flow test

1. Visit `/shepherd/apply` and submit an application with documents.
2. As admin, go to **Admin → Applications**, approve the user.
3. As admin, go to **Admin → Verification** and verify the uploaded documents.
4. As the approved shepherd, create a circle at `/dashboard/circles`.
5. Add questions, schedule a meeting.
6. RSVP to the meeting from another account.

### Mobile flow test

1. Sign in on the mobile app.
2. Join the circle.
3. Attend the meeting and submit responses.

### Synthesis flow test

1. Mark the meeting as completed (or wait for the lifecycle cron).
2. Check `meeting_analytics` in Supabase — a row should appear.
3. Trigger circle synthesis:

```bash
 curl -X POST "https://<project-ref>.supabase.co/functions/v1/synthesize-circle" \
   -H "Authorization: Bearer $SUPABASE_SECRET_KEY" \
   -H "Content-Type: application/json" \
   -d '{"circle_id":"<circle-id>","time_window":"all_time"}'
```

4. Check `circle_insights` for the new row.

### Report and advocacy test

1. As shepherd, go to **Dashboard → [Circle] → Reports**.
2. Generate a report.
3. Ensure an authority exists matching the circle's region.
4. Click **Submit to Authority**.
5. Check `authority_submissions` and the recipient inbox.

---

## 11. Monitoring & Debugging

### Supabase Edge Function logs

**Supabase Dashboard → Edge Functions → [Function] → Logs**

### Vercel function logs

**Vercel Dashboard → Your Project → Functions**

### Key SQL diagnostics

```sql
-- Pending shepherd applications
SELECT id, full_name, email, status, created_at
FROM public.shepherd_applications
WHERE status = 'pending';

-- Recent meeting analytics
SELECT meeting_id, response_count, generated_at
FROM public.meeting_analytics
ORDER BY generated_at DESC
LIMIT 10;

-- Circle insights
SELECT circle_id, time_window, response_count, generated_at
FROM public.circle_insights
ORDER BY generated_at DESC
LIMIT 10;

-- Authority submissions
SELECT s.id, a.name, s.status, s.submitted_at
FROM public.authority_submissions s
JOIN public.authorities a ON a.id = s.authority_id
ORDER BY s.submitted_at DESC
LIMIT 10;
```

---

## 12. Common Issues

### `Cannot find module '@meekmeet/core'`

Run from the workspace root:

```bash
 npm install --workspaces
 npm run build --workspace=@meekmeet/core
```

### Edge Function returns 401

- Confirm `SB_SECRET_KEY` is set in the Supabase Edge Function secrets.
- Confirm the request Authorization header uses `Bearer $SUPABASE_SECRET_KEY` (or `$SB_SECRET_KEY` inside the function code).

### Database trigger not invoking synthesis

- Verify the `supabase_project_ref` and `supabase_service_role_key` rows exist in `public.meek_meet_config`.
- Confirm `pg_net` extension is enabled: `CREATE EXTENSION IF NOT EXISTS pg_net;`
- Check Supabase logs for `RAISE NOTICE` messages from `trigger_meeting_synthesis`.

### Reminder emails not sending

- Confirm `CRON_SECRET` matches the value used by the scheduler.
- Confirm `RESEND_API_KEY` is set in Vercel.
- Verify `CRON_SETUP.md` for scheduler configuration.

### Mobile tests failing

```bash
 cd meek-meet-mobile
 npm test -- --run
```

If tests fail after schema changes, update test mocks to match the current table/field names.

---

## 13. Production Checklist

- [ ] All migrations applied
- [ ] All env vars set in Vercel and Supabase
- [ ] Edge Functions deployed
- [ ] Storage bucket created and policies active
- [ ] Database trigger settings configured
- [ ] Admin user promoted
- [ ] Authorities seeded for target regions
- [ ] Circles geocoded
- [ ] Vercel cron jobs registered
- [ ] Web production build passes
- [ ] Mobile app builds and runs
- [ ] End-to-end flow tested
- [ ] `GOVERNANCE.md` and `API.md` reviewed

---

## 14. Next Iterations

After launch, consider:

- Adding rate limiting to public endpoints.
- Implementing verified state WWCC API checks.
- Building an authority response tracking UI.
- Adding SMS reminders via Twilio.
- Expanding the public dashboard with maps and trends.
- Forming the proposed ethics oversight board.
