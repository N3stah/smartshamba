import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="bg-gray-950 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-white font-bold text-lg mb-2">SmartShamba</h3>
          <p className="text-xs leading-relaxed text-gray-400">Direct, transparent maize trading for Kenya&rsquo;s farmers and buyers.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</Link></li>
            <li><Link href="/market-prices" className="text-gray-400 hover:text-white transition-colors">Market Prices</Link></li>
            <li><Link href="/buyers" className="text-gray-400 hover:text-white transition-colors">Verified Buyers</Link></li>
            <li><Link href="/group-selling" className="text-gray-400 hover:text-white transition-colors">Group Selling</Link></li>
            <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Portals</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/dashboard/login" className="text-gray-400 hover:text-white transition-colors">Farmer Login</Link></li>
            <li><Link href="/buyer/login" className="text-gray-400 hover:text-white transition-colors">Buyer Portal</Link></li>
            <li><Link href="/transport/login" className="text-gray-400 hover:text-white transition-colors">Transport Portal</Link></li>
            <li><Link href="/admin/login?from=%2Fadmin" className="text-gray-400 hover:text-white transition-colors">Admin Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Contact & Support</h4>
          <ul className="space-y-2 text-xs">
            <li className="text-gray-400">USSD: <span className="font-mono text-white">*384*53374#</span></li>
            <li className="text-gray-400">Help: <a href="tel:+254722138632" className="hover:text-white transition-colors">+254 722 138 632</a></li>
            <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-500">
          <p>&copy; {new Date().getFullYear()} SmartShamba. All rights reserved.</p>
          <p>Serving farmers and buyers across Rift Valley & Western Kenya</p>
        </div>
      </div>
    </footer>
  );
}