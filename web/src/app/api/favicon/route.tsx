import { ImageResponse } from 'next/og';

export const runtime = 'edge';

function sanitizeInitials(value: string | null): string {
  const normalized = (value ?? 'bx')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 2);
  if (normalized.length === 2) return normalized;
  if (normalized.length === 1) return `${normalized}${normalized}`;
  return 'bx';
}

function sanitizeColor(value: string | null, fallback: string): string {
  const normalized = (value ?? '').trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)
    ? normalized
    : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const initials = sanitizeInitials(searchParams.get('i'));
  const color = sanitizeColor(searchParams.get('c'), '#E2E8F0');
  const bg = sanitizeColor(searchParams.get('bg'), '#0B1220');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
        }}
      >
        <span
          style={{
            color,
            fontSize: 20,
            fontWeight: 700,
            fontFamily: 'sans-serif',
            lineHeight: 1,
          }}
        >
          {initials}
        </span>
      </div>
    ),
    { width: 32, height: 32 },
  );
}
