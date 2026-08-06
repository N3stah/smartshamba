'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function ContractVerificationPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contracts/verify/${params.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#00703C]" /></div>;
  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <XCircle className="w-12 h-12 text-red-500 mb-4" />
      <h1 className="text-xl font-bold text-gray-900">Invalid Contract</h1>
      <p className="text-gray-500 mt-1">This contract verification link is invalid or does not exist.</p>
    </div>
  );

  const terms = data.terms || {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#00703C] to-[#004d29] p-6 text-white text-center">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">SmartShamba Contract</h1>
          <p className="text-sm text-green-100">Authenticity Verified</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data.farmerSigned ? 'bg-green-100' : 'bg-gray-100'}`}>
                {data.farmerSigned ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-gray-400" />}
              </div>
              <p className="text-xs mt-2 font-semibold">Farmer</p>
            </div>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data.buyerSigned ? 'bg-green-100' : 'bg-gray-100'}`}>
                {data.buyerSigned ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-gray-400" />}
              </div>
              <p className="text-xs mt-2 font-semibold">Buyer</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Status:</span> <span className="font-bold text-gray-900">{data.status}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Contract ID:</span> <span className="font-mono text-xs text-gray-900">{data.id.substring(0, 12)}...</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Crop:</span> <span className="font-bold text-gray-900">{terms.crop || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Quantity:</span> <span className="font-bold text-gray-900">{terms.quantityBags} bags</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Value:</span> <span className="font-bold text-gray-900">KSh {terms.totalValue?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Created:</span> <span className="text-gray-900">{new Date(data.createdAt).toLocaleDateString('en-KE')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
