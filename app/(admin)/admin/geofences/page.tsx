'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import type { Map as MaplibreMap, MapMouseEvent } from 'maplibre-gl';

export default function GeofencesPage() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number[][]>([]);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MaplibreMap | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    import('maplibre-gl').then((maplibregl) => {
      if (!map.current && mapContainer.current) {
        map.current = new maplibregl.Map({
          container: mapContainer.current, 
          style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
          center: [35.2698, 0.5143],
          zoom: 8
        });
        
        map.current.on('load', () => setLoading(false));
        map.current.on('click', (e: MapMouseEvent) => {
          setPoints(prev => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
        });
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">GIS Geofencing</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-[#00703C]" /> Draw New Zone</h2>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            <p>Click on the map to add points.</p>
            <p className="font-medium mt-1">{points.length} points added.</p>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border p-2 shadow-sm h-125 relative">
          {loading && <div className="absolute inset-0 flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}
          <div ref={mapContainer} className="w-full h-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
