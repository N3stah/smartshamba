import { Buyer } from '@/types/buyer';

async function getBuyers(): Promise<Buyer[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/buyers`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch buyer offers');
  return res.json();
}

export default async function MarketPage() {
  const buyers = await getBuyers();

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-green-800">
          Current Buyer Offers
        </h1>
        <p className="text-gray-600 mt-3">
          Live buyer offers for Trans Nzoia County maize farmers.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Prices updated in real time from verified buyers.
        </p>

        {buyers.length === 0 ? (
          <div className="mt-10 bg-white rounded-2xl p-12 text-center text-gray-500 shadow-sm">
            No active buyer offers at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {buyers.map((buyer) => (
              <div
                key={buyer.id}
                className="bg-white rounded-2xl shadow-sm border border-green-100 p-6"
              >
                <h2 className="text-2xl font-bold text-green-700">
                  {buyer.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  📍 {buyer.location}
                </p>
                <p className="mt-4 text-3xl font-bold">
                  KSh {buyer.pricePerBag.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">per bag</p>
                <p className="mt-3 text-gray-600">
                  Capacity: {buyer.capacityBags.toLocaleString()} bags
                </p>
                {buyer.verified && (
                  <span className="mt-3 inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                    ✓ Verified Buyer
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
