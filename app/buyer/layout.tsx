'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationPermission from '@/components/NotificationPermission';
import SmartShambaLogo from '@/components/SmartShambaLogo';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Settings, LogOut, Menu, X, ArrowLeftRight, AlertTriangle, Bell, Package, Brain, CloudRain, Wallet, FileText, MessageSquare, ClipboardList, ChevronDown } from 'lucide-react';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Core': true,
    'V2 Intelligence': true,
  });

  if (pathname === '/buyer/login') {
    return <>{children}</>;
  }

  const navSections = [
    {
      title: 'Core',
      items: [
        { href: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/buyer/demands', label: 'My Demands', icon: ClipboardList },
        { href: '/buyer/transactions', label: 'My Transactions', icon: ArrowLeftRight },
        { href: '/buyer/disputes', label: 'My Disputes', icon: AlertTriangle },
        { href: '/buyer/notifications', label: 'Notifications', icon: Bell },
        { href: '/buyer/farmers', label: 'Available Produce', icon: Package },
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#00703C] text-white p-4 flex items-center justify-between z-50 shadow-md h-16">
        <SmartShambaLogo variant="full" size="sm" theme="dark" />
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-green-700">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`w-72 bg-[#00703C] flex flex-col fixed top-0 left-0 bottom-0 shadow-xl z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-green-700/50 hidden lg:block">
          <SmartShambaLogo variant="full" size="md" theme="dark" />
        </div>

        <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title}>
              <button 
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-green-200 hover:text-white transition-colors"
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50
                        ${isActive ? 'bg-white/15 text-white font-semibold' : 'text-green-100 hover:bg-white/10 hover:text-white'}`}
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

        <div className="p-4 border-t border-green-700/50 space-y-3">
          <NotificationPermission />
          <LanguageSwitcher />
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-sm font-medium flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> {t.common.logout}
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">{children}</main>
    </div>
  );
}
