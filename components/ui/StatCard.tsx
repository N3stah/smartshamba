interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, sub, highlight = false }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-6 bg-white shadow-sm transition-shadow hover:shadow-md ${highlight ? 'border-green-300' : 'border-slate-200/80'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold tracking-tight ${highlight ? 'text-green-700' : 'text-slate-900'}`}>
        {value}
      </p>
      {sub && (
        <span className={`mt-2 inline-block px-2 py-0.5 text-xs rounded-full ${highlight ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {sub}
        </span>
      )}
    </div>
  );
}
