"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import SmartShambaLogo from "./SmartShambaLogo";

const navLinks = [
  { name: "How It Works", href: "/how-it-works" },
  { name: "Verified Buyers", href: "/buyers" },
  { name: "Market Prices", href: "/market-prices" },
  { name: "Group Selling", href: "/group-selling" },
  { name: "About Us", href: "/about" },
];

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2" href="/">
          <SmartShambaLogo size="sm" variant="full" />
        </Link>

        <nav className="hidden items-center space-x-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={"relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors " + (
                  isActive 
                    ? "text-[#00703C] font-semibold bg-emerald-50" 
                    : "text-gray-600 hover:text-[#00703C] hover:bg-gray-50"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/dashboard/login?from=%2Fdashboard" className="rounded-md bg-[#00703C] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#00582f]">
            Farmer
          </Link>
          <Link href="/buyer/login" className="rounded-md border border-[#00703C] px-3.5 py-1.5 text-xs font-semibold text-[#00703C] transition-colors hover:bg-green-50">
            Buyer
          </Link>
          <Link href="/transport/login" className="rounded-md border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            Transport
          </Link>
          <Link href="/admin/login?from=%2Fadmin" className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 ml-1">
            Admin
          </Link>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className={"block px-3 py-2 rounded-lg text-sm font-medium " + (
                  isActive 
                    ? "text-[#00703C] font-semibold bg-emerald-50" 
                    : "text-gray-600 hover:text-[#00703C] hover:bg-gray-50"
                )}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-gray-100">
            <Link href="/dashboard/login?from=%2Fdashboard" className="w-full text-center bg-[#00703C] text-white px-4 py-2.5 rounded-lg text-sm font-semibold">Farmer Portal</Link>
            <Link href="/buyer/login" className="w-full text-center border border-[#00703C] text-[#00703C] px-4 py-2.5 rounded-lg text-sm font-semibold">Buyer Portal</Link>
            <Link href="/transport/login" className="w-full text-center border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold">Transport Portal</Link>
            <Link href="/admin/login?from=%2Fadmin" className="w-full text-center text-gray-500 text-xs mt-2">Admin Login</Link>
          </div>
        </div>
      )}
    </header>
  );
}
