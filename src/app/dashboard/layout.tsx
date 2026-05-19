export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      {/* Dashboard shell — sidebar and header will be added in Phase 5 */}
      <header className="h-16 bg-midnight border-b border-wheat/10 flex items-center px-6">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Meek Meet" className="h-8 w-auto rounded-md" />
          <span className="font-serif text-lg text-cream tracking-wide">
            Meek<span className="text-wheat">Meet</span>
          </span>
        </a>
      </header>
      <main className="p-6 lg:p-10">{children}</main>
    </div>
  );
}
