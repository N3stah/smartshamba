const buyerOffers = [
  { buyer: "Eldoret Grain", price: "KSh 2,950", capacity: "10,000 bags", location: "Eldoret Town" },
  { buyer: "Kitale Millers", price: "KSh 2,800", capacity: "5,000 bags", location: "Kitale Town" },
  { buyer: "Trans Nzoia Cereals", price: "KSh 2,700", capacity: "8,000 bags", location: "Mois Bridge" },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#f6faf6] text-gray-900">

      <section className="px-6 py-20 text-center bg-green-800 text-white">
        <div className="max-w-4xl mx-auto">
          <p className="uppercase tracking-widest text-sm text-green-300 font-semibold mb-4">
            SmartShamba Pilot Demo · Trans Nzoia County · 2026
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Farmers Should Know Their Buyer Before Transporting Their Harvest
          </h1>
          <p className="text-xl text-green-100 leading-relaxed max-w-3xl mx-auto">
            SmartShamba helps maize farmers pre-confirm buyer offers before transport using a simple USSD workflow. Dial <strong>*384*53374#</strong> from any mobile phone.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider text-center mb-3">How It Works</p>
          <h2 className="text-3xl font-bold text-green-900 text-center mb-12">USSD Coordination Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: "1", title: "Dial *384*53374#", desc: "Access SmartShamba from any mobile phone — no internet or smartphone needed." },
              { step: "2", title: "Enter Quantity", desc: "Type how many bags of maize you want to sell." },
              { step: "3", title: "View Buyer Offers", desc: "See verified buyer names and current prices before committing to transport." },
              { step: "4", title: "Confirm Offer", desc: "Select your buyer. A transaction reference is generated and SMS sent." },
              { step: "5", title: "Receive M-PESA", desc: "Payment is settled via M-PESA after delivery confirmation." },
            ].map((s) => (
              <div key={s.step} className="bg-green-50 border border-green-100 rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm mb-4">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-green-800 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-green-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider text-center mb-3">Live Data</p>
          <h2 className="text-3xl font-bold text-green-900 text-center mb-4">Verified Buyer Directory</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            These are the active verified buyers currently on the SmartShamba platform. Prices reflect current offers — farmers see these when they dial in.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buyerOffers.map((buyer) => (
              <div key={buyer.buyer} className="bg-white rounded-2xl border border-green-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-green-800">{buyer.buyer}</h3>
                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">✓ Verified</span>
                </div>
                <p className="text-3xl font-bold text-green-700 mb-1">{buyer.price}</p>
                <p className="text-xs text-gray-500 mb-4">per 90kg bag</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>📍 {buyer.location}</p>
                  <p>🌽 Capacity: {buyer.capacity}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Prices are indicative and subject to market conditions. Buyer verification is managed by the SmartShamba team.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-green-700 font-semibold text-sm uppercase tracking-wider text-center mb-3">Pilot Transactions</p>
          <h2 className="text-3xl font-bold text-green-900 text-center mb-4">Live Transaction Activity</h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            Sample transactions from the SmartShamba pilot system. References use the SS-XXXXXX format generated at confirmation.
          </p>
          <div className="space-y-4">
            {[
              { ref: "SS-MQOI0F74-FV93", farmer: "Trans Nzoia Pilot Farmer", buyer: "Eldoret Grain", bags: 2, value: "KSh 5,900", status: "SETTLED", statusColor: "bg-green-100 text-green-700" },
              { ref: "SS-MQ5P71JU-OCE2", farmer: "Trans Nzoia Pilot Farmer", buyer: "Trans Nzoia Cereals", bags: 10, value: "KSh 27,000", status: "SETTLED", statusColor: "bg-green-100 text-green-700" },
              { ref: "SS-MQ7BS0O5-2EE0", farmer: "Trans Nzoia Pilot Farmer", buyer: "Kitale Millers", bags: 30, value: "KSh 84,000", status: "PENDING", statusColor: "bg-yellow-100 text-yellow-700" },
            ].map((tx) => (
              <div key={tx.ref} className="bg-white rounded-2xl border border-green-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
                <div>
                  <p className="font-mono text-sm font-bold text-gray-800">{tx.ref}</p>
                  <p className="text-gray-500 text-xs mt-1">{tx.farmer} → {tx.buyer}</p>
                </div>
                <div className="text-sm text-gray-600">{tx.bags} bags</div>
                <div className="font-semibold text-gray-900">{tx.value}</div>
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${tx.statusColor}`}>{tx.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-green-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">SmartShamba reduces transaction uncertainty.</h2>
          <p className="text-2xl text-green-100 leading-relaxed mt-4">
            A farmer should not discover the real price after the truck is loaded.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-10">
            <a href="/ussd" className="bg-white text-green-800 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition">
              Try USSD Simulator
            </a>
            <a href="/buyer" className="border border-white text-white px-6 py-3 rounded-xl hover:bg-white/10 transition">
              View Live Buyers
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
