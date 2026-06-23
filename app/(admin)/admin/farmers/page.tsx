interface Farmer {
  id: string;
  phone: string;
  name: string | null;
  location: string | null;
  createdAt: string;
}

async function getFarmers(): Promise<Farmer[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/farmers`, {
    cache: 'no-store',
    headers: { 'x-admin-key': process.env.ADMIN_API_KEY ?? '' },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function FarmersPage() {
  const farmers = await getFarmers();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Farmers</h1>
        <p className="text-gray-500 text-sm mt-1">{farmers.length} registered farmers</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Farmer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {farmers.map((farmer) => (
              <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {farmer.name ?? <span className="text-gray-400 italic">No name</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{farmer.phone}</td>
                <td className="px-4 py-3 text-gray-600">{farmer.location ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(farmer.createdAt).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {farmers.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No farmers registered yet.</div>
        )}
      </div>
    </div>
  );
}
