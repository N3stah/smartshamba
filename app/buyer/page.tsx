const buyers = [
  {
    name: "Kitale Millers Ltd",
    price: "KES 4,200",
    quantity: "500 bags",
    location: "Kitale",
    verified: true,
  },
  {
    name: "Eldoret Grain Buyers",
    price: "KES 4,050",
    quantity: "300 bags",
    location: "Eldoret",
    verified: true,
  },
];

export default function BuyerPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-green-800">
        Verified Buyers
      </h1>

      <div className="grid gap-6">
        {buyers.map((buyer, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
              <h2 className="text-2xl font-semibold">{buyer.name}</h2>

              {buyer.verified && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  Verified Buyer
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>📍 Location: {buyer.location}</p>
              <p>💰 Offer Price: {buyer.price} per bag</p>
              <p>🌽 Demand: {buyer.quantity}</p>
            </div>

            <button className="mt-6 bg-green-700 hover:bg-green-800 text-white px-5 py-3 rounded-xl transition">
              Lock Buyer
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}