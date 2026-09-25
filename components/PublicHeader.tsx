"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "How It Works", href: "/how-it-works" },
  { name: "Verified Buyers", href: "/buyers" },
  { name: "Market Prices", href: "/market-prices" },
  { name: "Group Selling", href: "/group-selling" },
  { name: "About Us", href: "/about" },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-text font-serif">
            SmartShamba
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-public-primary border-b-2 border-public-primary pb-4"
                    : "text-gray-600 hover:text-public-primary"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/dashboard/login" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-public-primary">Farmer</Link>
          <Link href="/buyer/login" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-public-primary">Buyer</Link>
          <Link href="/transport/login" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-public-primary">Transport</Link>
          <Link href="/admin/login" className="ml-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-public-primary hover:bg-public-primary/90">Admin</Link>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-public-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-public-primary"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? "bg-public-secondary text-public-primary"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 pb-3 border-t border-border">
              <Link href="/dashboard/login" className="block px-3 py-2 text-base font-medium text-gray-600">Farmer Login</Link>
              <Link href="/buyer/login" className="block px-3 py-2 text-base font-medium text-gray-600">Buyer Login</Link>
              <Link href="/transport/login" className="block px-3 py-2 text-base font-medium text-gray-600">Transport Login</Link>
              <Link href="/admin/login" className="block px-3 py-2 text-base font-medium text-public-primary">Admin Login</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
