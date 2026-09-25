export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Truck, Phone, MapPin, Wallet, CheckCircle, Car } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default async function TransportProfilePage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_transport')?.value;
  if (!phone) redirect('/transport/login');

  const provider = await prisma.transportProvider.findUnique({
    where: { phone },
    include: {
      vehicles: true,
      wallet: true,
      _count: {
        select: { bookings: true }
      }
    }
  });

  if (!provider) redirect('/transport/login');

  const completedJobs = await prisma.transportBooking.count({
    where: { providerId: provider.id, status: 'COMPLETED' }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Provider Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Your operational details and performance metrics.</p>
      </div>

      <Card className="p-6 bg-transport-primary text-white border-transport-primary">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{provider.name}</h2>
            <p className="text-sm text-transport-secondary">{provider.contactPerson || 'Transport Provider'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-transport-primary mb-2">
            <Wallet className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Wallet Balance</h3>
          </div>
          <p className="text-2xl font-bold text-text">KSh {provider.wallet?.balance.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Available for withdrawal</p>
        </Card>
        
        <Card className="p-5">
          <div className="flex items-center gap-2 text-transport-route mb-2">
            <CheckCircle className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Completed Jobs</h3>
          </div>
          <p className="text-2xl font-bold text-text">{completedJobs}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Car className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Vehicles</h3>
          </div>
          <p className="text-2xl font-bold text-text">{provider.vehicles.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-text mb-4">Provider Details</h2>
        <div className="space-y-3 text-sm text-text">
          <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {provider.phone}</p>
          <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {provider.baseLocation || 'Location N/A'}</p>
          <p className="flex items-center gap-2"><CheckCircle className={`w-4 h-4 ${provider.verificationStatus === 'VERIFIED' ? 'text-green-500' : 'text-yellow-500'}`} /> Status: {provider.verificationStatus}</p>
        </div>
      </Card>
    </div>
  );
}
