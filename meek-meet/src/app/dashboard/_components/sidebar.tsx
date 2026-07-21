"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  User,
  Shield,
  LogOut,
  Settings,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/meetings", label: "My Meetings", icon: Calendar },
  { href: "/dashboard/circles", label: "My Circles", icon: MapPin },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/shepherd", label: "Shepherd", icon: Shield },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { signOut, role } = useAuth();

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-midnight min-h-screen flex flex-col border-r border-wheat/10 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Logo + close button */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <Image src="/logo.png" alt="Meek Meet" width={32} height={32} className="h-8 w-auto rounded-md" />
          <span className="font-serif text-lg text-cream tracking-wide">
            Meek<span className="text-wheat">Meet</span>
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-cream/50 hover:text-cream hover:bg-wheat/10 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
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

        {role === "admin" && (
          <Link
            href="/dashboard/admin/applications"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
              pathname.startsWith("/dashboard/admin")
                ? "bg-wheat/10 text-wheat"
                : "text-cream/50 hover:text-cream hover:bg-wheat/5"
            }`}
          >
            <Settings className="w-4 h-4" strokeWidth={1.5} />
            Admin
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-wheat/10">
        <button
          onClick={() => {
            signOut();
            onClose();
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-cream/50 hover:text-cream hover:bg-wheat/5 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
