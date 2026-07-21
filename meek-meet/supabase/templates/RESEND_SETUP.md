# Resend SMTP Setup for Supabase Auth

This guide connects Resend to Supabase Auth so your magic links, invites, and password resets are sent through a professional email service instead of Supabase's limited built-in provider.

---

## Step 1: Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Sign up with your email or GitHub
3. Verify your account

---

## Step 2: Get Your SMTP Credentials

1. In the Resend dashboard, go to **Settings → SMTP**
2. Click **Generate SMTP Key**
3. Copy the following values:
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL) or `587` (STARTTLS)
   - **Username:** `resend`
   - **Password:** Your SMTP key (starts with `re_`)

> ⚠️ **Important:** This is different from your API key. The SMTP key is specifically for SMTP connections. Supabase Auth needs SMTP, not the API.

---

## Step 3: Configure Supabase Auth SMTP

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication → SMTP Settings**
3. Toggle **Enable Custom SMTP**
4. Fill in the fields:

| Field | Value |
|---|---|
| **SMTP Host** | `smtp.resend.com` |
| **SMTP Port** | `587` |
| **SMTP User** | `resend` |
| **SMTP Password** | Your Resend SMTP key (e.g., `re_xxxxxxxx`) |
| **Sender Name** | `Meek Meet` |
| **Sender Email** | `hello@meekmeet.app` (or your verified domain) |

5. Click **Save**

---

## Step 4: Verify a Domain (Recommended for Production)

For the best deliverability, verify your own domain instead of using `@resend.dev`:

1. In Resend dashboard, go to **Domains → Add Domain**
2. Enter your domain (e.g., `meekmeet.app`)
3. Add the DNS records (SPF, DKIM, DMARC) to your domain provider
4. Wait for verification (usually instant, sometimes up to 24 hours)
5. Update the **Sender Email** in Supabase to `hello@meekmeet.app`

**For testing:** You can skip domain verification and use `onboarding@resend.dev` as the sender email. Just note that emails will show "via resend.dev" to recipients.

---

## Step 5: Test It

1. Open the Meek Meet app on your Android emulator
2. Enter your email and tap **Send Magic Link**
3. Check your inbox (and spam, just in case)
4. The email should arrive within seconds from `Meek Meet <hello@meekmeet.app>`

---

## What's Already Set Up in This Project

The web app already has Resend integration for backend emails (meeting reminders). Check `meek-meet/src/lib/resend.ts`.

If you haven't already, update your `.env.local` with your actual Resend **API key** (different from the SMTP key):

```env
RESEND_API_KEY=re_your_api_key_here
```

The SMTP key is **only** for Supabase Auth settings in the dashboard. The API key is **only** for the web app's cron job code.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Emails not sending | Double-check the SMTP password is the SMTP key, not the API key |
| "Invalid credentials" in Supabase | Regenerate the SMTP key in Resend and paste the new one |
| Emails going to spam | Verify your domain with DNS records in Resend |
| Rate limited | Resend free tier: 100 emails/day. Paid: 50,000+/month. |
