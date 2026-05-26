const buyerOffers = [
  {
    buyer: "Kitale Millers Ltd",
    price: "KSh 4,200",
    demand: "500 bags",
  },
  {
    buyer: "Eldoret Grain Buyers",
    price: "KSh 4,050",
    demand: "300 bags",
  },
  {
    buyer: "Kitale Co-op",
    price: "KSh 3,980",
    demand: "220 bags",
  },
];

const transactions = [
  {
    id: "SS-2026-004821",
    farmer: "KIP-001",
    amount: "KSh 168,000",
    status: "Completed",
  },
  {
    id: "SS-2026-004799",
    farmer: "KIP-002",
    amount: "KSh 101,250",
    status: "Awaiting M-PESA Confirmation",
  },
  {
    id: "SS-2026-004755",
    farmer: "KIP-003",
    amount: "KSh 71,640",
    status: "Completed",
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#f6faf6] text-gray-900">

      {/* HERO */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-5xl mx-auto">

          <p className="uppercase tracking-[0.3em] text-sm text-green-700 font-semibold">
            SmartShamba Pilot Demo · Trans Nzoia County · 2026
          </p>

          <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-tight text-green-900">
            Farmers Should Know Their Buyer
            Before Transporting Their Harvest
          </h1>

          <p className="mt-8 text-xl md:text-2xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
            SmartShamba helps maize farmers pre-confirm buyer offers before transport
            using a simple USSD coordination workflow and M-PESA settlement process.
          </p>

        </div>
      </section>

      {/* USSD FLOW */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-4xl font-bold text-green-900 text-center">
            USSD Coordination Flow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-14">

            {[
              "Dial *123#",
              "Enter Quantity",
              "View Buyer Offers",
              "Confirm Offer",
              "Receive M-PESA Payment",
            ].map((step, index) => (
              <div
                key={index}
                className="bg-white border border-green-100 rounded-3xl p-6 shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>

                <h3 className="mt-6 text-xl font-bold text-green-800">
                  {step}
                </h3>

                <p className="mt-4 text-gray-600 text-sm leading-relaxed">
                  SmartShamba coordinates farmer-buyer communication before transport begins.
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* VERIFIED BUYERS */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-4xl font-bold text-green-900 text-center">
            Verified Buyer Offers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">

            {buyerOffers.map((buyer, index) => (
              <div
                key={index}
                className="rounded-3xl border border-green-100 bg-[#f8fcf8] p-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-green-800">
                    {buyer.buyer}
                  </h3>

                  <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                    Verified
                  </span>
                </div>

                <div className="mt-8 space-y-3 text-gray-700">
                  <p>
                    <strong>Offer Price:</strong> {buyer.price}
                  </p>

                  <p>
                    <strong>Demand:</strong> {buyer.demand}
                  </p>

                  <p>
                    <strong>Status:</strong> Buyer capacity confirmed
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* TRANSACTION HISTORY */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">

          <h2 className="text-4xl font-bold text-green-900 text-center">
            Pilot Transaction Activity
          </h2>

          <div className="space-y-5 mt-14">

            {transactions.map((tx, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl border border-green-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-green-800">
                    {tx.id}
                  </h3>

                  <p className="text-gray-600 text-sm mt-1">
                    Farmer: {tx.farmer}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">
                    {tx.amount}
                  </p>
                </div>

                <div>
                  <span className="bg-green-100 text-green-700 text-sm px-4 py-2 rounded-full">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="px-6 py-24 bg-green-900 text-white text-center">
        <div className="max-w-4xl mx-auto">

          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            SmartShamba reduces transaction uncertainty.
          </h2>

          <p className="mt-8 text-2xl text-green-100 leading-relaxed">
            A farmer should not discover the real price
            after the truck is loaded.
          </p>

        </div>
      </section>

    </main>
  );
}