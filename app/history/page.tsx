const transactions = [
  {
    id: "SS-2026-004821",
    farmer: "KIP-001",
    buyer: "Kitale Millers Ltd",
    bags: 40,
    amount: "KSh 168,000",
    status: "Completed",
    date: "20 May 2026",
  },
  {
    id: "SS-2026-004799",
    farmer: "KIP-002",
    buyer: "Eldoret Grain Buyers",
    bags: 25,
    amount: "KSh 101,250",
    status: "Awaiting M-PESA Confirmation",
    date: "19 May 2026",
  },
  {
    id: "SS-2026-004755",
    farmer: "KIP-003",
    buyer: "Kitale Co-op",
    bags: 18,
    amount: "KSh 71,640",
    status: "Completed",
    date: "17 May 2026",
  },
  {
    id: "SS-2026-004702",
    farmer: "KIP-004",
    buyer: "Kitale Millers Ltd",
    bags: 32,
    amount: "KSh 134,400",
    status: "Buyer Confirmed",
    date: "14 May 2026",
  },
  {
    id: "SS-2026-004661",
    farmer: "KIP-005",
    buyer: "Eldoret Grain Buyers",
    bags: 15,
    amount: "KSh 60,750",
    status: "Completed",
    date: "10 May 2026",
  },
  {
    id: "SS-2026-004603",
    farmer: "KIP-006",
    buyer: "Kitale Co-op",
    bags: 22,
    amount: "KSh 87,560",
    status: "Completed",
    date: "05 May 2026",
  },
];

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-green-800">
            Farmer Transactions
          </h1>

          <p className="mt-3 text-gray-600 max-w-2xl">
            Illustrative pilot transaction records for maize delivery coordination workflows in Trans Nzoia County.
          </p>
        </div>

        {/* Transactions */}
        <div className="grid gap-6">

          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm"
            >

              {/* Top Row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>
                  <h2 className="text-xl font-bold text-green-800">
                    {tx.id}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {tx.date}
                  </p>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium w-fit ${
                    tx.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : tx.status === "Awaiting M-PESA Confirmation"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {tx.status}
                </span>

              </div>

              {/* Transaction Details */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Farmer ID
                  </p>

                  <p className="font-semibold mt-1">
                    👨‍🌾 {tx.farmer}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Buyer
                  </p>

                  <p className="font-semibold mt-1">
                    🏢 {tx.buyer}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Quantity
                  </p>

                  <p className="font-semibold mt-1">
                    🌽 {tx.bags} bags
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Amount
                  </p>

                  <p className="font-semibold mt-1 text-green-700">
                    💰 {tx.amount}
                  </p>
                </div>

              </div>

            </div>
          ))}

        </div>
      </div>
    </main>
  );
}