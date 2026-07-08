import Link from 'next/link';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-green-800 flex flex-col fixed h-full shadow-lg">
        <div className="p-6 border-b border-green-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-green-800 font-bold text-sm">SS</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">SmartShamba</p>
              <p className="text-xs text-green-200">Farmer Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-green-700 transition-colors">
            <span>📊</span><span>Dashboard</span>
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-green-700 transition-colors">
            <span>🔄</span><span>My Transactions</span>
          </Link>
          <Link href="/buyer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:text-white hover:bg-green-700 transition-colors">
            <span>🏢</span><span>Buyer Directory</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-green-700">
          <p className="text-xs text-green-300 mb-3">Dial *384*53374# to sell maize</p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left text-sm text-green-200 hover:text-white hover:bg-green-700 transition-colors px-3 py-2 rounded-lg flex items-center gap-2"
            >
              <span>←</span><span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
