import type { Metadata } from 'next';
import './global.css';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';
import { PosthogProvider } from '../components/layout/posthog-provider';

export const metadata: Metadata = {
  title: {
    default: 'Blox - AI Portfolio Builder',
    template: '%s | Blox',
  },
  description: 'Create professional portfolios in minutes',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://blox.app'),
  keywords: ['portfolio builder', 'AI resume', 'cover letter generator', 'ATS optimization'],
  openGraph: {
    title: 'Blox - AI Portfolio Builder',
    description: 'Create professional portfolios in minutes',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PosthogProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
            <Footer />
          </div>
        </PosthogProvider>
      </body>
    </html>
  );
}

