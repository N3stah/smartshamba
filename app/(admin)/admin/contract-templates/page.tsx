'use client';
import { useState, useEffect } from 'react';
import { Loader2, FileText, Plus, Trash2 } from 'lucide-react';

interface Clause {
  title: string;
  content: string;
}

interface Template {
  id: string;
  name: string;
  category: string | null;
  clauses: Clause[];
}

export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [clauses, setClauses] = useState<Clause[]>([{ title: '', content: '' }]);

  useEffect(() => {
    fetch('/api/admin/contract-templates').then(r => r.json()).then(d => {
      setTemplates(d);
      setLoading(false);
    });
  }, []);

  const addClause = () => setClauses([...clauses, { title: '', content: '' }]);
  
  const updateClause = (i: number, field: keyof Clause, val: string) => {
    const newClauses = [...clauses];
    newClauses[i][field] = val;
    setClauses(newClauses);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/contract-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, clauses })
    });
    if (res.ok) {
      const newTemplate = await res.json();
      setTemplates([newTemplate, ...templates]);
      setShowForm(false);
      setName(''); setCategory(''); setClauses([{ title: '', content: '' }]);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#00703C]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Contract Templates</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#00703C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#005a30]">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Template Name (e.g. Standard Maize Sale)" className="border rounded-lg p-2 text-sm" required />
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g. Maize)" className="border rounded-lg p-2 text-sm" />
          </div>
          <div className="space-y-2">
            {clauses.map((c, i) => (
              <div key={i} className="flex flex-col gap-1 border-b pb-2">
                <input value={c.title} onChange={e => updateClause(i, 'title', e.target.value)} placeholder="Clause Title (e.g. Delivery Terms)" className="border rounded-lg p-2 text-sm font-medium" required />
                <textarea value={c.content} onChange={e => updateClause(i, 'content', e.target.value)} placeholder="Clause Content (Use {{variables}})" className="border rounded-lg p-2 text-sm h-20" required />
              </div>
            ))}
            <button type="button" onClick={addClause} className="text-sm text-[#00703C] font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add Clause</button>
          </div>
          <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">Save Template</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00703C]" />
                <h3 className="font-bold text-gray-900">{t.name}</h3>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{t.category || 'General'}</span>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              {t.clauses.map((c, i) => <p key={i} className="truncate">• {c.title}</p>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
