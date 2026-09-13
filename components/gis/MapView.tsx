'use client';
import { useEffect, useRef } from 'react';

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

// Cast window to include google
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function MapView({ markers = [], center, zoom = 7 }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is missing');
      return;
    }

    // Create the script URL
    const googleMapScript = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;

    // Check if script is already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = googleMapScript;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapContainer.current || !window.google) return;
      const google = window.google;

      map.current = new google.maps.Map(mapContainer.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ]
      });

      // Add markers
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((m) => {
        if (m.latitude == null || m.longitude == null) return;

        const color = m.type === 'FARMER' ? '#10b981' : m.type === 'BUYER' ? '#3b82f6' : '#6b7280';
        
        if (m.latitude != null && m.longitude != null) {
          bounds.extend({ lat: m.latitude, lng: m.longitude });
        }
        const marker = new google.maps.Marker({
          position: { lat: m.latitude, lng: m.longitude },
          map: map.current,
          title: m.name || 'Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding:8px; font-family: sans-serif;"><p style="font-weight: bold; margin: 0 0 4px 0; font-size: 14px;">${m.name}</p><p style="margin: 0; font-size: 12px; color: #666;">${m.type || 'Location'}</p></div>`
        });

        marker.addListener('click', () => {
          infoWindow.open(map.current, marker);
        });
      });
      
      // Zoom to fit all markers if there are any
      if (markers.length > 0) {
        map.current.fitBounds(bounds);
      }
    }
  }, [markers, center, zoom]);

  return <div ref={mapContainer} className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0" />;
}
