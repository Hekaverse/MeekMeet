import { createBrowserClient } from "@supabase/ssr";

// IMPORTANT: these must stay direct `process.env.NEXT_PUBLIC_*` references.
// Next.js statically inlines NEXT_PUBLIC_* vars into the browser bundle at
// build time — but ONLY for direct member access. Dynamic access such as
// `process.env[name]` (e.g. via requireEnv) is not inlinable and evaluates
// to undefined in the browser. requireEnv is for server-side modules only.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  );
}

export function createClient() {
  // Guarded at module load above; `!` is safe and keeps the references direct.
  return createBrowserClient(supabaseUrl!, supabaseKey!);
}
