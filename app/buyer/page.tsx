// app/buyer/page.tsx

import { Buyer } from "@prisma/client";

async function getBuyers(): Promise<Buyer[]> {
  // We must use an absolute URL on the server
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const res = await fetch(`${baseUrl}/api/buyers`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch verified buyers');
  }

  return res.json();
}

export default async function BuyerPage() {
  const buyers = await getBuyers();

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-5xl mx-auto">
        
        <h1 className="text-4xl font-bold mb-3 text-green-800">
          Verified Buyers
        </h1>

        <p className="text-gray-600 mb-8">
          Buyers manually verified through the SmartShamba pilot coordination workflow.
        </p>

        <div className="grid gap-6">
          {buyers.map((buyer) => (
            <div
              key={buyer.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                
                <div>
                  <h2 className="text-2xl font-semibold">
                    {buyer.name}
                  </h2>

                  {buyer.verified && (
                    <div className="mt-2">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        Verified Buyer
                      </span>

                      <p className="text-xs text-green-700 mt-1">
                        SmartShamba-verified · capacity confirmed
                      </p>
                    </div>
                  )}
                </div>

                <button className="bg-green-700 hover:bg-green-800 text-white px-5 py-3 rounded-xl transition">
                  Confirm Offer
                </button>
              </div>

              <div className="mt-6 space-y-2 text-gray-700">
                <p>📍 Location: {buyer.location}</p>

                <p>💰 Offer Price: KSh {buyer.pricePerBag.toLocaleString()}</p>

                <p>🌽 Demand: {buyer.capacityBags.toLocaleString()} bags</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}