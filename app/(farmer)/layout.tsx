'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, ArrowLeftRight, AlertTriangle, Bell, Building2, LogOut, Menu, X } from 'lucide-react';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: t.dashboard.title, icon: LayoutDashboard },
    { href: '/dashboard/transactions', label: 'My Transactions', icon: ArrowLeftRight },
    { href: '/dashboard/disputes', label: 'My Disputes', icon: AlertTriangle },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/buyer', label: 'Buyer Directory', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#00703C] text-white p-4 flex items-center justify-between z-50 shadow-md h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-[#00703C] font-bold text-xs">SS</span>
          </div>
          <span className="font-bold text-sm">Farmer Portal</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Backdrop Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`w-72 bg-[#00703C] flex flex-col fixed top-0 left-0 bottom-0 shadow-xl z-50 transition-transform duration-300 ease-in-out 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-6 border-b border-green-700/50 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#00703C] font-bold text-sm">SS</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">{t.common.appName}</p>
              <p className="text-xs text-green-200">Farmer Portal</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Header inside Sidebar */}
        <div className="lg:hidden p-4 border-b border-green-700/50 flex justify-between items-center">
           <span className="text-white font-bold">Menu</span>
           <button onClick={() => setSidebarOpen(false)} className="text-white p-1" aria-label="Close menu">
             <X className="w-5 h-5" />
           </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50
                ${isActive ? 'bg-white/15 text-white font-semibold' : 'text-green-100 hover:bg-white/10 hover:text-white'}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-green-700/50 space-y-3">
          <LanguageSwitcher />
          <p className="text-xs text-green-300 mb-1 text-center">Dial *384*53374# to sell maize</p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t.common.logout}
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">{children}</main>
    </div>
  );
}
