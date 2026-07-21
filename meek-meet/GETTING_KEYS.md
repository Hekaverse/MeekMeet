# Meek Meet — How to Get All Required API Keys

This guide walks you through obtaining every credential needed to run Meek Meet.

---

## 1. Supabase (Database, Auth, Storage, Edge Functions)

### Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in.
2. Click **New Project**.
3. Choose an organisation, name the project (e.g., `meek-meet`), and set a secure database password. **Save this password** — you cannot recover it.
4. Wait for the project to provision (usually 1–2 minutes).

### Get your Supabase URL and keys

1. In the Supabase dashboard, go to **Project Settings → API**.
2. You will see:
   - **Project URL** — this is `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys**
     - `publishable` — this is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `secret` — this is `SUPABASE_SECRET_KEY`
3. Copy the **Project URL** and the **publishable** key first.
4. Click **Reveal** next to **secret** and copy it.

> ⚠️ The `secret` key bypasses Row Level Security. Never expose it in client-side code.

### Get your project reference

Your project reference is the subdomain of your Supabase URL.

If your URL is:

```
https://abc123def456ghi.supabase.co
```

Then your project reference is:

```
abc123def456ghi
```

This is used when inserting the trigger config into `public.meek_meet_config` and when deploying Edge Functions.

---

## 2. Resend (Email)

### Sign up

1. Go to [https://resend.com](https://resend.com) and create an account.
2. Verify your email.

### Add and verify a domain

1. Go to **Domains → Add Domain**.
2. Enter your domain (e.g., `meekmeet.com`).
3. Resend will give you DNS records (SPF, DKIM, DMARC).
4. Add these records in your domain registrar or DNS provider (Cloudflare, Namecheap, etc.).
5. Wait for verification (can take minutes to hours).

### Get your API key

1. Go to **API Keys** in the Resend dashboard.
2. Click **Create API Key**.
3. Name it `Meek Meet Production`.
4. Select **Sending access**.
5. Copy the key — this is `RESEND_API_KEY`.

### Update the from address

In `meek-meet/src/app/actions.ts`, `meek-meet/src/app/dashboard/admin/actions.ts`, and other email-sending files, update:

```ts
from: "Meek Meet <hello@meekmeet.com>",
```

Replace `hello@meekmeet.com` with a verified address from your domain.

---

## 3. Groq (AI Synthesis)

### Sign up

1. Go to [https://groq.com](https://groq.com) and create an account.

### Create an API key

1. Go to the Groq console: [https://console.groq.com](https://console.groq.com)
2. Navigate to **API Keys**.
3. Click **Create API Key**.
4. Name it `Meek Meet`.
5. Copy the key — this is `GROQ_API_KEY`.

> Groq has a generous free tier. Production scale may require a paid plan.

---

## 4. Google Maps API (Geocoding)

This is optional but recommended so circles can be automatically mapped to regions.

### Create a Google Cloud project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (e.g., `meek-meet`).

### Enable the Geocoding API

1. In the Google Cloud Console, go to **APIs & Services → Library**.
2. Search for **Geocoding API**.
3. Click **Enable**.

### Create an API key

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → API key**.
3. Copy the key — this is `GOOGLE_MAPS_API_KEY`.

### Restrict the key (recommended)

1. Click the key to edit it.
2. Under **Application restrictions**, choose **HTTP referrers (web sites)** or **IP addresses**.
3. Under **API restrictions**, select **Geocoding API** only.
4. Save.

> Google Cloud gives a recurring free credit. The Geocoding API is pay-as-you-go after that.

---

## 5. NewsAPI (Daily News Questions)

This is optional.

1. Go to [https://newsapi.org](https://newsapi.org).
2. Sign up for a free account.
3. Go to your account page to find your API key.
4. Copy the key — this is `NEWS_API_KEY`.

> The free tier is limited to 100 requests/day and only supports `/top-headlines` for development. Production may require a paid plan.

---

## 6. CRON_SECRET

This is just a strong random string. You can generate it on any system:

### On Linux/Mac/Git Bash:

```bash
openssl rand -base64 32
```

### On Windows PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

### Online generator

Use [https://1password.com/password-generator/](https://1password.com/password-generator/) and select a 32-character random password.

Copy the result — this is `CRON_SECRET`.

---

## 7. Summary Checklist

Before deploying, you should have copied these values:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API → publishable |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API → secret |
| `VITE_SUPABASE_URL` | Same as `NEXT_PUBLIC_SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `SB_URL` | Same as `NEXT_PUBLIC_SUPABASE_URL` (set in Supabase Edge Function secrets) |
| `SB_SECRET_KEY` | Same as `SUPABASE_SECRET_KEY` (set in Supabase Edge Function secrets) |
| `RESEND_API_KEY` | Resend → API Keys |
| `GROQ_API_KEY` | Groq Console → API Keys |
| `GOOGLE_MAPS_API_KEY` | Google Cloud → Credentials → API key |
| `NEWS_API_KEY` | NewsAPI.org account |
| `CRON_SECRET` | Generated locally |
| `<your-project-ref>` | Subdomain of Supabase URL |

---

## 8. Estimated Monthly Costs

| Service | Free Tier | Typical Paid Cost |
|---------|-----------|-------------------|
| Supabase | Generous free tier | $25–$100+/month at scale |
| Vercel | Hobby tier free | $20–$150+/month |
| Resend | 3,000 emails/day free | $0.0009 per email |
| Groq | Generous free tier | Usage-based, often under $50/month |
| Google Maps | $200 monthly credit | Geocoding: $5 per 1,000 requests |
| NewsAPI | 100 requests/day | Paid plans from $449/month |

Start with free tiers and upgrade only when usage grows.
