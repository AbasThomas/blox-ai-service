import type { Metadata, Viewport } from 'next';
import './global.css';
import { PosthogProvider } from '../components/layout/posthog-provider';

const BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020612',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Blox – AI Portfolio & Resume Builder',
    template: '%s | Blox',
  },
  description:
    'Build a stunning portfolio, résumé, or personal branding page in minutes with AI. Get discovered on Google with SEO-optimised pages hosted on your own subdomain.',
  keywords: [
    'portfolio builder',
    'AI resume builder',
    'cover letter generator',
    'ATS optimisation',
    'personal branding',
    'developer portfolio',
    'online resume',
  ],
  authors: [{ name: 'Blox', url: BASE_URL }],
  creator: 'Blox',
  publisher: 'Blox',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  openGraph: {
    siteName: 'Blox',
    title: 'Blox – AI Portfolio & Resume Builder',
    description:
      'Build a stunning portfolio, résumé, or personal branding page in minutes with AI. Get discovered on Google with SEO-optimised pages hosted on your own subdomain.',
    url: BASE_URL,
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/og?title=Blox+%E2%80%93+AI+Portfolio+%26+Resume+Builder`,
        width: 1200,
        height: 630,
        alt: 'Blox – AI Portfolio & Resume Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bloxapp',
    title: 'Blox – AI Portfolio & Resume Builder',
    description:
      'Build a stunning portfolio, résumé, or personal branding page in minutes with AI.',
    images: [`${BASE_URL}/og?title=Blox+%E2%80%93+AI+Portfolio+%26+Resume+Builder`],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Bungee+Inline&family=Londrina+Shadow&family=Rubik+Maze&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PosthogProvider>
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
        </PosthogProvider>
      </body>
    </html>
  );
}
