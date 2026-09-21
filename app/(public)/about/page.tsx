import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import Link from "next/link";
import { ArrowRight, Target, Users, MapPin, ExternalLink } from "lucide-react";
import { IMAGES } from "@/lib/image-constants";

export const metadata = {
  title: "About SmartShamba",
  description: "SmartShamba is a transaction coordination platform built for Kenyan maize farmers and buyers.",
};

const team = [
  {
    name: "Daisy Ayuma",
    role: "Chief Executive Officer (CEO)",
    description: "Leads business strategy, partnerships, and buyer onboarding.",
  },
  {
    name: "Mark Manoti Ndege",
    role: "Co-Founder & Chief Technology Officer (CTO)",
    description: "Leads the technical architecture, product engineering, and development of SmartShamba.",
    portfolio: "https://www.aetsh69.duckdns.org/",
    linkedin: "https://ke.linkedin.com/in/mark-manoti-ndege",
  },
  {
    name: "Grace Akomo",
    role: "Chief Financial Officer (CFO)",
    description: "Oversees financial operations, pilot coordination, and field research.",
  },
  {
    name: "Eva Chepchumba",
    role: "Product Manager (PM)",
    description: "Leads UX design, product iteration, and customer feedback integration.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />
      <main className="flex-1">

        {/* HERO */}
        <section className="relative bg-gray-900 overflow-hidden">
          <div className="absolute inset-0">
            <img src={IMAGES["golden-hour-landscape"]} alt="Golden hour landscape with tree between green land" className="w-full h-full object-cover opacity-50" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="max-w-3xl">
              <p className="text-green-400 font-semibold text-xs uppercase tracking-[0.15em] mb-5">About SmartShamba</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
                We exist to remove transaction uncertainty from agricultural trade.
              </h1>
              <p className="text-lg text-gray-200 leading-relaxed max-w-2xl">
                SmartShamba is not a marketplace. It is a coordination layer that ensures farmers know the buyer, the price, and the payment mechanism &mdash; before the truck is loaded.
              </p>
            </div>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">The Problem</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-6">
                  Farmers lose negotiating power the moment transport begins.
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  In Kenya&rsquo;s maize supply chain, smallholder farmers frequently transport harvests without a pre-confirmed buyer agreement. They discover the real price only after the truck is loaded &mdash; creating irreversible financial exposure.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Brokers exploit information gaps. Buyers delay payments. Farmers absorb the losses. The system is not broken &mdash; it simply lacks a coordination layer.
                </p>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-lg">
                  <img src={IMAGES["black-white-corn"]} alt="Black and white photo of a field of corn" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THE SOLUTION */}
        <section className="bg-gray-50 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">The Solution</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">A hybrid transaction ledger accessible on any phone.</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">SmartShamba connects farmers and buyers through USSD and web &mdash; pre-confirming offers, recording references, and coordinating settlement through M-PESA.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <Target className="w-8 h-8 text-[#00703C] mb-4" />
                <h3 className="font-bold text-gray-900 text-lg mb-3">Pre-Confirm Offers</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Farmers view verified buyer offers and confirm a price before loading produce onto any truck.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <Users className="w-8 h-8 text-[#00703C] mb-4" />
                <h3 className="font-bold text-gray-900 text-lg mb-3">Verify Participants</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Every buyer is vetted by the SmartShamba team. Every transaction generates a unique reference number.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-8">
                <MapPin className="w-8 h-8 text-[#00703C] mb-4" />
                <h3 className="font-bold text-gray-900 text-lg mb-3">Coordinate Delivery</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Transport providers are matched to confirmed transactions. Delivery is tracked end-to-end.</p>
              </div>
            </div>
          </div>
        </section>

        {/* THE REACH */}
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-lg">
                  <img src={IMAGES["nairobi-skyline"]} alt="Nairobi city skyline" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">The Reach</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-6">Rooted in Rift Valley. Built for Kenya.</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  SmartShamba is intentionally focused on specific counties during the pilot stage to improve operational coordination, farmer onboarding, and buyer verification before expanding.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl p-5"><p className="text-2xl font-bold text-[#00703C] mb-1">2026</p><p className="text-xs text-gray-600 font-medium">Pilot Year</p></div>
                  <div className="border border-gray-200 rounded-xl p-5"><p className="text-2xl font-bold text-[#00703C] mb-1">USSD</p><p className="text-xs text-gray-600 font-medium">Primary Access</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEADERSHIP / TEAM */}
        <section className="bg-gray-50 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">Leadership</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Meet the Team</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">A team built around product, operations, and engineering &mdash; focused on solving one problem exceptionally well.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member) => (
                <div key={member.name} className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-[#00703C] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {member.name}
                  </h3>
                  <p className="text-[#00703C] font-semibold text-xs mb-3">{member.role}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">{member.description}</p>
                  {member.portfolio && (
                    <div className="flex justify-center gap-3 pt-2 border-t border-gray-100">
                      <a href={member.portfolio} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#00703C] transition-colors" title="Portfolio">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#00703C] transition-colors" title="LinkedIn">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#00703C] text-white py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">Building trust infrastructure for agricultural trade.</h2>
            <p className="text-lg text-green-100 leading-relaxed max-w-2xl mx-auto mb-10">SmartShamba is a transaction coordination platform designed to reduce post-harvest transaction uncertainty in Rift Valley & Western Kenya.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/ussd" className="inline-flex items-center justify-center gap-2 bg-white text-[#00703C] px-8 py-3.5 rounded-lg text-sm font-bold hover:bg-green-50 transition-colors">Try USSD Demo <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/buyer/login" className="inline-flex items-center justify-center gap-2 border border-white/40 text-white px-8 py-3.5 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">Buyer Portal Login</Link>
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
