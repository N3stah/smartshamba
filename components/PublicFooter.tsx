import Link from 'next/link';
import SmartShambaLogo from './SmartShambaLogo';
export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <SmartShambaLogo variant="full" size="md" theme="dark" className="mb-4" />
          <p className="text-sm">Direct, transparent maize trading for Kenya's farmers and buyers.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Portals</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/dashboard/login" className="hover:text-white transition-colors">Farmer Login</Link></li>
            <li><Link href="/transport/login" className="hover:text-white transition-colors">Transport Portal</Link></li>
            <li><Link href="/buyer/login" className="hover:text-white transition-colors">Buyer Portal</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Coverage Regions</h4>
          <ul className="space-y-3 text-sm">
            <li>Trans Nzoia, Uasin Gishu</li>
            <li>Bungoma, Kakamega, Busia</li>
            <li>Nakuru, Kericho</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
          <ul className="space-y-3 text-sm">
            <li>USSD: <span className="font-mono text-white">*384*53374#</span></li>
            <li>Help: <a href="tel:+254722138632" className="hover:text-white transition-colors">+254722138632</a></li>
            <li>Privacy Policy</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-xs">
          <p>&copy; {new Date().getFullYear()} SmartShamba. All rights reserved.</p>
          <Link href="/admin/login?from=%2Fadmin" className="text-gray-500 hover:text-white transition-colors mt-2 sm:mt-0">
            System Administrator Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
