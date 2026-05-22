const marketPrices = [
  {
    town: "Kitale",
    price: "KSh 4,200",
    demand: "High",
    trend: "↑ Rising",
  },
  {
    town: "Eldoret (Reference Market)",
    price: "KSh 4,050",
    demand: "Medium",
    trend: "→ Stable",
  },
  {
    town: "Kiminini",
    price: "KSh 3,980",
    demand: "Growing",
    trend: "↑ Rising",
  },
];

export default function MarketPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-green-800">
          Indicative Buyer Offers
        </h1>

        <p className="text-gray-600 mt-3">
          Pilot coordination activity focused on Trans Nzoia County, Kenya.
        </p>

        <p className="text-sm text-gray-500 mt-2">
          Illustrative buyer offers for pilot demonstration purposes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {marketPrices.map((market, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-green-100 p-6"
            >
              <h2 className="text-2xl font-bold text-green-700">
                {market.town}
              </h2>

              <p className="mt-4 text-3xl font-bold">
                {market.price}
              </p>

              <p className="mt-3 text-gray-600">
                Demand: {market.demand}
              </p>

              <p className="mt-1 text-green-700 font-medium">
                {market.trend}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}