"use client";
import Link from 'next/link';
import { 
  Smartphone, 
  Monitor, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  Menu,
  X,
  PhoneCall,
  MapPin,
  Database,
  CreditCard
} from 'lucide-react';
import { useState } from 'react';

// A simple interactive USSD visual component for the "How it Works" section
function UssdVisual() {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 font-mono text-green-400 text-sm shadow-2xl border border-gray-700 max-w-sm mx-auto">
      <div className="flex justify-between items-center mb-4 text-gray-400 text-xs">
        <span>USSD Session</span>
        <span>*384*53374#</span>
      </div>
      <div className="space-y-2">
        <p>Welcome to SmartShamba</p>
        <p>Rift Valley & Western Kenya</p>
        <div className="mt-3 border-t border-gray-700 pt-3">
          <p>1. Farmer</p>
          <p>2. Buyer</p>
          <p>3. About / Help</p>
          <p>0. Exit</p>
        </div>
        <div className="mt-4 flex items-center justify-between bg-gray-800 p-2 rounded text-white">
          <span>Enter choice:</span>
          <span className="bg-green-500 h-4 w-2 animate-pulse"></span>
        </div>
      </div>
    </div>
  );
}

function WebVisual() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-md mx-auto">
      <div className="h-8 bg-gray-100 flex items-center px-4 space-x-2">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-400"></div>
      </div>
      <div className="p-6 space-y-4">
        <div className="h-6 w-1/3 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-green-50 rounded-lg p-3 flex flex-col justify-between border border-green-100">
            <div className="h-2 w-1/2 bg-green-200 rounded"></div>
            <div className="h-4 w-3/4 bg-green-700 rounded"></div>
          </div>
          <div className="h-20 bg-gray-50 rounded-lg p-3 flex flex-col justify-between border border-gray-100">
            <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="space-y-2 pt-4">
          <div className="h-4 w-full bg-gray-100 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
          <div className="h-4 w-4/6 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      
      {/* Announcement Bar */}
      <div className="bg-[#00703C] text-white text-center text-xs sm:text-sm py-2 px-4 font-medium">
        Live across Rift Valley & Western Kenya — Dial *384*53374# (Africa&apos;s Talking USSD Sandbox)
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#00703C] rounded-lg flex items-center justify-center text-white font-bold text-sm">SS</div>
            <span className="font-bold text-lg text-gray-900">SmartShamba</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="#buyers" className="hover:text-[#00703C] transition-colors">Verified Buyers</Link>
            <Link href="#prices" className="hover:text-[#00703C] transition-colors">Market Prices</Link>
            <Link href="#group-selling" className="hover:text-[#00703C] transition-colors">Group Selling</Link>
            <Link href="#about" className="hover:text-[#00703C] transition-colors">About Us</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/buyer/login" className="px-4 py-2 text-sm font-semibold text-[#00703C] border border-[#00703C] rounded-lg hover:bg-green-50 transition-colors">
              Buyer Portal
            </Link>
            <Link href="/dashboard/login?from=%2Fdashboard" className="px-4 py-2 text-sm font-semibold text-white bg-[#00703C] rounded-lg hover:bg-green-800 transition-colors">
              Farmer Portal
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4">
            <Link href="#buyers" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-[#00703C]">Verified Buyers</Link>
            <Link href="#prices" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-[#00703C]">Market Prices</Link>
            <Link href="#group-selling" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-[#00703C]">Group Selling</Link>
            <Link href="#about" onClick={() => setIsOpen(false)} className="block text-gray-600 hover:text-[#00703C]">About Us</Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
              <Link href="/buyer/login" className="w-full text-center px-4 py-2 text-sm font-semibold text-[#00703C] border border-[#00703C] rounded-lg">Buyer Portal</Link>
              <Link href="/dashboard/login?from=%2Fdashboard" className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-[#00703C] rounded-lg">Farmer Portal</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-green-100 text-[#00703C] px-4 py-1.5 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Trusted by Trans Nzoia Farmers
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Direct, Transparent Maize Trading for Kenya&apos;s Farmers & Buyers
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              SmartShamba connects smallholder maize farmers with verified buyers across Rift Valley and Western Kenya. Pre-confirm prices, track transactions, and trade securely via USSD or Web.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="tel:*384*53374#" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00703C] text-white font-bold rounded-xl shadow-lg hover:bg-green-800 transition-all hover:shadow-xl group">
                <PhoneCall className="w-5 h-5" />
                Get Started: *384*53374#
              </a>
              <Link href="/buyer/login" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#00703C] border-2 border-green-100 font-bold rounded-xl hover:bg-gray-50 transition-all">
                Buyer Portal Sign In
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Hero Visuals - Dual Mockup */}
          <div className="relative hidden lg:block h-125">
            <div className="absolute top-0 right-0 w-3/5 z-10 transform rotate-3 transition-transform hover:rotate-0 duration-500">
              <WebVisual />
            </div>
            <div className="absolute bottom-0 left-0 w-2/5 z-20 transform -rotate-3 transition-transform hover:rotate-0 duration-500">
              <UssdVisual />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Metrics Bar */}
      <section className="bg-[#00703C] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center gap-2">
            <MapPin className="w-8 h-8 text-green-200" />
            <h3 className="text-2xl font-bold">9+ Counties</h3>
            <p className="text-xs text-green-200">Covered across Kenya</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <ShieldCheck className="w-8 h-8 text-green-200" />
            <h3 className="text-2xl font-bold">Verified Millers</h3>
            <p className="text-xs text-green-200">Direct from cooperative</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <Database className="w-8 h-8 text-green-200" />
            <h3 className="text-2xl font-bold">100% Synced</h3>
            <p className="text-xs text-green-200">USSD & Web Real-time</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <CreditCard className="w-8 h-8 text-green-200" />
            <h3 className="text-2xl font-bold">Secure Payments</h3>
            <p className="text-xs text-green-200">M-PESA Tracking & Disputes</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Whether on a feature phone or smartphone, trading maize has never been this accessible.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* USSD Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Smartphone className="w-7 h-7 text-[#00703C]" />
              </div>
              <h3 className="text-xl font-bold mb-2">For Feature Phones (USSD)</h3>
              <p className="text-gray-600 mb-8">Dial <span className="font-mono font-bold text-[#00703C]">*384*53374#</span> to check live prices, register, and lock in sales without internet.</p>
              <UssdVisual />
            </div>

            {/* Web Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Monitor className="w-7 h-7 text-[#00703C]" />
              </div>
              <h3 className="text-xl font-bold mb-2">For Smartphones & Buyers (Web)</h3>
              <p className="text-gray-600 mb-8">Manage purchase orders, review incoming produce, and complete settlements securely.</p>
              <WebVisual />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid / Group Selling */}
      <section id="group-selling" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Built for Fair Trade</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Solving the biggest challenges in the maize supply chain.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-[#00703C]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Transparent Pricing</h3>
              <p className="text-gray-600 text-sm">Real-time regional market price updates prevent middleman price squeezing.</p>
            </div>

            <div className="p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-[#00703C]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Guaranteed Agreements</h3>
              <p className="text-gray-600 text-sm">Pre-confirm buyer agreements before loading produce onto trucks.</p>
            </div>

            <div className="p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-[#00703C]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Group Selling</h3>
              <p className="text-gray-600 text-sm">Smallholder farmers pool harvests to command higher bulk market rates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Prices Section */}
      <section id="prices" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Market Price Insights</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Real-time regional maize price trends per 90kg bag.</p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-[#00703C]" />
              <h3 className="text-xl font-bold text-gray-900">Current Top Offers</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">Eldoret Grain</p>
                  <p className="text-sm text-gray-500">Uasin Gishu</p>
                </div>
                <p className="text-lg font-bold text-[#00703C]">KSh 2,950</p>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">Kitale Millers</p>
                  <p className="text-sm text-gray-500">Trans Nzoia</p>
                </div>
                <p className="text-lg font-bold text-[#00703C]">KSh 2,800</p>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-semibold text-gray-900">Trans Nzoia Cereals</p>
                  <p className="text-sm text-gray-500">Trans Nzoia</p>
                </div>
                <p className="text-lg font-bold text-[#00703C]">KSh 2,700</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-6">Prices are indicative based on recent settled transactions.</p>
          </div>
        </div>
      </section>

      {/* Verified Buyers Section */}
      <section id="buyers" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Verified Buyers Directory</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Connect directly with trusted grain millers across Kenya.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Eldoret Grain</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> Eldoret CBD</p>
                </div>
                <span className="bg-green-100 text-[#00703C] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified</span>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-auto">
                <p className="text-sm text-gray-500">Current Offer (90kg bag)</p>
                <p className="text-2xl font-bold text-[#00703C]">KSh 2,950</p>
                <p className="text-sm text-gray-500 mt-2">Demand: 8,500 bags</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Kitale Millers</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> Kitale Town</p>
                </div>
                <span className="bg-green-100 text-[#00703C] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified</span>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-auto">
                <p className="text-sm text-gray-500">Current Offer (90kg bag)</p>
                <p className="text-2xl font-bold text-[#00703C]">KSh 2,800</p>
                <p className="text-sm text-gray-500 mt-2">Demand: 5,000 bags</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Trans Nzoia Cereals</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> Mois Bridge</p>
                </div>
                <span className="bg-green-100 text-[#00703C] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified</span>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-auto">
                <p className="text-sm text-gray-500">Current Offer (90kg bag)</p>
                <p className="text-2xl font-bold text-[#00703C]">KSh 2,700</p>
                <p className="text-sm text-gray-500 mt-2">Demand: 3,000 bags</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / About */}
      <footer id="about" className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#00703C] rounded-lg flex items-center justify-center text-white font-bold text-sm">SS</div>
              <span className="font-bold text-lg text-white">SmartShamba</span>
            </div>
            <p className="text-sm">Direct, transparent maize trading for Kenya&apos;s farmers and buyers.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Portals</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/dashboard/login" className="hover:text-white transition-colors">Farmer Login</Link></li>
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

    </div>
  );
}
