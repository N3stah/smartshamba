import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { Target, Lightbulb, MapPin } from 'lucide-react';

const team = [
  { name: 'Daisy Ayuma', role: 'Chief Executive Officer (CEO)' },
  { name: 'Mark Manoti', role: 'Chief Technology Officer (CTO)' },
  { name: 'Grace Akomo', role: 'Chief Operating Officer (COO)' },
  { name: 'Eva Chepchumba', role: 'Product Manager (PM)' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Narrative Section */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Our Story</h1>
          <div className="space-y-8 text-left">
            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mt-1">
                <Target className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">The Problem</h2>
                <p className="text-gray-600">Smallholder maize farmers in Kenya lose up to 30% of harvest value to middleman price manipulation, unconfirmed buyer agreements, and delayed payments. Lack of market transparency traps farmers in cycles of poverty.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mt-1">
                <Lightbulb className="w-6 h-6 text-[#00703C]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">The Solution</h2>
                <p className="text-gray-600">SmartShamba provides a hybrid transaction coordination ledger connecting feature-phone farmers (via USSD) and institutional grain buyers (via Web) in real time. We pre-confirm prices and agreements before harvest leaves the farm.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mt-1">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">The Reach</h2>
                <p className="text-gray-600">Expanded from Trans Nzoia County to serve agricultural hubs across Rift Valley and Western Kenya, including Uasin Gishu, Bungoma, Kakamega, and Busia counties.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Grid */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Meet the Leadership</h2>
          <p className="mt-4 text-lg text-gray-600">The team building the future of agricultural trade in Kenya.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div key={member.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl font-bold text-[#00703C]">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{member.role}</p>
            </div>
          ))}
        </div>

      </main>
      <PublicFooter />
    </div>
  );
}
