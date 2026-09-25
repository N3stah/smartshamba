export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ListingForm from '@/components/ListingForm';
import { Card } from '@/components/ui/Card';

export default async function FarmerListings() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  const farmer = await prisma.farmer.findUnique({ where: { phone }, include: {ProduceListing: true } });
  if (!farmer) redirect('/dashboard/login');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">Sell Produce</h1>
        <p className="text-gray-500">Create a listing for your available maize harvest.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-text mb-4">Create New Listing</h2>
          <ListingForm />
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-text mb-4">Active Listings</h2>
          {farmer.ProduceListing.length === 0 ? (
            <p className="text-gray-400 text-sm">No active listings.</p>
          ) : (
            <div className="space-y-3">
              {farmer.ProduceListing.map(l => (
                <div key={l.id} className="border border-border p-3 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium text-text">{l.product}</p>
                    <p className="text-xs text-gray-500">{l.quantityBags} bags @ KSh {l.pricePerBag}</p>
                  </div>
                  <span className="text-xs font-bold text-farmer-primary bg-farmer-secondary px-2 py-1 rounded-md border border-farmer-primary/20">{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
