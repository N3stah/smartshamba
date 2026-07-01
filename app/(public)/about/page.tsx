export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-green-800 text-white px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-green-300 text-sm font-semibold uppercase tracking-wider mb-4">Pilot Preparation Stage · 2026</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About SmartShamba</h1>
          <p className="text-green-100 text-xl leading-relaxed">
            A transaction coordination platform helping maize farmers pre-confirm buyer offers before transport — using USSD and M-PESA workflows accessible from any mobile phone.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-green-100 p-8 shadow-sm mb-10">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed text-lg">
            Many farmers transport maize without a pre-confirmed buyer agreement, exposing them to delayed payments, price renegotiation, and transaction uncertainty. SmartShamba reduces this uncertainty through simple coordination tools accessible from any mobile phone — no smartphone or internet required.
          </p>
          <div className="mt-8 bg-green-50 rounded-xl p-6 border-l-4 border-green-600">
            <p className="text-green-900 text-xl font-semibold italic">
              "A farmer should not discover the real price after the truck is loaded."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {[
            { label: "USSD Code", value: "*384*53374#", sub: "Africa's Talking sandbox" },
            { label: "Target County", value: "Trans Nzoia", sub: "Pilot deployment region" },
            { label: "Stage", value: "Pilot Ready", sub: "Deployed on Vercel" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-green-100 p-6 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-700">{s.value}</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">{s.label}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-bold text-green-800 text-center mb-10">The Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {[
            {
              initials: "DA", name: "Daisy Ayuma", role: "CEO · Strategic Partnerships & Operations",
              bio: "Leads SmartShamba's business strategy, partnership development, buyer onboarding, and operational compliance. Focused on building trusted relationships with maize buyers and pilot deployment partners.",
            },
            {
              initials: "MM", name: "Mark Manoti", role: "CTO · Platform Engineering & Infrastructure",
              bio: "Responsible for SmartShamba's USSD workflow systems, backend APIs, transaction coordination logic, admin dashboard, and deployment infrastructure using Next.js, Supabase, Africa's Talking, and Safaricom Daraja.",
            },
            {
              initials: "GA", name: "Grace Akomo", role: "COO · Field Operations & Farmer Coordination",
              bio: "Oversees pilot field operations, farmer onboarding, cooperative engagement, and customer discovery. Led the 19-farmer interview process that shaped SmartShamba's product pivot.",
            },
            {
              initials: "EC", name: "Eva Chepchumba", role: "PM · User Experience & Product Iteration",
              bio: "Focused on improving farmer usability, USSD interaction flows, onboarding experience, and feedback collection during pilot testing. Co-led customer discovery with 4 buyer interviews.",
            },
          ].map((m) => (
            <div key={m.name} className="bg-white rounded-2xl border border-green-100 p-8 shadow-sm flex gap-5">
              <div className="w-14 h-14 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                {m.initials}
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-700">{m.name}</h3>
                <p className="text-sm text-green-600 mb-3">{m.role}</p>
                <p className="text-gray-700 leading-relaxed text-sm">{m.bio}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-green-800 text-white rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Pilot Deployment Stage · 2026</h2>
          <p className="text-green-100 max-w-2xl mx-auto mb-6">
            SmartShamba is currently focused on maize transaction coordination within Trans Nzoia County, Kenya. USSD is live, SMS notifications are working, and the admin operations console is deployed.
          </p>
          <a href="/ussd" className="inline-block bg-white text-green-800 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition">
            Try USSD Demo →
          </a>
        </div>
      </section>
    </main>
  );
}
