const transactions = [
  {
    id: "SHB-20481",
    buyer: "Kitale Millers Ltd",
    amount: "KES 210,000",
    status: "Completed",
    date: "12 May 2026",
  },
  {
    id: "SHB-19872",
    buyer: "Eldoret Grain Buyers",
    amount: "KES 168,000",
    status: "Pending Delivery",
    date: "10 May 2026",
  },
];

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-green-800 mb-8">
        Farmer Transactions
      </h1>

      <div className="grid gap-6">
        {transactions.map((tx, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow border"
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
              <h2 className="text-xl font-semibold">{tx.id}</h2>

              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  tx.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {tx.status}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>Buyer: {tx.buyer}</p>
              <p>Amount: {tx.amount}</p>
              <p>Date: {tx.date}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}