import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SmartShamba - Maize Trading',
    short_name: 'SmartShamba',
    description: 'Direct, transparent maize trading for Kenya&apos;s farmers & buyers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00703C',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
