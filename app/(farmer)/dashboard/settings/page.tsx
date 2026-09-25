export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PasswordSetter from '@/components/PasswordSetter';
import { Card } from '@/components/ui/Card';

export default async function FarmerSettings() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  const farmer = await prisma.farmer.findUnique({ where: { phone } });
  if (!farmer) redirect('/dashboard/login');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
      </div>
      
      <Card className="p-6">
        <h2 className="text-lg font-bold text-text mb-4">Verified Registration Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Full Name</p>
            <p className="font-medium text-text">{farmer.name ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Phone Number</p>
            <p className="font-medium text-text font-mono">{farmer.phone}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">National ID</p>
            <p className="font-medium text-text font-mono">{farmer.nationalId ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Location</p>
            <p className="font-medium text-text">{farmer.location ?? 'N/A'}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-6 pt-4 border-t border-border">These details are locked and verified. Contact admin if changes are needed.</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-text mb-4">Security</h2>
        <PasswordSetter role="FARMER" hasPassword={!!farmer.password} />
      </Card>
    </div>
  );
}
