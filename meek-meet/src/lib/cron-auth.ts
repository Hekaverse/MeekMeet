import { NextRequest } from "next/server";

// Vercel Cron automatically sends an Authorization: Bearer <CRON_SECRET>
// header when the CRON_SECRET environment variable is set.
export function isAuthorizedCron(request: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return false;
  return (
    request.headers.get("authorization") ===
    `Bearer ${process.env.CRON_SECRET}`
  );
}
