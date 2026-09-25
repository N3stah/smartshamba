'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationPermission from '@/components/NotificationPermission';
import SmartShambaLogo from '@/components/SmartShambaLogo';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, ArrowLeftRight, AlertTriangle, Bell, MapPin, Tag, Settings, LogOut, Menu, X, BarChart2, Brain, CloudRain, Wallet, FileText, MessageSquare, ClipboardList, ChevronDown } from 'lucide-react';

export default function BuyerLayout({ children }: { children: React.ReactNode}) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Core': true,
    'V2 Intelligence': true,
  });

  const navSections = [
    {
      title: 'Core',
      items: [
        { href: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/buyer/demands', label: 'Active Demands', icon: ClipboardList },
        { href: '/buyer/transactions', label: 'My Transactions', icon: ArrowLeftRight },
        { href: '/buyer/disputes', label: 'My Disputes', icon: AlertTriangle },
        { href: '/buyer/notifications', label: 'Notifications', icon: Bell},
        { href: '/buyer/farmers', label: 'Farmer Directory', icon: Tag},
        { href: '/buyer/nearby', label: 'Nearby Farmers', icon: MapPin},
        { href: '/buyer/settings', label: 'Settings', icon: Settings },
      ]
    },
    {
      title: 'V2 Intelligence',
      items: [
        { href: '/buyer/ai-procurement', label: 'AI Procurement', icon: Brain },
        { href: '/buyer/weather', label: 'Weather & Climate', icon: CloudRain },
        { href: '/buyer/wallet', label: 'My Wallet', icon: Wallet },
        { href: '/buyer/contracts', label: 'My Contracts', icon: FileText },
        { href: '/buyer/assistant', label: 'AI Assistant', icon: MessageSquare },
      ]
    }
  ];

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  if (pathname.endsWith('/login')) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-surface text-text p-4 flex items-center justify-between z-50 shadow-sm h-16 border-b border-border">
        <SmartShambaLogo variant="full" size="sm" theme="light" />
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-buyer-primary" aria-label={sidebarOpen ? "Close menu" : "Open menu"}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6"/>}
        </button>
      </header>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <aside className={`w-72 bg-surface border-r border-border flex flex-col fixed top-0 left-0 bottom-0 z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-border hidden lg:block">
          <SmartShambaLogo variant="full" size="md" theme="light" />
        </div>
        
        <div className="lg:hidden p-4 border-b border-border flex justify-between items-center">
           <span className="text-text font-bold">Menu</span>
           <button onClick={() => setSidebarOpen(false)} className="text-gray-500 p-1" aria-label="Close menu"><X className="w-5 h-5" /></button>
        </div>

        <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title}>
              <button 
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-text transition-colors"
              >
                <span>{section.title}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openSections[section.title] ? 'rotate-180' : ''}`} />
              </button>
              {openSections[section.title] && (
                <div className="mt-1 space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-buyer-primary/50
                        ${isActive ? 'bg-buyer-secondary text-buyer-primary font-semibold' : 'text-gray-600 hover:bg-background hover:text-text'}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <NotificationPermission />
          <LanguageSwitcher />
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> {t.common.logout}
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">{children}</main>
    </div>
  );
}
