import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PasswordSetter from '@/components/PasswordSetter';
export const dynamic = 'force-dynamic';

export default async function BuyerSettings() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ where: { phone } });
  if (!buyer) redirect('/buyer/login');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Verified Registration Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Business Name</p><p className="font-medium text-gray-900">{buyer.name}</p></div>
          <div><p className="text-gray-500">Phone Number</p><p className="font-medium text-gray-900">{buyer.phone ?? 'N/A'}</p></div>
          <div><p className="text-gray-500">Location</p><p className="font-medium text-gray-900">{buyer.location}</p></div>
        </div>
        <p className="text-xs text-gray-400 mt-4">These details are locked and verified. Contact admin if changes are needed.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Security</h2>
        <PasswordSetter role="BUYER" hasPassword={!!buyer.password} />
      </div>
    </div>
  );
}
