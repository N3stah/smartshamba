import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ImageCrossfade from "@/components/ImageCrossfade";
import Link from "next/link";
import { ArrowRight, Phone, Globe, Truck, Users, Brain, CloudRain, ShieldCheck, Bell, Target, CheckCircle2, TrendingUp } from "lucide-react";
import { IMAGES } from "@/lib/image-constants";

export const metadata = {
  title: "How SmartShamba Works",
  description: "From a farmer’s first USSD interaction to buyer coordination, transport, delivery, settlement, and agricultural intelligence.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <PublicHeader />
      <main className="flex-1">

        {/* HERO */}
        <section className="bg-surface overflow-hidden border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="flex flex-col justify-center">
                <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-5">THE SMARTSHAMBA OPERATING MODEL</p>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-text leading-[1.1] tracking-tight mb-6 font-serif">
                  How SmartShamba Connects the Farm to the Market
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed max-w-xl mb-8">
                  SmartShamba connects farmers, buyers, transport providers, and agricultural intelligence through a single coordinated system across Rift Valley & Western Kenya.
                </p>
              </div>
              <div className="relative">
                <div className="relative aspect-4/5 sm:aspect-5/4 lg:aspect-4/5 rounded-lg overflow-hidden shadow-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={IMAGES["hero-maize-field"]} alt="Maize field with dirt path" className="w-full h-full object-cover" />
                  <div className="absolute bottom-5 left-5 bg-black/60 backdrop-blur-sm rounded-md px-4 py-2.5">
                    <p className="text-xs font-bold text-white tracking-wide">Rift Valley & Western Kenya</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THE FOUR ACTORS */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4 font-serif">The Four Participants</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">SmartShamba acts as the intelligence and coordination layer connecting these four actors.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface border border-border rounded-lg p-8 text-center">
                <Users className="w-10 h-10 text-public-primary mx-auto mb-4" />
                <h3 className="font-bold text-text text-lg mb-2 font-serif">Farmer</h3>
                <p className="text-sm text-gray-600">"Supply" - Registers via USSD and posts available produce.</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-8 text-center">
                <Target className="w-10 h-10 text-public-primary mx-auto mb-4" />
                <h3 className="font-bold text-text text-lg mb-2 font-serif">Buyer</h3>
                <p className="text-sm text-gray-600">"Demand" - Publishes demand and coordinates procurement.</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-8 text-center">
                <Truck className="w-10 h-10 text-public-primary mx-auto mb-4" />
                <h3 className="font-bold text-text text-lg mb-2 font-serif">Transport Provider</h3>
                <p className="text-sm text-gray-600">"Movement" - Picks up and delivers confirmed transactions.</p>
              </div>
              <div className="bg-surface border-2 border-public-primary rounded-lg p-8 text-center bg-public-secondary">
                <Brain className="w-10 h-10 text-public-primary mx-auto mb-4" />
                <h3 className="font-bold text-text text-lg mb-2 font-serif">SmartShamba</h3>
                <p className="text-sm text-gray-600">"Coordination & Intelligence" - The operating layer connecting everything.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FARMER JOURNEY */}
        <section className="bg-surface py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-16">
              <div>
                <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">1. The Farmer Starts With What They Have</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-text leading-tight mb-6 font-serif">USSD Access Without a Smartphone</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-4">A farmer dials <span className="font-mono font-bold text-public-primary">*384*53374#</span> to access SmartShamba. They can register, post available produce, and specify bag sizes (90kg or 50kg).</p>
                <p className="text-lg text-gray-600 leading-relaxed">The farmer tells the system: “I have this much maize available.”</p>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={IMAGES["colorful-corn-ears"]} alt="Feature phone representing USSD accessibility" className="w-full h-full object-cover object-center" />
                </div>
              </div>
            </div>
            
            {/* USSD FLOW */}
            <div className="bg-background rounded-lg p-8 border border-border">
              <h3 className="text-xl font-bold text-text mb-8 text-center font-serif">The USSD Workflow</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
                {["Dial *384#", "Choose Farmer", "Register/Login", "Post Produce", "Select Bag Size (90kg/50kg)", "Enter No. of Bags", "View Buyers", "Confirm"].map((step, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-public-primary text-white flex items-center justify-center font-bold text-sm mb-2">{i+1}</div>
                    <p className="text-xs text-gray-600 font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BUYER & MEETING */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-16">
              <div className="relative order-2 lg:order-1">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={IMAGES["corn-pile-2"]} alt="Vegetable stand at a market" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">2. The Buyer Starts With Demand</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-text leading-tight mb-6 font-serif">Coordinating Supply and Demand</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">Buyers use the web platform to publish demand, specify required quantity, and view farmer-posted supply.</p>
                <div className="bg-surface border border-border rounded-lg p-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Example Workflow</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="font-bold text-text font-serif">Farmer</p><p className="text-sm text-gray-500">"I have 80 bags."</p></div>
                    <div className="flex items-center justify-center"><span className="text-public-primary font-bold text-2xl">+</span></div>
                    <div><p className="font-bold text-text font-serif">Buyer</p><p className="text-sm text-gray-500">"I need 100 bags."</p></div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border text-center">
                    <p className="font-bold text-public-primary">SmartShamba coordinates the transaction.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRANSPORT & WEATHER */}
        <section className="bg-surface py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">3. SmartShamba Coordinates the Transaction</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4 font-serif">From Confirmed Transaction to Delivery</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Once a transaction is confirmed, transport is arranged and produce is tracked until delivery.</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="relative">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-md border border-border">
                  <ImageCrossfade
                    images={[
                      { src: IMAGES["sugarcane-truck"], alt: "Sugarcane truck" },
                      { src: IMAGES["tractor"], alt: "Tractor" },
                      { src: IMAGES["dirt-road-corn"], alt: "Dirt road through corn field" },
                    ]}
                    interval={3500}
                    className="w-full h-full"
                    imgClassName="object-cover"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text mb-6 font-serif">Produce Tracking During Transport</h3>
                <div className="space-y-4">
                  {["REQUESTED - Transport requested", "ACCEPTED - Provider accepts job", "LOADED - Produce picked up", "IN TRANSIT - Moving to buyer", "DELIVERED - Arrival confirmed", "COMPLETED - Transaction closed"].map((status) => (
                    <div key={status} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-public-primary shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-900 text-white rounded-lg p-8 lg:p-12 grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <CloudRain className="w-10 h-10 text-public-secondary mb-4" />
                <h3 className="text-2xl font-bold mb-4 font-serif text-white">Weather-Aware Transport</h3>
                <p className="text-gray-300 leading-relaxed">Transport does not operate in isolation from the weather. SmartShamba monitors relevant weather alerts and can place operational transport holds when severe weather affects the pickup or drop-off area.</p>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-md overflow-hidden shadow-lg border border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={IMAGES["green-trees-field"]} alt="Green trees on brown grass field" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GROUP SELLING */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">5. Group Selling</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-text leading-tight mb-6 font-serif">Turning Small Quantities Into One Coordinated Supply</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">Multiple farmers in the same local group can combine their produce into a larger coordinated transaction to meet institutional buyer demand.</p>
                <div className="bg-surface border border-border rounded-lg p-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Illustrative Example</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Farmer A &rarr; 30 bags</p>
                    <p>Farmer B &rarr; 40 bags</p>
                    <p>Farmer C &rarr; 25 bags</p>
                    <p className="font-bold text-text pt-2 border-t border-border mt-2">TOTAL: 95 bags (Shared transport, individual settlement)</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-6">Farmers can participate collectively while income is allocated individually according to the produce contributed.</p>
              </div>
              <div className="relative">
                <div className="relative aspect-4/3 rounded-lg overflow-hidden shadow-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={IMAGES["man-bucket"]} alt="Man with bucket" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTELLIGENCE LAYER */}
        <section className="bg-surface py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-public-primary font-semibold text-xs uppercase tracking-[0.15em] mb-4">SmartShamba Intelligence Layer</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4 font-serif">Decision Support Built Around Signals</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Beyond coordinating transactions, SmartShamba adds intelligence that helps participants make better-informed operational decisions.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-border rounded-lg p-8">
                <TrendingUp className="w-8 h-8 text-public-primary mb-4" />
                <h3 className="font-bold text-text text-lg mb-3 font-serif">Market Intelligence</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Farmers receive market prices, trends, and AI-assisted selling advisories. Buyers access supply visibility and buying decision support.</p>
              </div>
              <div className="border border-border rounded-lg p-8">
                <CloudRain className="w-8 h-8 text-public-primary mb-4" />
                <h3 className="font-bold text-text text-lg mb-3 font-serif">Weather & Agricultural Alerts</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Weekly SMS alerts for weather changes, rain events, and pest/disease advisories to help farmers stay informed beyond the transaction.</p>
              </div>
              <div className="border border-border rounded-lg p-8">
                <Bell className="w-8 h-8 text-public-primary mb-4" />
                <h3 className="font-bold text-text text-lg mb-3 font-serif">USSD + Web + SMS</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Three access channels around the same coordination system: USSD for access, Web for rich workflows, SMS for ongoing alerts.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="relative bg-gray-900 text-white py-20 lg:py-28 overflow-hidden">
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 font-serif">From Farm to Market, Every Step Connected.</h2>
            <p className="text-lg text-gray-200 leading-relaxed max-w-2xl mx-auto mb-10">
              SmartShamba brings farmers, buyers, transport providers, and agricultural intelligence into one coordinated system across Rift Valley & Western Kenya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/market-prices" className="inline-flex items-center justify-center gap-2 bg-public-primary text-white px-8 py-3.5 rounded-md text-sm font-bold hover:bg-public-primary/90 transition-colors">
                Explore Market Prices <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/buyers" className="inline-flex items-center justify-center gap-2 border border-white/40 text-white px-8 py-3.5 rounded-md text-sm font-bold hover:bg-white/10 transition-colors">
                View Verified Buyers
              </Link>
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
