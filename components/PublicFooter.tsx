import Link from "next/link";
import SmartShambaLogo from "./SmartShambaLogo";
import CountyTicker from "./CountyTicker";

export default function PublicFooter() {
  return (
    <>
      <CountyTicker />
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-1">
            <SmartShambaLogo variant="full" size="sm" theme="dark" className="mb-2" />
            <p className="text-xs leading-relaxed">Direct, transparent maize trading for Kenya&rsquo;s farmers and buyers.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 text-[10px] uppercase tracking-wider">Platform</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/market-prices" className="hover:text-white transition-colors">Market Prices</Link></li>
              <li><Link href="/buyers" className="hover:text-white transition-colors">Verified Buyers</Link></li>
              <li><Link href="/group-selling" className="hover:text-white transition-colors">Group Selling</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 text-[10px] uppercase tracking-wider">Portals</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/dashboard/login" className="hover:text-white transition-colors">Farmer Login</Link></li>
              <li><Link href="/buyer/login" className="hover:text-white transition-colors">Buyer Portal</Link></li>
              <li><Link href="/transport/login" className="hover:text-white transition-colors">Transport Portal</Link></li>
              <li><Link href="/admin/login?from=%2Fadmin" className="hover:text-white transition-colors">Admin Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 text-[10px] uppercase tracking-wider">Support</h4>
            <ul className="space-y-1.5 text-xs">
              <li>USSD: <span className="font-mono text-white">*384*53374#</span></li>
              <li>Help: <a href="tel:+254722138632" className="hover:text-white transition-colors">+254 722 138 632</a></li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row justify-between items-center text-[10px]">
            <p>&copy; {new Date().getFullYear()} SmartShamba. All rights reserved.</p>
            <p>Serving farmers and buyers across Rift Valley & Western Kenya</p>
          </div>
        </div>
      </footer>
    </>
  );
}
