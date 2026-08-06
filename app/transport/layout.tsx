'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, LayoutDashboard, History, User, Menu, X } from 'lucide-react';

export default function TransportLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/transport/login') return <>{children}</>;

  const navItems = [
    { href: '/transport/dashboard', label: 'Active Jobs', icon: LayoutDashboard },
    { href: '/transport/history', label: 'History', icon: History },
    { href: '/transport/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#00703C] text-white p-4 flex items-center justify-between z-50 h-16">
        <div className="flex items-center gap-2">
          <Truck className="w-6 h-6" />
          <span className="font-bold">Transport Portal</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`w-64 bg-[#00703C] text-white flex flex-col fixed h-full z-40 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-green-700/50 hidden lg:block">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8" />
            <div>
              <p className="font-bold">SmartShamba</p>
              <p className="text-xs text-green-200">Logistics Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${pathname === item.href ? 'bg-white/15 text-white font-semibold' : 'text-green-100 hover:bg-white/10'}`}>
              <item.icon className="w-5 h-5" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-green-700/50">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-sm font-medium">Sign Out</button>
          </form>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">{children}</main>
    </div>
  );
}
