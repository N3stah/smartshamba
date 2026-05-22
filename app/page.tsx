export default function Home() {
  return (
    <main className="min-h-screen bg-green-50">
      {/* HERO SECTION */}
      <section className="px-6 py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-green-800 max-w-5xl leading-tight">
          Farmers Should Know the Buyer Offer
          Before Transporting Their Harvest
        </h1>

        <p className="mt-8 text-lg md:text-2xl text-gray-700 max-w-3xl leading-relaxed">
          SmartShamba helps maize farmers in Trans Nzoia pre-confirm buyer offers through USSD before transport begins.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mt-10 w-full max-w-md">
          <a
            href="/ussd"
            className="bg-green-700 text-white px-6 py-4 rounded-xl text-lg hover:bg-green-800 transition"
          >
            Launch USSD Demo
          </a>

          <a
            href="/market"
            className="border border-green-700 text-green-700 px-6 py-4 rounded-xl text-lg hover:bg-green-100 transition"
          >
            View Market Prices
          </a>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            The Problem
          </h2>

          <p className="mt-8 text-xl text-gray-700 leading-relaxed">
            Many maize farmers transport harvests without a pre-confirmed buyer agreement.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
              <h3 className="font-bold text-xl text-red-700">
                Real Market Price
              </h3>

              <p className="mt-4 text-gray-700">
                Brokers manipulate prices because farmers lack trusted
                market visibility.
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
              <h3 className="font-bold text-xl text-red-700">
                Trusted Buyers
              </h3>

              <p className="mt-4 text-gray-700">
                Farmers transport produce without a pre-confirmed buyer or recorded price agreement.
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
              <h3 className="font-bold text-xl text-red-700">
                Payment Security
              </h3>

              <p className="mt-4 text-gray-700">
                Delayed payments and buyer unreliability create serious financial exposure for farmers
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* FARMER STORY */}
      <section className="px-6 py-16">
       <div className="max-w-4xl mx-auto bg-green-800 text-white rounded-3xl p-10 shadow-lg">
    
         <p className="text-2xl md:text-3xl italic leading-relaxed">
            “I loaded 40 bags expecting one price.
           After delivery, the buyer reduced the offer.”
         </p>

         <p className="mt-6 text-green-100">
         — Illustrative farmer transaction scenario from Trans Nzoia County
         </p>
       </div>
      </section>
      {/* HOW IT WORKS */}
      <section className="mt-24">
  <h2 className="text-3xl font-bold text-center text-green-800">
    How SmartShamba Works
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-12">
    
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
      <h3 className="text-xl font-bold text-green-700">
        1. Dial *123#
      </h3>

      <p className="mt-3 text-gray-600 text-sm">
        Farmers access SmartShamba using any mobile phone through USSD.
      </p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
      <h3 className="text-xl font-bold text-green-700">
        2. Enter Quantity
      </h3>

      <p className="mt-3 text-gray-600 text-sm">
        Farmers enter the number of maize bags ready for sale.
      </p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
      <h3 className="text-xl font-bold text-green-700">
        3. View Offers
      </h3>

      <p className="mt-3 text-gray-600 text-sm">
        Farmers see verified buyer offers and indicative prices before transport.
      </p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
      <h3 className="text-xl font-bold text-green-700">
        4. Confirm Offer
      </h3>

      <p className="mt-3 text-gray-600 text-sm">
        The selected buyer offer is recorded before delivery begins.
      </p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
      <h3 className="text-xl font-bold text-green-700">
        5. Receive Payment
      </h3>

      <p className="mt-3 text-gray-600 text-sm">
        Payment is processed through M-PESA after delivery confirmation.
      </p>
    </div>

  </div>
</section>

      {/* TRUST SECTION */}
      <section className="bg-green-800 text-white px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold">
            Building Trust Infrastructure for Farmers
          </h2>

          <p className="mt-8 text-xl leading-relaxed text-green-100">
            SmartShamba is not just a marketplace.
            It is a transaction coordination and trust layer designed to reduce post-harvest transaction uncertainty..
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
  <div className="rounded-2xl border border-green-200 bg-white/10 p-6 backdrop-blur-sm">
    <h3 className="text-2xl font-bold">
      Pilot Deployment Stage
    </h3>

    <p className="mt-2 text-green-100 text-sm">
      Focused operational prototype for maize farmers in Trans Nzoia County.
    </p>
  </div>

  <div className="rounded-2xl border border-green-200 bg-white/10 p-6 backdrop-blur-sm">
    <h3 className="text-2xl font-bold">
      USSD + M-PESA Workflow
    </h3>

    <p className="mt-2 text-green-100 text-sm">
      Prototype transaction coordination flow using USSD and M-PESA settlement simulation.
    </p>
  </div>

  <div className="rounded-2xl border border-green-200 bg-white/10 p-6 backdrop-blur-sm">
    <h3 className="text-2xl font-bold">
      Manual Buyer Verification
    </h3>

    <p className="mt-2 text-green-100 text-sm">
      Buyer verification and coordination currently handled directly by the SmartShamba team.
    </p>
  </div>
</div>
        </div>
      </section>
    </main>
  );
}