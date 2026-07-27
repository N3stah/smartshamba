'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

const ranges = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '1 Year', value: '1y' },
];

export default function DateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get('range') || '30d';

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
      <Calendar className="w-4 h-4 text-gray-400 ml-2" />
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => handleRangeChange(r.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentRange === r.value ? 'bg-[#00703C] text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
