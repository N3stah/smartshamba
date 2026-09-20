'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin } from 'lucide-react';

interface GoogleMap {
  setCenter: (pos: object) => void;
  setZoom: (n: number) => void;
  addListener: (event: string, cb: (e: { latLng: { lat: () => number; lng: () => number } }) => void) => void;
}
interface GooglePolygon {
  setPath: (path: object[]) => void;
  setMap: (map: GoogleMap | null) => void;
}
interface GoogleMaps {
  Map: new (el: HTMLElement, opts: object) => GoogleMap;
  Polygon: new (opts: object) => GooglePolygon;
}

// Define a specific interface for the window properties we use
interface GeofenceWindow {
  google?: { maps: GoogleMaps };
  initGeofenceMap?: () => void;
}

export default function GeofencesPage() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const polygonRef = useRef<GooglePolygon | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Cast window to our specific interface
    const w = window as unknown as GeofenceWindow;
    
    const loadMap = () => {
      if (!w.google || !w.google.maps) {
        setTimeout(loadMap, 100);
        return;
      }

      if (!mapContainer.current) return;
      mapRef.current = new w.google.maps.Map(mapContainer.current, {
        center: { lat: 0.5143, lng: 35.2698 },
        zoom: 9,
      });

      if (mapRef.current) {
        mapRef.current.addListener('click', (e: { latLng: { lat: () => number; lng: () => number } }) => {
          const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          setPoints(prev => [...prev, newPoint]);
        });
      }

      setLoading(false);
    };

    if (w.google && w.google.maps) {
      loadMap();
    } else {
      w.initGeofenceMap = loadMap;
      if (!document.getElementById('google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initGeofenceMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      w.initGeofenceMap = undefined;
    };
  }, []);

  useEffect(() => {
    const w = window as unknown as GeofenceWindow;
    if (!w.google || !w.google.maps || !mapRef.current || points.length === 0) return;

    if (polygonRef.current) {
      polygonRef.current.setPath(points);
    } else if (points.length > 1) {
      polygonRef.current = new w.google.maps.Polygon({
        path: points,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
      });
      if (polygonRef.current) {
        polygonRef.current.setMap(mapRef.current);
      }
    }
  }, [points]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">GIS Geofencing</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2 text-gray-900"><MapPin className="w-5 h-5 text-[#00703C]" /> Draw New Zone</h2>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 font-medium">
            <p>Click on the map to add points.</p>
            <p className="mt-1">{points.length} points added.</p>
          </div>
          {points.length > 2 && (
            <button 
              onClick={() => {
                console.log('Saving geofence:', points);
              }}
              className="w-full bg-[#00703C] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#00582f]"
            >
              Save Geofence
            </button>
          )}
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border p-2 shadow-sm h-125 relative">
          {loading && <div className="absolute inset-0 flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>}
          <div ref={mapContainer} className="w-full h-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
