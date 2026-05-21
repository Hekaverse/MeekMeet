import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  console.log("[DEBUG] URL JSON:", JSON.stringify(url));
  console.log("[DEBUG] URL length:", url.length);
  console.log("[DEBUG] Last char code:", url.charCodeAt(url.length - 1));
  console.log("[DEBUG] Key length:", key.length);

  return createBrowserClient(url, key);
}
