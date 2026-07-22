import { cookies } from 'next/headers';
import { Language, Dictionary } from './types';
import { en } from './en';
import { sw } from './sw';

const dictionaries: Record<Language, Dictionary> = { en, sw };

export async function getDictionary(): Promise<Dictionary> {
  const cookieStore = await cookies();
  const lang = cookieStore.get('smartshamba_lang')?.value as Language;
  return dictionaries[lang === 'sw' ? 'sw' : 'en'];
}
