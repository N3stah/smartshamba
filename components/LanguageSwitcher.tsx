'use client';

import { useI18n } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center justify-center rounded-full bg-black/20 p-1 w-full">
      <button
        onClick={() => setLang('en')}
        className={`w-1/2 px-3 py-1 text-xs rounded-full transition-colors ${lang === 'en' ? 'bg-white text-green-800 font-semibold' : 'text-green-100 hover:text-white'}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('sw')}
        className={`w-1/2 px-3 py-1 text-xs rounded-full transition-colors ${lang === 'sw' ? 'bg-white text-green-800 font-semibold' : 'text-green-100 hover:text-white'}`}
      >
        SW
      </button>
    </div>
  );
}
