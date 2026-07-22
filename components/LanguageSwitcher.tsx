'use client';

import { useI18n } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { Language } from '@/lib/i18n/types';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 hidden sm:inline">{t.common.language}:</span>
      <button
        onClick={() => { setLang('en'); router.refresh(); }}
        className={`px-2 py-1 text-xs rounded ${lang === 'en' ? 'bg-green-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
      >
        EN
      </button>
      <button
        onClick={() => { setLang('sw'); router.refresh(); }}
        className={`px-2 py-1 text-xs rounded ${lang === 'sw' ? 'bg-green-700 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
      >
        SW
      </button>
    </div>
  );
}
