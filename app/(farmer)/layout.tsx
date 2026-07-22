'use client';

import { useState } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-green-800 text-white p-4 flex items-center justify-between z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-green-800 font-bold text-xs">SS</span>
          </div>
          <span className="font-bold text-sm">{t.common.appName}</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={sidebarOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`w-64 bg-green-800 flex flex-col fixed h-full shadow-lg z-50 transition-transform duration-300 ease-in-out 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 top-0 lg:top-0`}
      >
        <div className="p-6 border-b border-green-700 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-green-800 font-bold text-sm">SS</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">{t.common.appName}</p>
              <p className="text-xs text-green-200">Farmer Portal</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Header inside Sidebar */}
        <div className="lg:hidden p-4 border-b border-green-700 flex justify-between items-center">
           <span className="text-white font-bold">Menu</span>
           <button onClick={() => setSidebarOpen(false)} className="text-white p-1" aria-label="Close menu">✕</button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            <span aria-hidden="true">📊</span><span>{t.dashboard.title}</span>
          </Link>
          <Link href="/dashboard/transactions" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            <span aria-hidden="true">🔄</span><span>My Transactions</span>
          </Link>
          <Link href="/dashboard/disputes" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            <span aria-hidden="true">⚠️</span><span>My Disputes</span>
          </Link>
          <Link href="/dashboard/notifications" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            <span aria-hidden="true">🔔</span><span>Notifications</span>
          </Link>
          <Link href="/buyer" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            <span aria-hidden="true">🏢</span><span>Buyer Directory</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-green-700 space-y-3">
          <LanguageSwitcher />
          <p className="text-xs text-green-300 mb-1">Dial *384*53374# to sell maize</p>
          <form action="/api/auth/logout" method="POST">
            <button type="submit"
              className="w-full text-left text-sm text-green-200 hover:text-white hover:bg-green-700 transition-colors px-3 py-2 rounded-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white">
              <span aria-hidden="true">←</span><span>{t.common.logout}</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">{children}</main>
    </div>
  );
}
