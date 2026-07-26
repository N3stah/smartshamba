'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Link as LinkIcon } from 'lucide-react';

export default function WhatsAppGroupManager({ groupId, initialLink, isCreator }: { groupId: string; initialLink: string | null; isCreator: boolean }) {
  const [link, setLink] = useState(initialLink ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(false);
    
    if (link && !link.startsWith('https://chat.whatsapp.com/')) {
      setError('Please enter a valid WhatsApp group invite link (e.g., https://chat.whatsapp.com/...)');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/groups/${groupId}/whatsapp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappLink: link }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div>
        {isCreator ? (
          <form onSubmit={handleSave} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">WhatsApp Group Invite Link</label>
            <input 
              type="text" 
              value={link} 
              onChange={(e) => setLink(e.target.value)} 
              placeholder="https://chat.whatsapp.com/..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-600"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            {success && <p className="text-green-600 text-xs">Link saved successfully!</p>}
            <button type="submit" disabled={loading} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              Save Link
            </button>
          </form>
        ) : (
          <div>
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600">
                <LinkIcon className="w-4 h-4" /> Join WhatsApp Group
              </a>
            ) : (
              <p className="text-sm text-gray-400">The group creator has not posted a WhatsApp link yet.</p>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        {link ? (
          <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <QRCodeSVG value={link} size={160} bgColor="#ffffff" fgColor="#00703C" level="M" />
            <p className="text-xs text-center text-gray-400 mt-2">Scan to join group</p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center w-[160px] h-[160px]">
            <p className="text-xs text-gray-400 text-center">No QR code available</p>
          </div>
        )}
      </div>
    </div>
  );
}
