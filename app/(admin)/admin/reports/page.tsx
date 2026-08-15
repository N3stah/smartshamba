'use client';
import { useState } from 'react';
import { FileSpreadsheet, FileText, Filter } from 'lucide-react';

export default function CustomReportBuilder() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [county, setCounty] = useState('');
  const [crop, setCrop] = useState('');

  const buildUrl = (format: string) => {
    const params = new URLSearchParams({ format });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (county) params.append('county', county);
    if (crop) params.append('crop', crop);
    return `/api/admin/custom-report?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Custom Report Builder</h1>
      
      <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-500">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">County</label>
            <input value={county} onChange={e => setCounty(e.target.value)} placeholder="e.g. Uasin Gishu" className="w-full border rounded-lg p-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Crop</label>
            <input value={crop} onChange={e => setCrop(e.target.value)} placeholder="e.g. Maize" className="w-full border rounded-lg p-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href={buildUrl('excel')} target="_blank" className="bg-green-600 text-white rounded-xl p-6 shadow-sm flex items-center gap-4 hover:bg-green-700 transition-colors">
          <FileSpreadsheet className="w-10 h-10" />
          <div>
            <h3 className="font-bold text-lg">Export to Excel</h3>
            <p className="text-sm text-green-100">Download a formatted .xlsx spreadsheet</p>
          </div>
        </a>
        <a href={buildUrl('pdf')} target="_blank" className="bg-red-600 text-white rounded-xl p-6 shadow-sm flex items-center gap-4 hover:bg-red-700 transition-colors">
          <FileText className="w-10 h-10" />
          <div>
            <h3 className="font-bold text-lg">Export to PDF</h3>
            <p className="text-sm text-red-100">Download a printable document</p>
          </div>
        </a>
      </div>
    </div>
  );
}
