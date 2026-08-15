'use client';
import { useEffect, useRef } from 'react';
import type { GeoJSON } from 'geojson';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MarkerData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  type?: 'FARMER' | 'BUYER' | 'WAREHOUSE';
}

interface MapViewProps {
  markers?: MarkerData[];
  center: [number, number];
  zoom?: number;
  routeGeometry?: GeoJSON.Geometry;
}

export default function MapView({ markers = [], center, zoom = 7, routeGeometry }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [{
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles'
        }]
      },
      center: [center[1], center[0]],
      zoom: zoom
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      map.current.addSource('markers', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: markers.map(m => ({
            type: 'Feature',
            properties: { ...m },
            geometry: { type: 'Point', coordinates: [m.longitude, m.latitude] }
          }))
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'markers',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#00703C',
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
          'circle-opacity': 0.8
        }
      });

      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'markers',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12
        },
        paint: {
          'text-color': '#FFFFFF'
        }
      });

      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'markers',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['match', ['get', 'type'], 'FARMER', '#10b981', 'BUYER', '#3b82f6', '#6b7280'],
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      map.current.on('click', 'unclustered-point', (e) => {
        if (!map.current || !e.features || e.features.length === 0) return;
        const geometry = e.features[0].geometry;
        if (geometry.type !== 'Point') return;
        const coordinates = geometry.coordinates.slice() as [number, number];
        const props = e.features[0].properties as MarkerData;
        
        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<div style="padding:4px"><p style="font-weight:bold;margin:0">${props.name}</p><p style="font-size:12px;color:#666;margin:0">${props.type}</p></div>`)
          .addTo(map.current);
      });

      if (routeGeometry) {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: routeGeometry
          }
        });

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#00703C', 'line-width': 5, 'line-opacity': 0.8 
          }
        });

        if (routeGeometry.type === 'LineString') {
          const coordinates = routeGeometry.coordinates as [number, number][];
          const bounds = coordinates.reduce((b, coord) => b.extend(coord), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
          map.current.fitBounds(bounds, { padding: 50 });
        }
      }
    });
  }, [markers, center, zoom, routeGeometry]);

  return <div ref={mapContainer} className="h-125 w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0" />;
}
