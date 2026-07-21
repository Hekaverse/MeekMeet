import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-cream grain-texture">
      <div className="text-center px-6">
        <span className="text-xs tracking-[0.3em] uppercase text-terracotta mb-4 block font-medium">
          Page not found
        </span>
        <h1 className="font-serif text-6xl md:text-7xl text-charcoal mb-6">
          404
        </h1>
        <p className="text-lg text-charcoal-muted max-w-md mx-auto mb-10">
          The page you are looking for has wandered off the path.
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-wheat text-midnight font-medium tracking-wide text-sm rounded-full hover:bg-wheat-light transition-all inline-block"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
