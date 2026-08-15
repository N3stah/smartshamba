'use client';
import { useState } from 'react';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import MapSearch from './MapSearch';

export default function LocationSetter({ hasLocation }: { hasLocation: boolean }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const setLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('idle');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch('/api/farmers/me/location', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude })
          });
          
          if (res.ok) {
            setStatus('success');
            setMessage('Farm location updated successfully!');
          } else {
            throw new Error('Failed to save location');
          }
        } catch (err) {
          setStatus('error');
          setMessage('Failed to save location. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setStatus('error');
        setMessage(`Location access denied: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePlaceSelected = async (lat: number, lng: number) => {
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/farmers/me/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      if (res.ok) {
        setStatus('success');
        setMessage('Farm location updated successfully via Google Search!');
      } else {
        throw new Error('Failed to save location');
      }
    } catch (e) {
      setStatus('error');
      setMessage('Failed to save location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-[#00703C]" />
        <h3 className="font-bold text-gray-900">Farm Location (GIS)</h3>
      </div>
      
      <MapSearch onPlaceSelected={handlePlaceSelected} />

      {status === 'success' ? (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm">{message}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {hasLocation 
              ? 'Your farm location is set. Buyers can find you on the map.' 
              : 'Set your exact farm location so buyers can find you on the map.'}
          </p>
          {status === 'error' && <p className="text-red-500 text-sm mb-2">{message}</p>}
          <button 
            onClick={setLocation}
            disabled={loading}
            className="bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00582f] disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {hasLocation ? 'Update My GPS Location' : 'Use My Current GPS'}
          </button>
        </>
      )}
    </div>
  );
}
