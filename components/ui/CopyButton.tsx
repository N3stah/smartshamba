'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!text) return null;

  return (
    <button 
      onClick={handleCopy} 
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-admin-primary transition-colors ml-2 align-middle"
      title="Copy ID"
      aria-label="Copy SmartShamba ID"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}
