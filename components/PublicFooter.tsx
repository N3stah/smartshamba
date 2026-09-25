import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold text-text mb-2 font-serif">SmartShamba</h3>
            <p className="text-sm text-gray-600 max-w-xs">Direct, transparent maize trading for Kenya&rsquo;s farmers and buyers.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/how-it-works" className="text-sm text-gray-600 hover:text-public-primary">How It Works</Link></li>
              <li><Link href="/market-prices" className="text-sm text-gray-600 hover:text-public-primary">Market Prices</Link></li>
              <li><Link href="/buyers" className="text-sm text-gray-600 hover:text-public-primary">Verified Buyers</Link></li>
              <li><Link href="/group-selling" className="text-sm text-gray-600 hover:text-public-primary">Group Selling</Link></li>
              <li><Link href="/about" className="text-sm text-gray-600 hover:text-public-primary">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Portals</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard/login" className="text-sm text-gray-600 hover:text-public-primary">Farmer Login</Link></li>
              <li><Link href="/buyer/login" className="text-sm text-gray-600 hover:text-public-primary">Buyer Portal</Link></li>
              <li><Link href="/transport/login" className="text-sm text-gray-600 hover:text-public-primary">Transport Portal</Link></li>
              <li><Link href="/admin/login?from=%2Fadmin" className="text-sm text-gray-600 hover:text-public-primary">Admin Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact & Support</h4>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600">USSD: <span className="font-mono text-text">*384*53374#</span></li>
              <li className="text-sm text-gray-600">Help: <a href="tel:+254722138632" className="hover:text-public-primary">+254 722 138 632</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} SmartShamba. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
