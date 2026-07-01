import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-green-50">

      {/* ── 1. HERO ── */}
      <section className="px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-green-200">
          Pilot Preparation Stage · Trans Nzoia County · 2026
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-green-800 max-w-5xl leading-tight">
          Farmers Should Know the Buyer Offer Before Transporting Their Harvest
        </h1>
        <p className="mt-8 text-lg md:text-2xl text-gray-700 max-w-3xl leading-relaxed">
          SmartShamba helps maize farmers in Trans Nzoia pre-confirm buyer offers through USSD before transport begins.
        </p>
        <div className="flex flex-col md:flex-row gap-4 mt-10 w-full max-w-md">
          <a href="/ussd" className="bg-green-700 text-white px-6 py-4 rounded-xl text-lg hover:bg-green-800 transition text-center">
            Launch USSD Demo
          </a>
          <a href="/market" className="border border-green-700 text-green-700 px-6 py-4 rounded-xl text-lg hover:bg-green-100 transition text-center">
            View Market Prices
          </a>
        </div>
      </section>

      {/* ── FARMER IMAGE ── */}
      <section className="px-6 pb-10">
        <div className="max-w-5xl mx-auto">
          <Image
            src="/farmer-maize.jpg"
            alt="Maize transport in Trans Nzoia"
            width={1200}
            height={800}
            className="w-full rounded-3xl shadow-xl object-cover h-96"
          />
          <p className="text-center text-sm text-gray-500 mt-4">
            Maize transport and buyer coordination in Trans Nzoia County.
          </p>
        </div>
      </section>

      {/* ── 2. PROBLEM ── */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">The Problem</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            What Happens Without Price Transparency
          </h2>
          <p className="mt-8 text-xl text-gray-700 leading-relaxed max-w-3xl">
            Many maize farmers transport harvests without a pre-confirmed buyer agreement — discovering the real price only after the truck is loaded.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
              <div className="text-2xl mb-3">📉</div>
              <h3 className="font-bold text-xl text-red-700">Price Manipulation</h3>
              <p className="mt-4 text-gray-700">Brokers exploit information gaps because farmers lack trusted market visibility before committing to transport.</p>
            </div>
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
              <div className="text-2xl mb-3">🚛</div>
              <h3 className="font-bold text-xl text-red-700">No Confirmed Buyer</h3>
              <p className="mt-4 text-gray-700">Farmers transport produce without a recorded buyer agreement or price commitment.</p>
            </div>
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
              <div className="text-2xl mb-3">💸</div>
              <h3 className="font-bold text-xl text-red-700">Payment Uncertainty</h3>
              <p className="mt-4 text-gray-700">Delayed payments and buyer unreliability create serious financial exposure for smallholder farmers.</p>
            </div>
          </div>

          <div className="mt-10 bg-green-800 text-white rounded-3xl p-10 shadow-lg">
            <p className="text-2xl md:text-3xl italic leading-relaxed">
              "I loaded 40 bags expecting one price. After delivery, the buyer reduced the offer."
            </p>
            <p className="mt-6 text-green-100 text-sm">
              — Illustrative farmer transaction scenario from Trans Nzoia County
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. CUSTOMER DISCOVERY ── */}
      <section className="px-6 py-20 bg-green-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Customer Discovery & Validation</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            We Interviewed Real Farmers and Buyers First
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-3xl">
            Before writing a single line of production code, the SmartShamba team conducted field interviews in Trans Nzoia County to understand the real problem.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { number: "19", label: "Maize Farmers Interviewed" },
              { number: "4", label: "Maize Buyers Interviewed" },
              { number: "1", label: "County Focused" },
              { number: "2", label: "Discovery Team Members" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-green-100 p-6 text-center shadow-sm">
                <p className="text-4xl font-bold text-green-700">{s.number}</p>
                <p className="text-sm text-gray-600 mt-2">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Discovery team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-white rounded-2xl border border-green-100 p-6 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold text-lg">GA</div>
              <div>
                <p className="font-bold text-gray-900">Grace Akomo</p>
                <p className="text-sm text-green-700">COO · Customer Discovery Lead</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-green-100 p-6 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold text-lg">EC</div>
              <div>
                <p className="font-bold text-gray-900">Eva Chepchumba</p>
                <p className="text-sm text-green-700">PM · Product & UX Research</p>
              </div>
            </div>
          </div>

          {/* What they told us */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-orange-100 p-8 shadow-sm">
              <h3 className="font-bold text-lg text-orange-700 mb-4">👨‍🌾 Farmers Told Us</h3>
              <ul className="space-y-3">
                {[
                  "Losing negotiating power after harvest",
                  "Lack of real price transparency",
                  "Payment uncertainty after delivery",
                  "Transporting without a confirmed buyer",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="text-orange-500 mt-0.5">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-blue-100 p-8 shadow-sm">
              <h3 className="font-bold text-lg text-blue-700 mb-4">🏢 Buyers Told Us</h3>
              <ul className="space-y-3">
                {[
                  "Fake quantity information from farmers",
                  "Delivery delays causing warehouse issues",
                  "Farmers not always ready to sell",
                  "Trust concerns in transactions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="text-blue-500 mt-0.5">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-green-800 text-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-xl font-semibold leading-relaxed">
              💡 "Our interviews revealed that <span className="underline decoration-green-300">trust — not production</span> — was the biggest challenge in maize transactions."
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. THE PIVOT ── */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Product Pivot</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How Customer Feedback Changed SmartShamba
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl">
            Rather than continuing to build features we assumed farmers needed, customer interviews helped us focus on the problem they repeatedly described — selling maize safely after harvest.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Original */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Original SmartShamba</p>
              <ul className="space-y-3">
                {[
                  "🌦️ AI Weather Prediction",
                  "🔬 Crop Disease Detection",
                  "📡 IoT Sensors",
                  "🌱 Soil Monitoring",
                  "🧠 Climate Intelligence",
                  "📲 SMS Advisory",
                ].map((item) => (
                  <li key={item} className="text-gray-500 text-sm line-through">{item}</li>
                ))}
              </ul>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-white text-2xl shadow-lg mb-3">→</div>
              <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Customer Discovery</p>
              <p className="text-xs text-gray-500 mt-1">Changed everything</p>
            </div>

            {/* Today */}
            <div className="bg-green-50 rounded-2xl border border-green-200 p-8">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4">Today's SmartShamba</p>
              <ul className="space-y-3">
                {[
                  "📱 USSD Transaction Coordination",
                  "✅ Verified Buyer Directory",
                  "🤝 Buyer-Farmer Matching",
                  "💰 Price Transparency",
                  "📋 Transaction References",
                  "💳 M-PESA Integration",
                ].map((item) => (
                  <li key={item} className="text-gray-800 text-sm font-medium">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FROM ASSUMPTIONS TO EVIDENCE ── */}
      <section className="bg-green-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Evidence-Based Product Evolution</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">From Assumptions to Evidence</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Hypothesis",
                color: "border-gray-200 bg-white",
                text: "Farmers need AI, weather data, and IoT sensors to improve yields.",
              },
              {
                step: "02",
                title: "Customer Interviews",
                color: "border-orange-200 bg-orange-50",
                text: "19 farmers and 4 buyers told us the real problem was trust and price uncertainty at the point of sale.",
              },
              {
                step: "03",
                title: "Product Changes",
                color: "border-blue-200 bg-blue-50",
                text: "We dropped IoT and AI features. We focused entirely on USSD-based buyer matching and price pre-confirmation.",
              },
              {
                step: "04",
                title: "Current Prototype",
                color: "border-green-200 bg-green-50",
                text: "USSD flow, SMS notifications, M-PESA integration, admin dashboard — all built and deployed.",
              },
            ].map((card) => (
              <div key={card.step} className={`rounded-2xl border p-6 ${card.color} shadow-sm`}>
                <p className="text-3xl font-bold text-gray-300 mb-3">{card.step}</p>
                <h3 className="font-bold text-gray-900 mb-3">{card.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS ── */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Current Solution</p>
          <h2 className="text-3xl font-bold text-center text-green-800 mb-12">How SmartShamba Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: "1", title: "Dial *384*53374#", desc: "Farmers access SmartShamba using any mobile phone through USSD — no smartphone or internet needed." },
              { step: "2", title: "Enter Quantity", desc: "Farmers enter the number of maize bags ready for sale." },
              { step: "3", title: "View Offers", desc: "Farmers see verified buyer offers and current prices before transport." },
              { step: "4", title: "Confirm Offer", desc: "The selected buyer offer is recorded and an SMS confirmation is sent." },
              { step: "5", title: "Receive Payment", desc: "Payment is processed through M-PESA after delivery confirmation." },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
                <div className="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold mb-4">{s.step}</div>
                <h3 className="text-lg font-bold text-green-700 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="/ussd" className="bg-green-700 text-white px-8 py-4 rounded-xl text-lg hover:bg-green-800 transition inline-block">
              Try the USSD Demo →
            </a>
          </div>
        </div>
      </section>

      {/* ── 7. WHY USSD ── */}
      <section className="bg-green-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Design Decision</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why We Chose USSD</h2>
          <p className="text-lg text-gray-600 mb-10 max-w-3xl">
            Accessibility first. Every technology decision in SmartShamba starts with one question: can a farmer in rural Trans Nzoia use this without a smartphone or internet connection?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "📱", title: "Feature Phone Compatible", desc: "Farmers already own and use feature phones. No new device required." },
              { icon: "🌐", title: "No Internet Required", desc: "USSD works on 2G networks. It functions anywhere there is a mobile signal." },
              { icon: "🔒", title: "Familiar Experience", desc: "Farmers already use USSD for M-PESA. The interaction model is already trusted." },
              { icon: "💳", title: "M-PESA Native", desc: "USSD integrates naturally with Safaricom M-PESA for payment settlement." },
              { icon: "♿", title: "Accessibility First", desc: "Works for farmers regardless of literacy level or smartphone access." },
              { icon: "⚡", title: "Instant Response", desc: "USSD sessions are real-time — no loading screens, no app downloads." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-green-100 p-6 shadow-sm">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. TECHNICAL ROADMAP (honest) ── */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Technical Roadmap</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What We've Built. What Comes Next.</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl">
            SmartShamba has moved from prototype to a deployed pilot-ready system. Here is the honest current state.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Built */}
            <div className="bg-green-50 rounded-2xl border border-green-200 p-8">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-6">✅ Already Built & Deployed</p>
              <ul className="space-y-4">
                {[
                  { label: "Next.js 16 on Vercel", sub: "Production deployment, App Router, TypeScript" },
                  { label: "USSD Integration", sub: "Africa's Talking · *384*53374# · 5-step flow" },
                  { label: "SMS Notifications", sub: "Offer confirmation and settlement SMS to farmers" },
                  { label: "PostgreSQL Database", sub: "Supabase · Farmers, Buyers, Transactions" },
                  { label: "M-PESA Daraja C2B", sub: "Callback handler, amount verification, idempotency" },
                  { label: "Admin Dashboard", sub: "Login, KPI cards, buyer CRUD, manual settlement" },
                  { label: "Error Monitoring", sub: "Sentry · all business routes instrumented" },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="text-green-600 mt-0.5 shrink-0">✓</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">🗺️ Next — Pilot & Scale</p>
              <ul className="space-y-4">
                {[
                  { label: "Safaricom Production Credentials", sub: "C2B URL registration pending Safaricom approval" },
                  { label: "Real Pilot Users", sub: "5–10 farmers, 2–5 buyers in Trans Nzoia" },
                  { label: "Farmer Verification Workflow", sub: "Identity and phone verification at onboarding" },
                  { label: "Audit Logs", sub: "Admin action recording for all settlements" },
                  { label: "Analytics Dashboard", sub: "Volume trends, settlement rates, county metrics" },
                  { label: "Fraud Prevention", sub: "Duplicate submissions, anomaly detection" },
                  { label: "Multi-county Expansion", sub: "After Trans Nzoia pilot validation" },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="text-gray-300 mt-0.5 shrink-0">○</span>
                    <div>
                      <p className="font-semibold text-gray-600 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. LESSONS LEARNED ── */}
      <section className="bg-green-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Reflection</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Lessons We Learned</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num: "01", lesson: "Customers don't always want what founders initially think.", icon: "🔍" },
              { num: "02", lesson: "Trust creates more value than additional technology.", icon: "🤝" },
              { num: "03", lesson: "Technology should adapt to farmers — not farmers to technology.", icon: "♿" },
              { num: "04", lesson: "Solving one problem exceptionally well is better than solving many.", icon: "🎯" },
              { num: "05", lesson: "Customer discovery changed how our entire team builds products.", icon: "💡" },
            ].map((item) => (
              <div key={item.num} className="bg-white rounded-2xl border border-green-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-bold text-gray-300">{item.num}</span>
                </div>
                <p className="text-gray-800 font-medium leading-relaxed">{item.lesson}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. TEAM ── */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">The Team</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Meet SmartShamba</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                initials: "DA", name: "Daisy Ayuma", role: "CEO",
                responsibilities: ["Business Strategy", "Partnerships", "Buyer Onboarding", "Investor Relations"],
              },
              {
                initials: "MM", name: "Mark Manoti", role: "CTO",
                responsibilities: ["Platform Architecture", "USSD Engineering", "API Development", "Infrastructure"],
              },
              {
                initials: "GA", name: "Grace Akomo", role: "COO",
                responsibilities: ["Farmer Operations", "Pilot Coordination", "Customer Discovery", "Field Research"],
              },
              {
                initials: "EC", name: "Eva Chepchumba", role: "PM",
                responsibilities: ["UX Design", "Product Iteration", "Customer Feedback", "Sprint Planning"],
              },
            ].map((member) => (
              <div key={member.name} className="bg-green-50 rounded-2xl border border-green-100 p-6 shadow-sm text-center">
                <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {member.initials}
                </div>
                <p className="font-bold text-gray-900 text-lg">{member.name}</p>
                <p className="text-green-700 font-semibold text-sm mb-4">{member.role}</p>
                <ul className="text-left space-y-1">
                  {member.responsibilities.map((r) => (
                    <li key={r} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-green-500 shrink-0">·</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. WHY TRANS NZOIA ── */}
      <section className="bg-green-50 px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Pilot Focus</p>
          <h2 className="text-3xl md:text-5xl font-bold text-green-900 mb-6">Why Trans Nzoia?</h2>
          <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto mb-14">
            SmartShamba is intentionally focused on one county during the pilot stage to improve operational coordination, farmer onboarding, and buyer verification before expanding.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Major Maize-Producing Region", desc: "Trans Nzoia is one of Kenya's largest maize-producing regions, making it operationally suitable for an early coordination pilot." },
              { title: "Dense Farmer Activity", desc: "High farmer concentration improves onboarding efficiency and simplifies field coordination during early deployment." },
              { title: "Existing Grain Logistics", desc: "Existing grain transport and aggregation workflows make buyer coordination easier during pilot operations." },
              { title: "Controlled Expansion Strategy", desc: "SmartShamba is intentionally starting with one crop and one geographic region before broader expansion." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-green-100 bg-white p-8 text-left shadow-sm">
                <h3 className="text-xl font-bold text-green-800 mb-3">{item.title}</h3>
                <p className="text-gray-700 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. CALL TO ACTION ── */}
      <section className="bg-green-800 text-white px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Building Trust Infrastructure for Farmers
          </h2>
          <p className="text-xl leading-relaxed text-green-100 max-w-3xl mx-auto mb-12">
            SmartShamba is not just a marketplace. It is a transaction coordination and trust layer designed to reduce post-harvest transaction uncertainty in Trans Nzoia County.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { title: "Pilot Preparation Stage", desc: "Focused operational prototype for maize farmers in Trans Nzoia County." },
              { title: "USSD + M-PESA Workflow", desc: "Live USSD coordination with M-PESA settlement integration." },
              { title: "Admin Operations Live", desc: "Full admin dashboard for transaction management and buyer coordination." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-green-200 bg-white/10 p-6 backdrop-blur-sm text-left">
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-green-100 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a href="/ussd" className="bg-white text-green-800 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-50 transition">
              Try USSD Demo
            </a>
            <a href="/buyer" className="border border-white text-white px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition">
              View Verified Buyers
            </a>
          </div>
          <p className="mt-16 text-2xl italic text-green-200">
            "A farmer should not discover the real price after the truck is loaded."
          </p>
        </div>
      </section>

    </main>
  );
}
