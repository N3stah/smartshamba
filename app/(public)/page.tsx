import PublicHeader from "@/components/PublicHeader";
import HeroSection from "@/components/HeroSection";
import CountyTicker from "@/components/CountyTicker";
import PublicFooter from "@/components/PublicFooter";
import ImageCrossfade from "@/components/ImageCrossfade";
import Link from "next/link";
import { ArrowRight, Phone, Globe, ShieldCheck, Truck, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { IMAGES } from "@/lib/image-constants";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
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
        <HeroSection />
        <CountyTicker />

        {/* TRUST STRIP */}
        <section className="border-y border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div><p className="text-xl font-bold text-public-primary font-serif">USSD Access</p><p className="text-xs text-gray-600 mt-1 font-medium">No Internet Needed</p></div>
              <div><p className="text-xl font-bold text-public-primary font-serif">M-PESA</p><p className="text-xs text-gray-600 mt-1 font-medium">Integrated Settlement</p></div>
              <div><p className="text-xl font-bold text-public-primary font-serif">Verified</p><p className="text-xs text-gray-600 mt-1 font-medium">Buyer Directory</p></div>
              <div><p className="text-xl font-bold text-public-primary font-serif">Transport</p><p className="text-xs text-gray-600 mt-1 font-medium">Coordination Layer</p></div>
            </div>
          </div>
        </section>

        {/* FARM TO MARKET */}
        <section className="bg-surface py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={IMAGES["market-produce"]} alt="Variety of produce in a market building" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">Farm to Market</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-text leading-tight mb-6 font-serif">
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
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">Current Solution</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4 font-serif">How SmartShamba Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">From registration to settlement &mdash; a complete coordination workflow accessible on any phone.</p>
            </div>
            <div className="relative mb-16">
              <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-px bg-border"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4">
                {[
                  { step: "01", title: "Farmer", desc: "Dials *384*53374# and registers via USSD on any phone." },
                  { step: "02", title: "Buyer", desc: "Lists demand and verified offers on the web portal." },
                  { step: "03", title: "Confirm", desc: "Transaction recorded and SMS confirmation sent." },
                  { step: "04", title: "Transport", desc: "Providers matched. Delivery tracked end-to-end." },
                  { step: "05", title: "Settlement", desc: "M-PESA settlement after delivery confirmation." },
                ].map((s) => (
                  <div key={s.step} className="relative text-center lg:text-left">
                    <div className="w-24 h-24 mx-auto lg:mx-0 bg-surface rounded-full border-2 border-public-primary flex items-center justify-center mb-4 shadow-sm relative z-10">
                      <span className="text-xl font-bold text-public-primary">{s.step}</span>
                    </div>
                    <h3 className="font-bold text-text text-sm mb-2 font-serif">{s.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-md border border-border max-w-sm mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={IMAGES["feature-phone"]} alt="Feature phone representing USSD accessibility" className="w-full h-full object-cover object-center" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-text leading-tight mb-6 font-serif">
                  USSD for farmers. Web for buyers. One coordinated system.
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Every technology decision starts with one question: can a farmer in rural Kenya use this without a smartphone or internet connection? USSD works on 2G networks, on any phone, anywhere there is a signal.
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="border border-border rounded-md p-5">
                    <div className="flex items-center gap-2 mb-2"><Phone className="w-5 h-5 text-public-primary" /><h4 className="font-bold text-text text-sm font-serif">Feature Phones (USSD)</h4></div>
                    <p className="text-xs text-gray-600 leading-relaxed">Dial *384*53374#. No app, no internet. Works on any Safaricom SIM.</p>
                  </div>
                  <div className="border border-border rounded-md p-5">
                    <div className="flex items-center gap-2 mb-2"><Globe className="w-5 h-5 text-public-primary" /><h4 className="font-bold text-text text-sm font-serif">Smartphones & Web</h4></div>
                    <p className="text-xs text-gray-600 leading-relaxed">Buyers manage procurement, demands, and transactions through a web dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AGRICULTURE RAIL */}
        <section className="bg-surface py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">From cultivation to market</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-text leading-tight mb-6 font-serif">
                  Connecting the physical farm with digital trade coordination.
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  SmartShamba connects harvest production at scale with verified market demand. We ensure that agricultural output meets real buyer needs, coordinating the physical movement of maize with digital transaction references.
                </p>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-md border border-border">
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
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
              <div>
                <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">Market Intelligence</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-text leading-tight mb-6 font-serif">
                  Real maize prices. Verified buyer demand. Before the harvest moves.
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  SmartShamba provides transparent market pricing and verified buyer demand data &mdash; so farmers can make informed decisions about when and where to sell, and buyers can coordinate procurement at scale.
                </p>
                <Link href="/market-prices" className="inline-flex items-center gap-2 text-public-primary font-semibold text-sm hover:underline">
                  View Current Market Prices <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-md border border-border">
                  <ImageCrossfade
                    images={[
                      { src: IMAGES["vegetable-stand"], alt: "Vegetable stand at a market" },
                      { src: IMAGES["corn-on-table"], alt: "Pile of corn on a table" },
                      { src: IMAGES["palm-trees"], alt: "Palm trees" },
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
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-md border border-border">
                  <ImageCrossfade
                    images={[
                      { src: IMAGES["corn-pile"], alt: "Pile of corn" },
                      { src: IMAGES["corn-hanging"], alt: "Ears of corn hanging" },
                      { src: IMAGES["green-corn-plant"], alt: "Green corn plant" },
                    ]}
                    interval={3500}
                    className="w-full h-full"
                    imgClassName="object-cover"
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">Group Selling</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-text leading-tight mb-6 font-serif">
                  Individual farmers. Collective volume. Coordinated commerce.
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Smallholder farmers pool their harvest to meet institutional buyer demand &mdash; with shared transport coordination and transparent, proportional settlement.
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="border border-border rounded-md p-5 bg-surface">
                    <Users className="w-6 h-6 text-public-primary mb-3" />
                    <h3 className="font-bold text-text text-sm mb-1 font-serif">Collective Volume</h3>
                    <p className="text-xs text-gray-600">Farmers pool bags to meet institutional buyer demand thresholds.</p>
                  </div>
                  <div className="border border-border rounded-md p-5 bg-surface">
                    <TrendingUp className="w-6 h-6 text-public-primary mb-3" />
                    <h3 className="font-bold text-text text-sm mb-1 font-serif">Transparent Settlement</h3>
                    <p className="text-xs text-gray-600">Proportional M-PESA payouts based on bags contributed.</p>
                  </div>
                </div>
                <Link href="/group-selling" className="inline-flex items-center gap-2 mt-8 text-public-primary font-semibold text-sm hover:underline">
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
                <p className="text-public-secondary font-semibold text-xs uppercase tracking-[0.15em] mb-4">Transport Marketplace</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6 font-serif">From confirmed transaction to coordinated delivery.</h2>
                <p className="text-lg text-gray-300 leading-relaxed mb-8">
                  SmartShamba connects verified transport providers with confirmed transactions &mdash; matching capacity to demand, coordinating pickup and delivery, and settling payment through the same platform.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm mb-8">
                  {["Request", "Match", "Accept", "Load", "Transit", "Delivery"].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="bg-white/10 border border-white/20 rounded-md px-3 py-1.5 font-medium text-white">{step}</span>
                      {i < 5 && <span className="text-gray-400">&rarr;</span>}
                    </div>
                  ))}
                </div>
                <Link href="/transport/login" className="inline-flex items-center gap-2 bg-white text-gray-900 px-7 py-3.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors">
                  Transport Portal Login <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-2xl border border-gray-700">
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
        <section className="bg-surface py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">Trust Infrastructure</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4 font-serif">Not a marketplace. A coordination layer.</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">SmartShamba reduces post-harvest transaction uncertainty &mdash; the moment a farmer loads the truck without a confirmed buyer.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Verified Buyer Directory", desc: "Every buyer is vetted by the SmartShamba team before listing. Capacity, location, and price offers are confirmed.", icon: ShieldCheck },
                { title: "Transaction References", desc: "Every confirmed offer generates a unique reference number (SS-2026-XXXXX) sent via SMS to both parties.", icon: CheckCircle2 },
                { title: "M-PESA Settlement", desc: "Payment is released through M-PESA after delivery confirmation. The platform never holds farmer funds.", icon: TrendingUp },
              ].map((item) => (
                <div key={item.title} className="border border-border rounded-lg p-8 hover:border-public-primary transition-colors">
                  <item.icon className="w-8 h-8 text-public-primary mb-4" />
                  <h3 className="font-bold text-text text-lg mb-3 font-serif">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative bg-gray-900 text-white py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMAGES["sunset-corn-field"]} alt="Open corn field at sunset" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6 drop-shadow-lg font-serif">Build a more connected agricultural market.</h2>
            <p className="text-lg text-gray-200 leading-relaxed max-w-2xl mx-auto mb-10 drop-shadow-md">
              SmartShamba is a transaction coordination platform designed to reduce post-harvest transaction uncertainty in Rift Valley & Western Kenya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/ussd" className="inline-flex items-center justify-center gap-2 bg-public-primary text-white px-8 py-3.5 rounded-md text-sm font-bold hover:bg-public-primary/90 transition-colors shadow-lg">
                Try USSD Demo <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/buyer/login" className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-3.5 rounded-md text-sm font-bold hover:bg-white/10 transition-colors backdrop-blur-sm">
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
