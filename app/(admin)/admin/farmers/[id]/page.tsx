import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import EditFarmerForm from '@/components/admin/EditFarmerForm';
import StatusBadge from '@/components/ui/StatusBadge';
import { ArrowLeft, ShieldCheck, MapPin, Phone, User, Globe, Calendar } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminFarmerDetailPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('smartshamba_admin')?.value === process.env.ADMIN_API_KEY;
  if (!isAdmin) redirect('/admin/login');

  const { id } = await params;

  const farmer = await prisma.farmer.findUnique({
    where: { id },
    include: {
      county: { select: { name: true } },
      ward: { select: { name: true } },
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { buyer: { select: { name: true } } },
      },
    },
  });

  if (!farmer) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Farmer Not Found</h1>
        <Link href="/admin/farmers" className="text-[#00703C] hover:underline">← Back to Farmers</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Farmer Profile</h1>
        <Link href="/admin/farmers" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Summary & Edit Form */}
        <div className="lg:col-span-1 space-y-8">
          {/* Profile Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-[#00703C]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{farmer.name ?? 'Unknown'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {farmer.verified ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Unverified</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {farmer.phone}</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {farmer.village ?? farmer.location ?? 'N/A'}</p>
              <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" /> {farmer.language.toUpperCase()}</p>
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Joined: {new Date(farmer.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Secure Edit Form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Edit Locked Details</h3>
            <p className="text-xs text-gray-500 mb-6">Admins can securely correct registration details here. All changes are audit logged.</p>
            <EditFarmerForm 
              farmerId={farmer.id}
              initialName={farmer.name}
              initialPhone={farmer.phone}
              initialNationalId={farmer.nationalId}
            />
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Reference</th>
                    <th className="p-4 font-semibold text-gray-600">Buyer</th>
                    <th className="p-4 font-semibold text-gray-600">Bags</th>
                    <th className="p-4 font-semibold text-gray-600">Value</th>
                    <th className="p-4 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {farmer.transactions.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No transactions found.</td></tr>
                  ) : (
                    farmer.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="p-4 font-mono text-xs text-gray-700">{tx.reference}</td>
                        <td className="p-4 font-medium text-gray-900">{tx.buyer.name}</td>
                        <td className="p-4 text-gray-600">{tx.quantityBags}</td>
                        <td className="p-4 text-gray-900 font-medium">KSh {tx.totalValue.toLocaleString()}</td>
                        <td className="p-4"><StatusBadge status={tx.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
