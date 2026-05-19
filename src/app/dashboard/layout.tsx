import Sidebar from "./_components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 overflow-auto">{children}</main>
    </div>
  );
}
