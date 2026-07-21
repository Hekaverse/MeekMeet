# Meek Meet Email Templates

All templates use your brand palette (midnight, terracotta, wheat, cream) with a warm, premium feel.

## How to Install

Go to **Supabase Dashboard → Authentication → Email Templates**.

For each template below, copy the HTML file contents and paste it into the matching template editor. Click **Save** after each one.

---

### 1. Magic Link
**File:** `magic-link.html`

Sent when a user requests to sign in via email.

**Paste into:** Email Templates → Magic Link

---

### 2. Confirm Signup
**File:** `confirm-signup.html`

Sent when a new user signs up and needs to verify their email address.

**Paste into:** Email Templates → Confirm Signup

---

### 3. Invite User
**File:** `invite-user.html`

Sent when you invite someone to join Meek Meet (e.g., inviting a shepherd).

**Paste into:** Email Templates → Invite User

---

### 4. Recovery (Reset Password)
**File:** `recovery.html`

Sent when a user requests a password reset.

**Paste into:** Email Templates → Recovery

---

### 5. Email Change
**File:** `email-change.html`

Sent when a user updates their email address and needs to confirm the new one.

**Paste into:** Email Templates → Email Change

---

## Redirect URL Setup (Required for Mobile)

Go to **Supabase Dashboard → Authentication → URL Configuration**.

Add this to your **Redirect URLs**:

```
com.meekmeet.app://auth/callback
```

Also ensure your **Site URL** is set to your web app domain (e.g., `https://meekmeet.app`).

---

## Logo Hosting

The magic link template references the Meek Meet logo via a public URL:
```
https://meekmeet.com/logo.png
```
Make sure your logo is available at this URL (it should be automatically served from `public/logo.png` on your deployed web app). If your domain differs, update the `src` attribute in the template.

## Template Features

- **Responsive** — works on mobile and desktop
- **On-brand** — midnight header, terracotta CTAs, warm cream backgrounds
- **Accessible** — high contrast text, clear hierarchy
- **Professional** — gradient header, subtle decorative elements, refined spacing
- **Consistent** — all 5 templates share the same visual language
- **Bulletproof buttons** — centered CTA buttons using table-based layout for maximum email client compatibility
