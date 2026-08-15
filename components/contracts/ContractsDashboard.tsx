'use client';
import { useEffect, useState } from 'react';
import { Loader2, FileText, CheckCircle, Clock, AlertTriangle, XCircle, Download } from 'lucide-react';

interface Transaction {
  id: string;
  reference: string;
  quantityBags: number;
  totalValue: number;
}

interface GroupTx {
  id: string;
  reference: string;
  totalBags: number;
  totalValue: number;
}

interface Contract {
  id: string;
  status: string;
  version: number;
  farmerSigned: boolean;
  buyerSigned: boolean;
  expiresAt: string | null;
  createdAt: string;
  transaction: Transaction | null;
  groupTx: GroupTx | null;
}

export default function ContractsDashboard({ role }: { role: 'FARMER' | 'BUYER' }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    const endpoint = role === 'FARMER' ? '/api/farmers/me/contracts' : '/api/buyers/me/contracts';
    fetch(endpoint)
      .then(res => res.ok ? res.json() : [])
      .then(setContracts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [role]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  const filtered = filter === 'ALL' ? contracts : contracts.filter(c => c.status === filter);

  const statusIcons: Record<string, React.ReactNode> = {
    EXECUTED: <CheckCircle className="w-4 h-4 text-green-500" />,
    DRAFT: <Clock className="w-4 h-4 text-yellow-500" />,
    DISPUTED: <AlertTriangle className="w-4 h-4 text-red-500" />,
    VOIDED: <XCircle className="w-4 h-4 text-gray-400" />
  };

  const filters = ['ALL', 'DRAFT', 'EXECUTED', 'DISPUTED', 'VOIDED'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-[#00703C] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f === 'ALL' ? 'All Contracts' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No Contracts Found</h3>
            <p className="text-sm text-gray-500 mt-1">Your digital contracts will appear here once transactions are created.</p>
          </div>
        ) : (
          filtered.map(c => {
            const tx = c.transaction || c.groupTx;
            const txRef = tx?.reference || 'N/A';
            const txBags = c.transaction?.quantityBags || c.groupTx?.totalBags || 0;
            const txValue = tx?.totalValue || 0;
            
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcons[c.status]}
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{c.status}</p>
                      {c.version > 1 && <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">v{c.version}</span>}
                    </div>
                    <p className="font-bold text-gray-900 text-lg">{txRef.substring(0, 12)}</p>
                    <p className="text-sm text-gray-500">{txBags} bags • KSh {txValue.toLocaleString()}</p>
                  </div>
                  <div className="text-right mt-2 md:mt-0">
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm text-gray-900">{new Date(c.createdAt).toLocaleDateString('en-KE')}</p>
                    {c.expiresAt && (<p className="text-xs text-red-500 mt-1">Expires: {new Date(c.expiresAt).toLocaleDateString('en-KE')}</p>)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`p-3 rounded-lg border-2 ${c.farmerSigned ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <p className="text-xs font-bold uppercase text-gray-500 mb-1">Farmer</p>
                    {c.farmerSigned ? (<p className="text-sm text-green-700 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Signed</p>) : (<p className="text-sm text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</p>)}
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${c.buyerSigned ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <p className="text-xs font-bold uppercase text-gray-500 mb-1">Buyer</p>
                    {c.buyerSigned ? (<p className="text-sm text-green-700 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Signed</p>) : (<p className="text-sm text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</p>)}
                  </div>
                </div>

                {c.status === 'EXECUTED' && tx && (
                  <div className="pt-4 border-t border-gray-100">
                    <a href={`/api/transactions/${tx.id}/contract/pdf`} target="_blank" className="inline-flex items-center gap-2 text-sm font-semibold text-[#00703C] hover:underline">
                      <Download className="w-4 h-4" /> Download Contract PDF
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
