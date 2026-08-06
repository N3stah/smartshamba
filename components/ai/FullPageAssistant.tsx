'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Brain, Sparkles, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'ai';
  content: string;
  feedback?: string | null;
}

export default function FullPageAssistant({ role }: { role: 'FARMER' | 'BUYER' | 'ADMIN' }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load history on mount
    fetch('/api/ai/history')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const latest = data[0];
          setConvId(latest.id);
          setMessages(latest.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content, feedback: m.feedback })));
        }
      })
      .catch(console.error);

    // Load dynamic suggestions
    fetch('/api/ai/suggestions')
      .then(res => res.json())
      .then(setQuickPrompts)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId: convId })
      });

      if (!res.ok) throw new Error('Failed to fetch');
      
      const newConvId = res.headers.get('X-Conversation-Id');
      if (newConvId) setConvId(newConvId);

      // Handle Streaming Response
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      
      setMessages(prev => [...prev, { role: 'ai', content: '' }]); // Add empty AI message

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        aiText += decoder.decode(value, { stream: true });
        
        // Update the last message (AI) with the new text
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'ai', content: aiText };
          return updated;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId: string | undefined, feedback: 'POSITIVE' | 'NEGATIVE') => {
    if (!messageId) return;
    
    // Optimistic UI update
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback } : m));

    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback })
      });
    } catch (e) {
      // Revert on error
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: null } : m));
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConvId(null);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#00703C] text-white p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          <div>
            <h2 className="font-bold text-lg">SmartShamba AI Assistant</h2>
            <p className="text-xs text-green-100">Your intelligent agricultural copilot</p>
          </div>
        </div>
        <button onClick={handleNewChat} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Chat
        </button>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Brain className="w-12 h-12 mb-2" />
            <p className="text-sm">How can I help you today?</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#00703C] text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
            {/* Feedback Buttons for AI messages */}
            {msg.role === 'ai' && msg.id && !loading && (
              <div className="flex gap-2 mt-1 ml-2">
                <button 
                  onClick={() => handleFeedback(msg.id, 'POSITIVE')}
                  className={`p-1 rounded ${msg.feedback === 'POSITIVE' ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-500'}`}
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => handleFeedback(msg.id, 'NEGATIVE')}
                  className={`p-1 rounded ${msg.feedback === 'NEGATIVE' ? 'text-red-600 bg-red-50' : 'text-gray-300 hover:text-gray-500'}`}
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && messages.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-3 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="p-3 border-t border-gray-200 flex flex-wrap gap-2 bg-white">
        {quickPrompts.map(prompt => (
          <button 
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="flex items-center gap-1 bg-green-50 text-[#00703C] px-3 py-1.5 rounded-full text-xs font-medium hover:bg-green-100 transition-colors border border-green-200"
          >
            <Sparkles className="w-3 h-3" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="p-4 border-t border-gray-200 flex items-center gap-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your farm, market, or transactions..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00703C]"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="bg-[#00703C] text-white p-2.5 rounded-full hover:bg-[#00582f] disabled:opacity-50">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
