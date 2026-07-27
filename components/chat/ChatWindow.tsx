'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2, Send, Paperclip, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderType: string;
  senderName: string;
  body: string;
  createdAt: string;
}

interface ChatWindowProps {
  transactionId: string;
  currentUserId: string;
  viewerRole: 'FARMER' | 'BUYER' | 'ADMIN';
}

export default function ChatWindow({ transactionId, currentUserId, viewerRole }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Pass role to API so it knows which cookie to use
        const res = await fetch(`/api/transactions/${transactionId}/messages?role=${viewerRole}`);
        if (res.ok) setMessages(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [transactionId, viewerRole]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      senderId: currentUserId,
      senderType: viewerRole,
      senderName: 'You',
      body: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setInput('');

    try {
      const res = await fetch(`/api/transactions/${transactionId}/messages?role=${viewerRole}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: tempMsg.body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      
      setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-[#efeae2]">
      
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col"
        style={{
          backgroundImage: `radial-gradient(#00703C 0.75px, transparent 0.75px)`,
          backgroundSize: '24px 24px',
          backgroundColor: '#efeae2',
        }}
      >
        {loading ? (
          <div className="self-center text-center text-gray-500 text-sm flex justify-center items-center h-full bg-white/60 rounded-lg p-4 w-full">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="self-center text-center text-gray-500 text-sm flex justify-center items-center h-full bg-white/60 rounded-lg p-4 w-full">
            No messages yet. Start the negotiation!
          </div>
        ) : (
          messages.map((msg) => {
            const isSent = msg.senderType === viewerRole;
            
            return (
              <div
                key={msg.id}
                className={`relative max-w-[75%] px-3.5 py-2 text-sm shadow-sm ${
                  isSent
                    ? 'self-end bg-[#d9fdd3] text-gray-900 rounded-2xl rounded-tr-none'
                    : 'self-start bg-white text-gray-900 rounded-2xl rounded-tl-none border border-gray-100'
                }`}
              >
                {!isSent && (
                  <p className="text-[11px] font-bold text-[#00703C] mb-0.5 capitalize">
                    {msg.senderName || msg.senderType.toLowerCase()}
                  </p>
                )}
                
                <p className="leading-relaxed pr-12 whitespace-pre-wrap">{msg.body}</p>
                
                <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-gray-500 select-none">
                  <span>{new Date(msg.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                  {isSent && <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="bg-[#f0f2f5] p-3 border-t border-gray-200 flex items-center gap-2">
        <button type="button" className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200/60">
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(e)}
          placeholder="Type a message..."
          className="flex-1 bg-white px-4 py-2.5 rounded-full text-sm border border-gray-200 focus:outline-none focus:border-[#00703C] text-gray-900"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-[#00703C] hover:bg-[#00582f] text-white p-2.5 rounded-full shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
