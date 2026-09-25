import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import VerifyButton from '@/components/admin/VerifyButton';

export const dynamic = 'force-dynamic';

export default async function FarmersPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const farmers = await prisma.farmer.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Farmers</h1>
        <a href="/api/admin/export/farmers" className="bg-admin-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-admin-primary/90 flex items-center gap-2">Export to CSV</a>
      </div>

      <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Farmer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {farmers.map((farmer) => (
              <tr key={farmer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <Link href={`/admin/farmers/${farmer.id}`} className="text-admin-primary hover:underline">
                    {farmer.name ?? <span className="text-gray-400 italic">No name</span>}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{farmer.phone}</td>
                <td className="px-4 py-3 text-gray-600">{farmer.location ?? '—'}</td>
                <td className="px-4 py-3">
                  {farmer.verified ? (
                    <span className="bg-admin-secondary text-admin-primary text-xs px-2 py-1 rounded-full font-medium">Verified</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">Unverified</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <VerifyButton farmerId={farmer.id} isVerified={farmer.verified} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {farmers.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No farmers registered yet.</div>}
      </div>
    </div>
  );
}
