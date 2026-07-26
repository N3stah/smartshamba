'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import SmartShambaLogo from './SmartShambaLogo';

const navLinks = [
  { name: 'Verified Buyers', href: '/buyers' },
  { name: 'Market Prices', href: '/market-prices' },
  { name: 'Group Selling', href: '/group-selling' },
  { name: 'About Us', href: '/about' },
];

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link className="flex items-center gap-2" href="/">
          <SmartShambaLogo size="md" variant="full" />
        </Link>

        {/* Dynamic Nav Links */}
        <nav className="hidden items-center space-x-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-[#00703C] font-semibold bg-emerald-50/80' 
                    : 'text-gray-600 hover:text-[#00703C] hover:bg-gray-50'
                }`}
              >
                {link.name}
                {/* Animated Bottom Active Indicator Bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-[#00703C]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Portal Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link 
            href="/buyer/login" 
            className="rounded-lg border border-[#00703C] px-4 py-2 text-sm font-semibold text-[#00703C] transition-all hover:bg-emerald-50"
          >
            Buyer Portal
          </Link>
          <Link 
            href="/dashboard/login?from=%2Fdashboard" 
            className="rounded-lg bg-[#00703C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#00582f]"
          >
            Farmer Portal
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive 
                    ? 'text-[#00703C] font-semibold bg-emerald-50' 
                    : 'text-gray-600 hover:text-[#00703C] hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-gray-100">
            <Link 
              href="/buyer/login" 
              onClick={() => setIsOpen(false)}
              className="w-full text-center px-4 py-2 text-sm font-semibold text-[#00703C] border border-[#00703C] rounded-lg"
            >
              Buyer Portal
            </Link>
            <Link 
              href="/dashboard/login?from=%2Fdashboard" 
              onClick={() => setIsOpen(false)}
              className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-[#00703C] rounded-lg"
            >
              Farmer Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
