import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ImageCrossfade from "@/components/ImageCrossfade";
import Link from "next/link";
import { ArrowRight, Phone, Globe, ShieldCheck, Truck, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { IMAGES } from "@/lib/image-constants";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />
      <main className="flex-1">

        {/* ANNOUNCEMENT BAR */}
        <div className="bg-gray-900 text-white text-xs py-2 px-4 text-center font-medium">
          <span className="inline-flex items-center gap-2">
            Serving farmers and buyers across Rift Valley & Western Kenya
            <span className="opacity-60">&middot;</span>
            <span className="font-mono font-bold">Dial *384*53374#</span>
          </span>
        </div>

        {/* HERO */}
        <section className="bg-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="flex flex-col justify-center">
                <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-5">Rift Valley & Western Kenya &middot; 2026</p>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
                  Direct, Transparent Maize Trading for Kenya&rsquo;s Farmers & Buyers
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed max-w-xl mb-8">
                  SmartShamba connects farmers and buyers across Rift Valley & Western Kenya through coordinated transactions, USSD and web access, transport coordination, and settlement workflows.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/ussd" className="inline-flex items-center justify-center gap-2 bg-[#00703C] text-white px-7 py-3.5 rounded-lg text-sm font-semibold hover:bg-[#00582f] transition-colors shadow-sm">
                    Launch USSD Demo <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/buyers" className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-7 py-3.5 rounded-lg text-sm font-semibold hover:border-[#00703C] hover:text-[#00703C] transition-colors">
                    View Verified Buyers
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10 pt-8 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><ShieldCheck className="w-4 h-4 text-[#00703C]" /><span className="font-medium">Verified Buyers</span></div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-[#00703C]" /><span className="font-medium">USSD + M-PESA</span></div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Truck className="w-4 h-4 text-[#00703C]" /><span className="font-medium">Transport Coordination</span></div>
                </div>
              </div>
              <div className="relative">
                <div className="relative aspect-4/5 sm:aspect-5/4 lg:aspect-4/5 rounded-2xl overflow-hidden shadow-xl">
                  <img src={IMAGES["hero-maize-field"]} alt="Maize field with dirt path in rural Kenya" className="w-full h-full object-cover" />
                  <div className="absolute bottom-5 left-5 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2.5">
                    <p className="text-xs font-bold text-white tracking-wide">Rift Valley & Western Kenya</p>
                    <p className="text-[10px] text-gray-200 mt-0.5">Maize Trade &middot; USSD + Web</p>
                  </div>
                </div>
                {/* Secondary rotating image panel */}
                <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-xl overflow-hidden shadow-xl border-4 border-white hidden sm:block">
                  <ImageCrossfade
                    images={[
                      { src: IMAGES["corn-closeup"], alt: "Close-up of corn on the cob" },
                      { src: IMAGES["green-corn-plant"], alt: "Green corn plant" },
                      { src: IMAGES["corn-hanging"], alt: "Ears of corn hanging under a straw hat" },
                    ]}
                    interval={3500}
                    className="w-full h-full"
                    imgClassName="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="border-y border-gray-100 bg-gray-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div><p className="text-xl font-bold text-[#00703C]">USSD Access</p><p className="text-xs text-gray-500 mt-1 font-medium">No Internet Needed</p></div>
              <div><p className="text-xl font-bold text-[#00703C]">M-PESA</p><p className="text-xs text-gray-500 mt-1 font-medium">Integrated Settlement</p></div>
              <div><p className="text-xl font-bold text-[#00703C]">Verified</p><p className="text-xs text-gray-500 mt-1 font-medium">Buyer Directory</p></div>
              <div><p className="text-xl font-bold text-[#00703C]">Transport</p><p className="text-xs text-gray-500 mt-1 font-medium">Coordination Layer</p></div>
            </div>
          </div>
        </section>

        {/* FARM TO MARKET */}
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-lg">
                  <img src={IMAGES["market-produce"]} alt="Variety of produce in a market building" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">Farm to Market</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-6">
                  What happens when farmers and buyers can coordinate before the harvest moves?
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  SmartShamba is a transaction coordination layer that ensures farmers know the buyer, the price, and the payment mechanism before the truck is loaded.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  We connect physical agriculture with digital market infrastructure, reducing information asymmetry and post-harvest transaction uncertainty.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-gray-50 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">Current Solution</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How SmartShamba Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">From registration to settlement &mdash; a complete coordination workflow accessible on any phone.</p>
            </div>
            <div className="relative mb-16">
              <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-px bg-gray-200"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4">
                {[
                  { step: "01", title: "Farmer", desc: "Dials *384*53374# and registers via USSD on any phone." },
                  { step: "02", title: "Buyer", desc: "Lists demand and verified offers on the web portal." },
                  { step: "03", title: "Confirm", desc: "Transaction recorded and SMS confirmation sent." },
                  { step: "04", title: "Transport", desc: "Providers matched. Delivery tracked end-to-end." },
                  { step: "05", title: "Settlement", desc: "M-PESA settlement after delivery confirmation." },
                ].map((s) => (
                  <div key={s.step} className="relative text-center lg:text-left">
                    <div className="w-24 h-24 mx-auto lg:mx-0 bg-white rounded-full border-2 border-[#00703C] flex items-center justify-center mb-4 shadow-sm relative z-10">
                      <span className="text-xl font-bold text-[#00703C]">{s.step}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-2">{s.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-lg max-w-sm mx-auto">
                  <img src={IMAGES["feature-phone"]} alt="Feature phone representing USSD accessibility" className="w-full h-full object-cover object-center" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-6">
                  USSD for farmers. Web for buyers. One coordinated system.
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Every technology decision starts with one question: can a farmer in rural Kenya use this without a smartphone or internet connection? USSD works on 2G networks, on any phone, anywhere there is a signal.
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><Phone className="w-5 h-5 text-[#00703C]" /><h4 className="font-bold text-gray-900 text-sm">Feature Phones (USSD)</h4></div>
                    <p className="text-xs text-gray-600 leading-relaxed">Dial *384*53374#. No app, no internet. Works on any Safaricom SIM.</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><Globe className="w-5 h-5 text-[#00703C]" /><h4 className="font-bold text-gray-900 text-sm">Smartphones & Web</h4></div>
                    <p className="text-xs text-gray-600 leading-relaxed">Buyers manage procurement, demands, and transactions through a web dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AGRICULTURE RAIL */}
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">From cultivation to market</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-6">
                  Connecting the physical farm with digital trade coordination.
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  SmartShamba connects harvest production at scale with verified market demand. We ensure that agricultural output meets real buyer needs, coordinating the physical movement of maize with digital transaction references.
                </p>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-lg">
                  <ImageCrossfade
                    images={[
                      { src: IMAGES["corn-harvest"], alt: "Corn harvest with green forage harvester" },
                      { src: IMAGES["watering-plant"], alt: "Person watering a plant" },
                      { src: IMAGES["planting-vegetables"], alt: "People planting vegetables during daytime" },
                    ]}
                    interval={3500}
                    className="w-full h-full"
                    imgClassName="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MARKET INTELLIGENCE + GROUP SELLING */}
        <section className="bg-gray-50 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
              <div>
                <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">Market Intelligence</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-6">
                  Real maize prices. Verified buyer demand. Before the harvest moves.
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  SmartShamba provides transparent market pricing and verified buyer demand data &mdash; so farmers can make informed decisions about when and where to sell, and buyers can coordinate procurement at scale.
                </p>
                <Link href="/market-prices" className="inline-flex items-center gap-2 text-[#00703C] font-semibold text-sm hover:underline">
                  View Current Market Prices <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-lg">
                  <ImageCrossfade
                    images={[
                      { src: IMAGES["market-produce"], alt: "Variety of produce in a market building" },
                      { src: IMAGES["corn-on-table"], alt: "Pile of corn on a table" },
                      { src: IMAGES["corn-pile"], alt: "Pile of corn" },
                    ]}
                    interval={3500}
                    className="w-full h-full"
                    imgClassName="object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-lg">
                  <ImageCrossfade
                    images={[
                      { src: IMAGES["corn-pile-2"], alt: "Pile of corn" },
                      { src: IMAGES["colorful-corn-ears"], alt: "Pile of colorful dried corn ears" },
                      { src: IMAGES["corn-on-table"], alt: "Pile of corn on a table" },
                    ]}
                    interval={3500}
                    className="w-full h-full"
                    imgClassName="object-cover"
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">Group Selling</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-6">
                  Individual farmers. Collective volume. Coordinated commerce.
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Smallholder farmers pool their harvest to meet institutional buyer demand &mdash; with shared transport coordination and transparent, proportional settlement.
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <Users className="w-6 h-6 text-[#00703C] mb-3" />
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Collective Volume</h3>
                    <p className="text-xs text-gray-600">Farmers pool bags to meet institutional buyer demand thresholds.</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <TrendingUp className="w-6 h-6 text-[#00703C] mb-3" />
                    <h3 className="font-bold text-gray-900 text-sm mb-1">Transparent Settlement</h3>
                    <p className="text-xs text-gray-600">Proportional M-PESA payouts based on bags contributed.</p>
                  </div>
                </div>
                <Link href="/group-selling" className="inline-flex items-center gap-2 mt-8 text-[#00703C] font-semibold text-sm hover:underline">
                  Learn About Group Selling <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSPORT */}
        <section className="bg-gray-900 text-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-green-400 font-semibold text-xs uppercase tracking-[0.15em] mb-4">Transport Marketplace</p>
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-6">From confirmed transaction to coordinated delivery.</h2>
                <p className="text-lg text-gray-300 leading-relaxed mb-8">
                  SmartShamba connects verified transport providers with confirmed transactions &mdash; matching capacity to demand, coordinating pickup and delivery, and settling payment through the same platform.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm mb-8">
                  {["Request", "Match", "Accept", "Load", "Transit", "Delivery"].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 font-medium">{step}</span>
                      {i < 5 && <span className="text-gray-500">&rarr;</span>}
                    </div>
                  ))}
                </div>
                <Link href="/transport/login" className="inline-flex items-center gap-2 bg-white text-gray-900 px-7 py-3.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                  Transport Portal Login <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-2xl">
                  <ImageCrossfade
                    images={[
                      { src: IMAGES["white-truck"], alt: "White truck on road during daytime" },
                      { src: IMAGES["cargo-crates"], alt: "Aerial photo of cargo crates" },
                    ]}
                    interval={4000}
                    className="w-full h-full"
                    imgClassName="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[#00703C] font-semibold text-xs uppercase tracking-[0.15em] mb-4">Trust Infrastructure</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Not a marketplace. A coordination layer.</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">SmartShamba reduces post-harvest transaction uncertainty &mdash; the moment a farmer loads the truck without a confirmed buyer.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Verified Buyer Directory", desc: "Every buyer is vetted by the SmartShamba team before listing. Capacity, location, and price offers are confirmed.", icon: ShieldCheck },
                { title: "Transaction References", desc: "Every confirmed offer generates a unique reference number (SS-2026-XXXXX) sent via SMS to both parties.", icon: CheckCircle2 },
                { title: "M-PESA Settlement", desc: "Payment is released through M-PESA after delivery confirmation. The platform never holds farmer funds.", icon: TrendingUp },
              ].map((item) => (
                <div key={item.title} className="border border-gray-200 rounded-xl p-8 hover:border-[#00703C] transition-colors">
                  <item.icon className="w-8 h-8 text-[#00703C] mb-4" />
                  <h3 className="font-bold text-gray-900 text-lg mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative bg-gray-900 text-white py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <img src={IMAGES["sunset-corn-field"]} alt="Open corn field at sunset" className="w-full h-full object-cover" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">Build a more connected agricultural market.</h2>
            <p className="text-lg text-gray-200 leading-relaxed max-w-2xl mx-auto mb-10">
              SmartShamba is a transaction coordination platform designed to reduce post-harvest transaction uncertainty in Rift Valley & Western Kenya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/ussd" className="inline-flex items-center justify-center gap-2 bg-[#00703C] text-white px-8 py-3.5 rounded-lg text-sm font-bold hover:bg-[#00582f] transition-colors">
                Try USSD Demo <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/buyer/login" className="inline-flex items-center justify-center gap-2 border border-white/40 text-white px-8 py-3.5 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">
                Buyer Portal Login
              </Link>
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
