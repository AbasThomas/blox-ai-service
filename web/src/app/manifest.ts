import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Blox',
    short_name: 'Blox',
    description: 'AI-powered platform for portfolios, resumes, CVs, and cover letters.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#228f87',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  };
}

