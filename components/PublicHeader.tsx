'use client';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#00703C] rounded-lg flex items-center justify-center text-white font-bold text-sm">SS</div>
          <span className="font-bold text-lg text-gray-900">SmartShamba</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/buyers" className="hover:text-[#00703C] transition-colors">Verified Buyers</Link>
          <Link href="/market-prices" className="hover:text-[#00703C] transition-colors">Market Prices</Link>
          <Link href="/group-selling" className="hover:text-[#00703C] transition-colors">Group Selling</Link>
          <Link href="/about" className="hover:text-[#00703C] transition-colors">About Us</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/buyer/login" className="px-4 py-2 text-sm font-semibold text-[#00703C] border border-[#00703C] rounded-lg hover:bg-green-50 transition-colors">
            Buyer Portal
          </Link>
          <Link href="/dashboard/login?from=%2Fdashboard" className="px-4 py-2 text-sm font-semibold text-white bg-[#00703C] rounded-lg hover:bg-green-800 transition-colors">
            Farmer Portal
          </Link>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4">
          <Link href="/buyers" className="block text-gray-600 hover:text-[#00703C]">Verified Buyers</Link>
          <Link href="/market-prices" className="block text-gray-600 hover:text-[#00703C]">Market Prices</Link>
          <Link href="/group-selling" className="block text-gray-600 hover:text-[#00703C]">Group Selling</Link>
          <Link href="/about" className="block text-gray-600 hover:text-[#00703C]">About Us</Link>
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
            <Link href="/buyer/login" className="w-full text-center px-4 py-2 text-sm font-semibold text-[#00703C] border border-[#00703C] rounded-lg">Buyer Portal</Link>
            <Link href="/dashboard/login?from=%2Fdashboard" className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-[#00703C] rounded-lg">Farmer Portal</Link>
          </div>
        </div>
      )}
    </header>
  );
}
