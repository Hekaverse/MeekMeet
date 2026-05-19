"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  User,
  Shield,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/meetings", label: "My Meetings", icon: Calendar },
  { href: "/dashboard/circles", label: "My Circles", icon: MapPin },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/shepherd", label: "Shepherd", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="w-64 bg-midnight min-h-screen flex flex-col border-r border-wheat/10">
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Meek Meet" className="h-8 w-auto rounded-md" />
          <span className="font-serif text-lg text-cream tracking-wide">
            Meek<span className="text-wheat">Meet</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-wheat/10 text-wheat"
                  : "text-cream/50 hover:text-cream hover:bg-wheat/5"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-wheat/10">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-cream/50 hover:text-cream hover:bg-wheat/5 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
