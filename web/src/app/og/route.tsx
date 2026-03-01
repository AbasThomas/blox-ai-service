import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * Dynamic OG image generator.
 *
 * Query params:
 *   title    – main heading  (e.g. "Thomas Abas")
 *   subtitle – role/location (e.g. "Full-Stack Developer · Lagos, Nigeria")
 *   domain   – shown at bottom (e.g. "thomas.blox.app")
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title    = searchParams.get('title')    ?? 'Blox Portfolio';
  const subtitle = searchParams.get('subtitle') ?? '';
  const domain   = searchParams.get('domain')   ?? 'blox.app';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          background: 'linear-gradient(135deg, #020612 0%, #0f2027 50%, #1f756f 100%)',
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Blox brand badge */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 72,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(31,117,111,0.3)',
            border: '1px solid rgba(31,117,111,0.6)',
            borderRadius: 8,
            padding: '6px 16px',
          }}
        >
          <span style={{ color: '#5eead4', fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>
            BLOX
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, zIndex: 1 }}>
          {subtitle ? (
            <p
              style={{
                margin: 0,
                fontSize: 22,
                color: '#5eead4',
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </p>
          ) : null}

          <h1
            style={{
              margin: 0,
              fontSize: title.length > 30 ? 52 : 68,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            {title}
          </h1>

          <p style={{ margin: 0, fontSize: 20, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
            {domain}
          </p>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
