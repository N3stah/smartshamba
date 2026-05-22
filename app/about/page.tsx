export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-green-800">
            About SmartShamba
          </h1>

          <p className="mt-4 text-gray-600 max-w-3xl mx-auto">
            SmartShamba is a pilot transaction coordination platform helping maize farmers
            pre-confirm buyer offers before transport using USSD and M-PESA workflows.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 mt-12">
          <h2 className="text-2xl font-bold text-green-700">
            Our Mission
          </h2>

          <p className="mt-4 text-gray-700 leading-relaxed">
            Many farmers transport maize without a pre-confirmed buyer agreement,
            exposing them to delayed payments, price renegotiation, and transaction uncertainty.
            SmartShamba focuses on reducing this uncertainty through simple coordination tools
            accessible from any mobile phone.
          </p>
        </div>

        {/* Team */}
        <div className="mt-14">
          <h2 className="text-3xl font-bold text-green-800 text-center">
            Startup Team
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

            {/* CEO */}
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8">
              <h3 className="text-2xl font-bold text-green-700">
                Daisy Ayuma
              </h3>

              <p className="text-sm text-green-600 mt-1">
                CEO · Strategic Partnerships & Operations
              </p>

              <p className="mt-4 text-gray-700 leading-relaxed">
                Leads SmartShamba’s business strategy, partnership development,
                buyer onboarding, and operational compliance. Focused on building
                trusted relationships with maize buyers and pilot deployment partners.
              </p>
            </div>

            {/* CTO */}
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8">
              <h3 className="text-2xl font-bold text-green-700">
                Mark Manoti
              </h3>

              <p className="text-sm text-green-600 mt-1">
                CTO · Platform Engineering & Infrastructure
              </p>

              <p className="mt-4 text-gray-700 leading-relaxed">
                Responsible for SmartShamba’s USSD workflow systems,
                frontend platform architecture, transaction coordination logic,
                and deployment infrastructure using Next.js, Vercel, and M-PESA integrations.
              </p>
            </div>

            {/* COO */}
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8">
              <h3 className="text-2xl font-bold text-green-700">
                Grace Akomo
              </h3>

              <p className="text-sm text-green-600 mt-1">
                COO · Field Operations & Farmer Coordination
              </p>

              <p className="mt-4 text-gray-700 leading-relaxed">
                Oversees pilot field operations, farmer onboarding,
                cooperative engagement, and delivery coordination
                across Trans Nzoia County.
              </p>
            </div>

            {/* PM */}
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8">
              <h3 className="text-2xl font-bold text-green-700">
                Eva Chepchumba
              </h3>

              <p className="text-sm text-green-600 mt-1">
                Product Manager · User Experience & Workflow Optimization
              </p>

              <p className="mt-4 text-gray-700 leading-relaxed">
                Focused on improving farmer usability, USSD interaction flows,
                onboarding experience, and feedback collection during pilot testing.
              </p>
            </div>

          </div>
        </div>

        {/* Closing */}
        <div className="bg-green-800 text-white rounded-2xl p-10 mt-16 text-center">
          <h2 className="text-3xl font-bold">
            Pilot Deployment Stage · 2026
          </h2>

          <p className="mt-4 text-green-100 max-w-2xl mx-auto">
            SmartShamba is currently focused on maize transaction coordination
            workflows within Trans Nzoia County, Kenya.
          </p>
        </div>

      </div>
    </main>
  );
}