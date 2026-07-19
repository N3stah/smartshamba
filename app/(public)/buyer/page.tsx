interface BuyerWithRating {
  id: string;
  name: string;
  location: string;
  verified: boolean;
  pricePerBag: number;
  capacityBags: number;
  active: boolean;
  averageScore: number | null;
  totalRatings: number;
}

async function getBuyers(): Promise<BuyerWithRating[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/buyers`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch buyers');
  return res.json();
}

function StarRating({ score, total }: { score: number | null; total: number }) {
  if (!score || total === 0) {
    return <span className="text-xs text-gray-400">No ratings yet</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map((s) => (
          <span key={s} className={`text-base ${s <= Math.round(score) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {score.toFixed(1)} ({total} {total === 1 ? 'rating' : 'ratings'})
      </span>
    </div>
  );
}

export default async function BuyerPage() {
  const buyers = await getBuyers();

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-3 text-green-800">Verified Buyers</h1>
        <p className="text-gray-600 mb-8">
          Buyers verified through the SmartShamba pilot. Ratings submitted by farmers after settled transactions.
        </p>

        <div className="grid gap-6">
          {buyers.map((buyer) => (
            <div key={buyer.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{buyer.name}</h2>
                  {buyer.verified && (
                    <div className="mt-2">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Verified Buyer</span>
                    </div>
                  )}
                  <div className="mt-2">
                    <StarRating score={buyer.averageScore} total={buyer.totalRatings} />
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-gray-700">
                <p>📍 Location: {buyer.location}</p>
                <p>💰 Offer Price: KSh {buyer.pricePerBag.toLocaleString()}/bag</p>
                <p>🌽 Demand: {buyer.capacityBags.toLocaleString()} bags</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
