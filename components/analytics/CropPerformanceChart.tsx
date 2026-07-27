'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: any[];
  dataKey: string;
  color: string;
  name: string;
}

export default function CropPerformanceChart({ data, dataKey, color, name }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-[400px]">
      <h3 className="text-sm font-bold text-gray-700 mb-4">{name}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
