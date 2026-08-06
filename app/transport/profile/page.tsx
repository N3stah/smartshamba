'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Truck, Phone, MapPin, Calendar, DollarSign, Package, CheckCircle, Star } from 'lucide-react';
import PasswordSetter from '@/components/PasswordSetter';

export default function TransportProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/transport/profile')
      .then(res => { if (res.status === 401) router.push('/transport/login'); return res.json(); })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-[#00703C]" /></div>;
  if (!data) return null;

  const { provider, stats } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#00703C] to-[#004d29] p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{provider.name}</h2>
              <p className="text-sm text-green-100">{provider.vehicleType} • {provider.capacityKg}kg capacity</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{provider.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{provider.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">KSh {provider.ratePerKm}/km</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Joined {new Date(provider.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <Package className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
          <p className="text-xs text-gray-500">Total Jobs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <Truck className="w-6 h-6 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.activeDeliveries}</p>
          <p className="text-xs text-gray-500">Active Jobs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.completedDeliveries}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-green-300 p-5 shadow-sm">
          <DollarSign className="w-6 h-6 text-[#00703C] mb-2" />
          <p className="text-2xl font-bold text-green-700">KSh {stats.totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Earnings</p>
        </div>
      </div>

      {/* Security / Password Setter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Security</h3>
        <PasswordSetter role="TRANSPORT" hasPassword={!!provider.password} />
      </div>
    </div>
  );
}
