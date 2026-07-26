'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderType: string;
  body: string;
  createdAt: string;
}

export default function ChatWindow({ transactionId, currentUserId }: { transactionId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}/messages`);
        if (res.ok) setMessages(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [transactionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      senderId: currentUserId,
      senderType: 'ME',
      body: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setInput('');

    try {
      const res = await fetch(`/api/transactions/${transactionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: tempMsg.body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      
      // Replace temp message with real message
      setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-xl border border-gray-200">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 text-sm flex justify-center items-center h-full">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm flex justify-center items-center h-full">
            No messages yet. Start the negotiation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-lg shadow-sm ${isMe ? 'bg-[#00703C] text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                  <p className="text-sm">{msg.body}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <form onSubmit={handleSend} className="border-t border-gray-200 p-4 flex items-center gap-2 bg-white rounded-b-xl">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-100 focus:border-green-600"
        />
        <button type="submit" disabled={sending || !input.trim()} className="bg-[#00703C] text-white p-2.5 rounded-lg hover:bg-green-800 disabled:opacity-50">
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
