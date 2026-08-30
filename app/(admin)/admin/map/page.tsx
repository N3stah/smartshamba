'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/gis/MapView'), { ssr: false });

export default function AdminMapPage() {
interface MapMarker {
  id: string;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: unknown;
}
  const [mapData, setMapData] = useState<{ farmers?: MapMarker[]; buyers?: MapMarker[]; warehouses?: MapMarker[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/map-data').then(r => r.json()),
      fetch('/api/admin/gis-analytics').then(r => r.json())
    ])
      .then(([md]) => {
        setMapData(md);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  const markers = [
    ...(mapData?.farmers || []).map((f: MapMarker) => ({ ...f, type: 'FARMER', description: 'Farmer' })),
    ...(mapData?.buyers || []).map((b: MapMarker) => ({ ...b, type: 'BUYER', description: 'Buyer' })),
    ...(mapData?.warehouses || []).map((w: MapMarker) => ({ ...w, type: 'WAREHOUSE', description: 'Warehouse' }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MapPin className="w-6 h-6 text-[#00703C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">National Operations Map</h1>
            <p className="text-sm text-gray-500">Geospatial intelligence & supply density</p>
          </div>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
  <MapView markers={markers as any} center={[0.1769, 37.9083]} zoom={6} />
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-700">{mapData?.farmers?.length || 0}</p>
            <p className="text-xs text-gray-500">Farmers Mapped</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{mapData?.buyers?.length || 0}</p>
            <p className="text-xs text-gray-500">Buyers Mapped</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-700">{mapData?.warehouses?.length || 0}</p>
            <p className="text-xs text-gray-500">Warehouses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
