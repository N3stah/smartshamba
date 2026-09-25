'use client';
import SmartShambaLogo from '@/components/SmartShambaLogo';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';
import { 
  LayoutDashboard, ArrowLeftRight, Building2, Users, Bell, Megaphone, 
  ShieldCheck, LogOut, Menu, X, BarChart2, Package, 
  ChevronDown, CloudRain, Truck, Map, Fence, Wallet, FileText, Brain, Settings
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'OVERVIEW': true,
    'MARKETPLACE': true,
    'RISK & RESOLUTION': true,
    'OPERATIONS': true,
    'FINANCE': true,
    'COMMUNICATIONS': true,
    'INSIGHTS': true,
    'SYSTEM': true,
  });
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'MARKETPLACE',
      items: [
        { href: '/admin/farmers', label: 'Farmers', icon: Users },
        { href: '/admin/buyers', label: 'Buyers', icon: Building2 },
        { href: '/admin/listings', label: 'Listings', icon: Package },
        { href: '/admin/demands', label: 'Demands', icon: Megaphone },
        { href: '/admin/groups', label: 'Groups', icon: Users },
        { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
      ]
    },
    {
      title: 'RISK & RESOLUTION',
      items: [
        { href: '/admin/disputes', label: 'Disputes', icon: ShieldCheck },
        { href: '/admin/reputation', label: 'Reputation', icon: ShieldCheck },
        { href: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { href: '/admin/transport-providers', label: 'Transport Providers', icon: Truck },
        { href: '/admin/logistics', label: 'Logistics', icon: Truck },
        { href: '/admin/map', label: 'Map', icon: Map },
        { href: '/admin/geofences', label: 'Geofences', icon: Fence },
        { href: '/admin/weather-dashboard', label: 'Weather', icon: CloudRain },
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { href: '/admin/finance', label: 'Finance', icon: Wallet },
      ]
    },
    {
      title: 'COMMUNICATIONS',
      items: [
        { href: '/admin/notifications', label: 'Notifications', icon: Bell },
        { href: '/admin/advisories', label: 'Advisories', icon: Megaphone },
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
        { href: '/admin/reports', label: 'Reports', icon: Package },
        { href: '/admin/ai-dashboard', label: 'AI Intelligence', icon: Brain },
        { href: '/admin/contract-analytics', label: 'Contracts', icon: FileText },
        { href: '/admin/contract-templates', label: 'Contract Templates', icon: FileText },
        { href: '/admin/executive', label: 'Executive', icon: BarChart2 },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { href: '/admin/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-surface text-text p-4 flex items-center justify-between z-50 shadow-sm h-16 border-b border-border">
        <SmartShambaLogo variant="full" size="sm" theme="light" />
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-admin-primary"
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
        className={`w-72 bg-surface border-r border-border flex flex-col fixed top-0 left-0 bottom-0 z-50 transition-transform duration-300 ease-in-out 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-6 border-b border-border hidden lg:block">
          <SmartShambaLogo variant="full" size="md" theme="light" />
        </div>

        {/* Mobile Header inside Sidebar */}
        <div className="lg:hidden p-4 border-b border-border flex justify-between items-center">
           <span className="text-text font-bold">Menu</span>
           <button onClick={() => setSidebarOpen(false)} className="text-gray-500 p-1" aria-label="Close menu">
             <X className="w-5 h-5" />
           </button>
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-admin-primary/50
                        ${isActive ? 'bg-admin-secondary text-admin-primary font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-text'}`}
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
          <LanguageSwitcher />
          <form action="/api/admin/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t.common.logout}
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-20 lg:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
