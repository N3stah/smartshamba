'use client';
import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface MapSearchProps {
  onPlaceSelected: (lat: number, lng: number, address: string) => void;
}

export default function MapSearch({ onPlaceSelected }: MapSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/maps/geocode?address=' + encodeURIComponent(query));
      const data = await res.json();
      
      if (res.ok && data.latitude) {
        onPlaceSelected(data.latitude, data.longitude, data.address);
        setQuery('');
      } else {
        setError(data.error || 'Location not found.');
      }
    } catch (err) {
      setError('Failed to search location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full mb-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          required
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address, town, or landmark..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-[#00703C] focus:border-[#00703C] shadow-sm"
        />
        <button type="submit" disabled={loading} className="bg-[#00703C] text-white p-2 rounded-lg hover:bg-[#00582f] disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </form>
  );
}
