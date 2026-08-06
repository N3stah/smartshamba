'use client';
import { useEffect, useState } from 'react';
import { Loader2, FileText, CheckCircle, PenLine, AlertCircle, Download, Clock } from 'lucide-react';

interface Contract {
  id: string;
  status: string;
  verificationId: string;
  farmerSigned: boolean;
  farmerSignedAt: string | null;
  farmerSignature: string | null;
  buyerSigned: boolean;
  buyerSignedAt: string | null;
  buyerSignature: string | null;
  terms: any;
  paymentTerms: string;
  transportTerms: string | null;
}

export default function ContractViewer({ transactionId, role }: { transactionId: string; role: 'FARMER' | 'BUYER' | 'ADMIN' }) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signName, setSignName] = useState('');
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/transactions/${transactionId}/contract`)
      .then(res => res.ok ? res.json() : null)
      .then(setContract)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [transactionId]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigning(true);
    setError('');
    try {
      const res = await fetch(`/api/transactions/${transactionId}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureName: signName })
      });
      const data = await res.json();
      if (res.ok) {
        setContract(data.contract);
        setSignName('');
      } else {
        throw new Error(data.error || 'Failed to sign');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  if (!contract) return null;

  const terms = contract.terms || {};

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
        <FileText className="w-5 h-5 text-[#00703C]" />
        <h3 className="font-bold text-gray-900">Digital Contract</h3>
        <span className={`ml-auto px-2 py-1 rounded-full text-xs font-bold ${
          contract.status === 'EXECUTED' ? 'bg-green-100 text-green-800' :
          contract.status === 'DISPUTED' ? 'bg-red-100 text-red-800' :
          contract.status === 'VOIDED' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {contract.status}
        </span>
      </div>

      {/* Contract Terms */}
      <div className="space-y-2 mb-6 text-sm text-gray-700">
        <p>This agreement is made between <span className="font-bold">{terms.farmerName || 'The Farmer'}</span> (Seller) and <span className="font-bold">{terms.buyerName || 'The Buyer'}</span> (Buyer).</p>
        <p>The Seller agrees to sell <span className="font-bold">{terms.quantityBags} bags</span> of <span className="font-bold">{terms.crop}</span> at <span className="font-bold">KSh {terms.pricePerBag}/bag</span>.</p>
        <p>Total Contract Value: <span className="font-bold">KSh {terms.totalValue?.toLocaleString()}</span>.</p>
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" /> Payment Terms: <span className="font-medium">{contract.paymentTerms}</span>
          {contract.transportTerms && <span className="ml-2">| Transport: <span className="font-medium">{contract.transportTerms}</span></span>}
        </div>
      </div>

      {/* Signature Blocks */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        {/* Farmer Signature */}
        <div className={`p-4 rounded-lg border-2 ${contract.farmerSigned ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
          <p className="text-xs font-bold uppercase text-gray-500 mb-2">Farmer Signature</p>
          {contract.farmerSigned ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-bold text-gray-900 italic">{contract.farmerSignature}</p>
                <p className="text-xs text-gray-500">{new Date(contract.farmerSignedAt!).toLocaleString('en-KE')}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 flex items-center gap-1"><PenLine className="w-4 h-4" /> Awaiting signature</p>
          )}
        </div>

        {/* Buyer Signature */}
        <div className={`p-4 rounded-lg border-2 ${contract.buyerSigned ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
          <p className="text-xs font-bold uppercase text-gray-500 mb-2">Buyer Signature</p>
          {contract.buyerSigned ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-bold text-gray-900 italic">{contract.buyerSignature}</p>
                <p className="text-xs text-gray-500">{new Date(contract.buyerSignedAt!).toLocaleString('en-KE')}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 flex items-center gap-1"><PenLine className="w-4 h-4" /> Awaiting signature</p>
          )}
        </div>
      </div>

      {/* Sign Form */}
      {role !== 'ADMIN' && (
        (role === 'FARMER' && !contract.farmerSigned) || (role === 'BUYER' && !contract.buyerSigned)
      ) && contract.status !== 'VOIDED' && (
        <form onSubmit={handleSign} className="mt-6 pt-4 border-t border-gray-100">
          {error && <p className="text-red-500 text-sm mb-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</p>}
          <p className="text-xs text-gray-500 mb-2">By typing your full name below, you electronically sign this contract.</p>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder="Enter your full legal name"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-[#00703C] focus:border-[#00703C]"
            />
            <button type="submit" disabled={signing} className="bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00582f] disabled:opacity-50">
              {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign Contract'}
            </button>
          </div>
        </form>
      )}

      {/* Download PDF */}
      {contract.status === 'EXECUTED' && (
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <a 
            href={`/api/transactions/${transactionId}/contract/pdf`} 
            target="_blank"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#00703C] hover:underline"
          >
            <Download className="w-4 h-4" /> Download Contract PDF
          </a>
        </div>
      )}
    </div>
  );
}
