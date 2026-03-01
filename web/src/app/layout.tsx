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
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Bungee+Inline&family=Londrina+Shadow&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <PosthogProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </PosthogProvider>
        </body>
      </html>
    );
  }
