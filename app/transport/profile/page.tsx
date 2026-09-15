export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Truck, Phone, MapPin, Wallet, CheckCircle } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="bg-[#00703C] text-white rounded-xl shadow-sm p-6 flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-full">
          <Truck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{provider.name}</h1>
          <p className="text-sm text-green-100">{provider.contactPerson || 'Transport Provider'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[#00703C] mb-2">
            <Wallet className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase text-gray-500">Wallet Balance</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">KSh {provider.wallet?.balance.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Available for withdrawal</p>
        </div>
        
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <CheckCircle className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase text-gray-500">Completed Jobs</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{completedJobs}</p>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Truck className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase text-gray-500">Total Vehicles</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{provider.vehicles.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Provider Details</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {provider.phone}</p>
          <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {provider.baseLocation || 'Location N/A'}</p>
          <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Status: {provider.verificationStatus}</p>
        </div>
      </div>
    </div>
  );
}
