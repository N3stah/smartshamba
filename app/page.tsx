export default function Home() {
  return (
    <main className="min-h-screen bg-green-50">
      {/* HERO SECTION */}
      <section className="px-6 py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-green-800 max-w-5xl leading-tight">
          Farmers Should Know Their Buyer
          Before Transporting Their Maize
        </h1>

        <p className="mt-8 text-lg md:text-2xl text-gray-700 max-w-3xl leading-relaxed">
          SmartShamba helps maize farmers in Trans Nzoia lock verified buyer
          prices before transport and receive trusted M-PESA settlement after
          delivery.
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
            Thousands of farmers harvest maize without knowing:
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
                Farmers transport produce without guaranteed purchase agreements.
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
              <h3 className="font-bold text-xl text-red-700">
                Payment Security
              </h3>

              <p className="mt-4 text-gray-700">
                Delayed payments and buyer fraud create massive financial risk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-green-800 text-center">
            How SmartShamba Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
            <div className="bg-white p-6 rounded-2xl shadow">
              <div className="text-4xl">📱</div>

              <h3 className="mt-4 font-bold text-xl">
                Dial USSD
              </h3>

              <p className="mt-3 text-gray-600">
                Farmers dial *123# on any phone.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <div className="text-4xl">🌽</div>

              <h3 className="mt-4 font-bold text-xl">
                Enter Quantity
              </h3>

              <p className="mt-3 text-gray-600">
                Farmers submit available maize bags.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <div className="text-4xl">🤝</div>

              <h3 className="mt-4 font-bold text-xl">
                Lock Buyer
              </h3>

              <p className="mt-3 text-gray-600">
                SmartShamba matches verified buyers instantly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow">
              <div className="text-4xl">💰</div>

              <h3 className="mt-4 font-bold text-xl">
                Receive Payment
              </h3>

              <p className="mt-3 text-gray-600">
                M-PESA settlement happens after delivery confirmation.
              </p>
            </div>
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
            It is a transaction trust system designed to reduce
            post-harvest exploitation and restore farmer negotiating power.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div>
              <h3 className="text-4xl font-bold">2,450+</h3>
              <p className="mt-2 text-green-100">
                Farmers onboarded
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold">KES 14.2M</h3>
              <p className="mt-2 text-green-100">
                Trade volume
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold">96%</h3>
              <p className="mt-2 text-green-100">
                Successful settlements
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}