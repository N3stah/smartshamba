'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, LayoutDashboard, History, User, Menu, X, LogOut } from 'lucide-react';

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
    <div className="min-h-screen bg-background flex">
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-surface text-text p-4 flex items-center justify-between z-50 shadow-sm h-16 border-b border-border">
        <div className="flex items-center gap-2">
          <Truck className="w-6 h-6 text-transport-primary" />
          <span className="font-bold">Transport Portal</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-transport-primary">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}

      <aside className={`w-72 bg-surface border-r border-border flex flex-col fixed top-0 left-0 bottom-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-border hidden lg:block">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-transport-primary" />
            <div>
              <p className="font-bold text-text">SmartShamba</p>
              <p className="text-xs text-gray-500">Logistics Portal</p>
            </div>
          </div>
        </div>
        
        <div className="lg:hidden p-4 border-b border-border flex justify-between items-center">
           <span className="text-text font-bold">Menu</span>
           <button onClick={() => setIsOpen(false)} className="text-gray-500 p-1"><X className="w-5 h-5" /></button>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setIsOpen(false)} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-transport-primary/50
                ${isActive ? 'bg-transport-secondary text-transport-primary font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-text'}`}
              >
                <item.icon className="w-5 h-5" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">{children}</main>
    </div>
  );
}
