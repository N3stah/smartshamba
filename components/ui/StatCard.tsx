interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, sub, highlight = false }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-6 bg-white shadow-sm ${highlight ? 'border-green-300' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${highlight ? 'text-green-700' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
