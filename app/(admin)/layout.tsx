import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-green-800 flex flex-col fixed h-full shadow-lg">
        {/* Logo */}
        <div className="p-6 border-b border-green-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-green-800 font-bold text-sm">SS</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">SmartShamba</p>
              <p className="text-xs text-green-200">Operations Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-4 space-y-1">
  <NavLink href="/admin" label="Dashboard" icon="📊" />
  <NavLink href="/admin/transactions" label="Transactions" icon="🔄" />
  <NavLink href="/admin/buyers" label="Buyers" icon="🏢" />
  <NavLink href="/admin/farmers" label="Farmers" icon="👨‍🌾" />
  <NavLink href="/admin/notifications" label="Notifications" icon="🔔" />
  <NavLink href="/admin/advisories"    label="Advisories"    icon="📢" />

  <form action="/api/admin/auth/logout" method="POST" className="pt-4">
    <button
      type="submit"
      className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
    >
      Sign Out
    </button>
  </form>
</nav>

      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-green-700 transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
