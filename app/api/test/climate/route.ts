import { NextResponse } from 'next/server';
import { getHyperLocalForecast } from '@/lib/ai/climate-service';

// Temporary route to test NVIDIA Earth-2 integration
export async function GET() {
  try {
    // Coordinates for Kitale, Trans Nzoia (Farming Hub)
    const lat = 1.0167;
    const lon = 34.9833;
    
    console.log('[TEST] Fetching hyper-local forecast from NVIDIA Earth-2...');
    const forecast = await getHyperLocalForecast(lat, lon);
    
    if (!forecast) {
      return NextResponse.json({ error: 'Failed to get forecast from NVIDIA API' }, { status: 500 });
    }

    return NextResponse.json({
      location: 'Kitale, Trans Nzoia',
      coordinates: { lat, lon },
      forecast,
      note: "If resolution is '9km (FourCastNet)', CorrDiff may have failed or fallen back. If '1km (CorrDiff)', both models succeeded!"
    });
  } catch (error) {
    console.error('[TEST] Climate API error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
