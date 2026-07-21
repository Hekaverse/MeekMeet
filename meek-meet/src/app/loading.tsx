export default function Loading() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-cream">
      <div
        className="w-12 h-12 rounded-full border-4 border-wheat-pale border-t-wheat animate-spin"
        role="status"
        aria-label="Loading"
      />
    </section>
  );
}
