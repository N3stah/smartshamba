const marketPrices = [
  {
    town: "Kitale",
    price: "KES 4,200",
    demand: "High",
    trend: "↑ Rising",
    updated: "10 mins ago",
  },
  {
    town: "Eldoret",
    price: "KES 4,050",
    demand: "Medium",
    trend: "→ Stable",
    updated: "25 mins ago",
  },
  {
    town: "Nakuru",
    price: "KES 3,980",
    demand: "Low",
    trend: "↓ Falling",
    updated: "40 mins ago",
  },
];

export default function MarketPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-green-800 mb-3">
        Live Market Prices
      </h1>

      <p className="text-gray-600 mb-8 max-w-2xl">
        SmartShamba tracks verified maize buyer prices across regions
        to help farmers avoid broker manipulation and sell at fair value.
      </p>

      <div className="grid gap-6">
        {marketPrices.map((market, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                {market.town}
              </h2>

              <span className="text-sm text-gray-500">
                Updated {market.updated}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-500 text-sm">
                  Market Price
                </p>

                <p className="text-2xl font-bold text-green-700">
                  {market.price}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">
                  Buyer Demand
                </p>

                <p className="text-lg font-semibold">
                  {market.demand}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">
                  Trend
                </p>

                <p className="text-lg font-semibold">
                  {market.trend}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}