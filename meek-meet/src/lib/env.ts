// Fail-fast environment variable access: throws a clear error naming the
// missing variable instead of relying on non-null assertions.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
