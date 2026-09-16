'use client';
import { useState, useRef, useEffect } from 'react';
import { Brain, Send, X } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function AIChatWidget({ role }: { role: 'FARMER' | 'BUYER' | 'STAFF' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let welcome = "Hello! I am SmartShamba AI. How can I assist you today?";
    if (role === 'FARMER') {
      welcome = "Habari! I'm your SmartShamba AI assistant. Ask me when to sell your crops or check your listings.";
    } else if (role === 'BUYER') {
      welcome = "Hello! I'm your procurement assistant. Ask me about market trends or your pending transactions.";
    } else if (role === 'STAFF') {
      welcome = "Welcome, Staff. Ask me for platform statistics, market intelligence, or dispute summaries.";
    }
    setMessages([{ role: 'ai', text: welcome }]);
  }, [role]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      if (!res.ok) {
        // Handle error responses safely
        let errorText = "I'm having trouble connecting right now.";
        if (res.status === 429) {
          const data = await res.json().catch(() => null);
          if (data?.retryAfter) {
            errorText = `Rate limit exceeded. Please try again in ${data.retryAfter} seconds.`;
          } else {
            errorText = "You've sent too many messages. Please try again later.";
          }
        } else if (res.status === 401 || res.status === 403) {
          errorText = "You are not authorized to use the AI assistant.";
        }
        setMessages(prev => [...prev, { role: 'ai', text: errorText }]);
        return;
      }

      // Handle Streaming Response
      if (!res.body) {
        setMessages(prev => [...prev, { role: 'ai', text: "No response received from the server." }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      setMessages(prev => [...prev, { role: 'ai', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiText += decoder.decode(value, { stream: true });

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'ai', text: aiText };
          return updated;
        });
      }

      // Handle empty response
      if (!aiText) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'ai', text: "I didn't receive a response. Please try again." };
          return updated;
        });
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-[#00703C] text-white p-4 rounded-full shadow-lg hover:bg-[#00582f] transition-transform active:scale-95 flex items-center justify-center"
        aria-label="Open AI Chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
        {!isOpen && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-[#00703C] text-white p-4 flex items-center gap-3">
            <div className="relative">
              <Brain className="w-6 h-6" />
              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-[#00703C]"></span>
            </div>
            <div>
              <h3 className="font-bold text-sm">SmartShamba AI</h3>
              <p className="text-[10px] text-green-100 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-green-300 rounded-full"></span> Online
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="ml-auto text-green-100 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#00703C] text-white rounded-br-none'
                    : 'bg-white border border-gray-100 text-gray-900 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex items-center gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about market prices..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00703C] transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#00703C] text-white p-2.5 rounded-full hover:bg-[#00582f] disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
