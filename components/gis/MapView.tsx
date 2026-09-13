'use client';
import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MarkerData {
  id: string;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string;
  type?: 'FARMER' | 'BUYER' | 'WAREHOUSE';
}

interface MapViewProps {
  markers?: MarkerData[];
  center: [number, number];
  zoom?: number;
}

export default function MapView({ markers = [], center, zoom = 7 }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popupsRef = useRef<maplibregl.Popup[]>([]);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      center: [center[1], center[0]],
      zoom: zoom
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
  }, [center, zoom]);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || markers.length === 0) return;

    // Clear existing popups
    popupsRef.current.forEach(p => p.remove());
    popupsRef.current = [];

    markers.forEach((m) => {
      if (m.latitude == null || m.longitude == null) return;

      const color = m.type === 'FARMER' ? '#10b981' : m.type === 'BUYER' ? '#3b82f6' : '#6b7280';
      
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center rounded-full border-2 border-white shadow-lg cursor-pointer';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.backgroundColor = color;

      const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
        .setHTML(`<div style="padding:8px; font-family: sans-serif;"><p style="font-weight: bold; margin: 0 0 4px 0; font-size: 14px;">${m.name}</p><p style="margin: 0; font-size: 12px; color: #666;">${m.type || 'Location'}</p></div>`);

      new maplibregl.Marker(el)
        .setLngLat([m.longitude, m.latitude])
        .setPopup(popup)
        .addTo(map.current!);
        
      popupsRef.current.push(popup);
    });
  }, [markers]);

  return <div ref={mapContainer} className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0" />;
}
