'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, MessageCircle } from 'lucide-react';

interface Props {
  groupId: string;
  initialVerified: boolean;
  initialWhatsappApproved: boolean;
}

export default function GroupApprovalControls({ groupId, initialVerified, initialWhatsappApproved }: Props) {
  const router = useRouter();
  const [verified, setVerified] = useState(initialVerified);
  const [whatsappApproved, setWhatsappApproved] = useState(initialWhatsappApproved);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (field: 'verified' | 'whatsappApproved', value: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !value }),
      });
      
      if (res.ok) {
        if (field === 'verified') setVerified(!value);
        if (field === 'whatsappApproved') setWhatsappApproved(!value);
        router.refresh();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          <ShieldCheck className={`w-5 h-5 ${verified ? 'text-green-500' : 'text-gray-400'}`} />
          <div>
            <p className="text-sm font-semibold text-gray-900">Group Verification</p>
            <p className="text-xs text-gray-500">Verified groups can participate in USSD flows.</p>
          </div>
        </div>
        <button 
          onClick={() => handleToggle('verified', verified)}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            verified 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-admin-primary text-white hover:bg-admin-primary/90'
          }`}
        >
          {verified ? 'Unverify Group' : 'Approve Group'}
        </button>
      </div>

      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          <MessageCircle className={`w-5 h-5 ${whatsappApproved ? 'text-green-500' : 'text-gray-400'}`} />
          <div>
            <p className="text-sm font-semibold text-gray-900">WhatsApp Link Approval</p>
            <p className="text-xs text-gray-500">Approved links are exposed to farmers via USSD.</p>
          </div>
        </div>
        <button 
          onClick={() => handleToggle('whatsappApproved', whatsappApproved)}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            whatsappApproved 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-admin-primary text-white hover:bg-admin-primary/90'
          }`}
        >
          {whatsappApproved ? 'Revoke WhatsApp' : 'Approve WhatsApp'}
        </button>
      </div>
    </div>
  );
}
