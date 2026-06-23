interface Buyer {
  id: string;
  name: string;
  location: string;
  verified: boolean;
  capacityBags: number;
  pricePerBag: number;
  active: boolean;
}

async function getBuyers(): Promise<Buyer[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/buyers`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function BuyersPage() {
  const buyers = await getBuyers();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyers</h1>
          <p className="text-gray-500 text-sm mt-1">{buyers.length} verified buyers</p>
        </div>
      </div>

      <div className="grid gap-4">
        {buyers.map((buyer) => (
          <div key={buyer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">{buyer.name}</h2>
                  {buyer.verified && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Verified
                    </span>
                  )}
                  {!buyer.active && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">📍 {buyer.location}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">KSh {buyer.pricePerBag.toLocaleString()}</p>
                <p className="text-xs text-gray-400">per bag</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 text-sm text-gray-500">
              <span>🌽 Capacity: <strong className="text-gray-900">{buyer.capacityBags.toLocaleString()} bags</strong></span>
              <span>ID: <span className="font-mono text-xs">{buyer.id.slice(0, 16)}...</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
