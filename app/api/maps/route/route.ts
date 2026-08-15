import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startLat = searchParams.get('startLat');
  const startLng = searchParams.get('startLng');
  const endLat = searchParams.get('endLat');
  const endLng = searchParams.get('endLng');

  if (!startLat || !startLng || !endLat || !endLng) {
    return NextResponse.json({ error: 'Start and End coordinates are required' }, { status: 400 });
  }

  try {
    // OSRM expects coordinates as lng,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes.length > 0) {
      return NextResponse.json({
        geometry: data.routes[0].geometry, // GeoJSON LineString
        distance_km: (data.routes[0].distance / 1000).toFixed(2),
        duration_min: Math.ceil(data.routes[0].duration / 60)
      });
    } else {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('[API] Routing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
