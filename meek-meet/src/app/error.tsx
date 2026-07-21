"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-cream grain-texture">
      <div className="text-center px-6">
        <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
          Something went wrong
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-charcoal mb-6">
          Something went wrong
        </h1>
        <p className="text-lg text-charcoal-muted max-w-md mx-auto mb-10">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-wheat text-midnight font-medium tracking-wide text-sm rounded-full hover:bg-wheat-light transition-all"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
