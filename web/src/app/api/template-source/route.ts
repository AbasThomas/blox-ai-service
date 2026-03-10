import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TEMPLATE_FILES: Record<string, string> = {
  'portfolio-modern-001':           'NightfallTemplate.tsx',
  'portfolio-freelance-conversion': 'FreelanceTemplate.tsx',
  'portfolio-timeline-dev':         'DevTerminalTemplate.tsx',
  'portfolio-minimal-clean':        'MinimalTemplate.tsx',
  'portfolio-grid-showcase':        'CreativeGalleryTemplate.tsx',
  'portfolio-neon-dev':             'NeonDevTemplate.tsx',
  'portfolio-glass-dev':            'GlassDevTemplate.tsx',
  'portfolio-studio-designer':      'StudioDesignerTemplate.tsx',
  'portfolio-canvas-designer':      'CanvasDesignerTemplate.tsx',
  'portfolio-garden-studio':        'GardenStudioTemplate.tsx',
  'portfolio-arcade':               'ArcadeTemplate.tsx',
  'portfolio-bento-studio':         'BentoStudioTemplate.tsx',
  'portfolio-alchemist':            'AlchemistTemplate.tsx',
  'portfolio-ramond':               'RamondTemplate.tsx',
  'portfolio-cinematic':            'CinematicTemplate.tsx',
  'portfolio-macos':                'MacOSTemplate.tsx',
};

function getFilePath(templateId: string): string | null {
  const fileName = TEMPLATE_FILES[templateId];
  if (!fileName) return null;
  return path.join(process.cwd(), 'src/components/portfolio/templates', fileName);
}

/** GET /api/template-source?id=<templateId> — returns raw TSX source */
export async function GET(req: NextRequest) {
  const filePath = getFilePath(req.nextUrl.searchParams.get('id') ?? '');
  if (!filePath) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return new NextResponse(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not read file' }, { status: 500 });
  }
}

/** PUT /api/template-source?id=<templateId> — overwrites TSX source (dev only) */
export async function PUT(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Source editing only available in development mode' }, { status: 403 });
  }
  const filePath = getFilePath(req.nextUrl.searchParams.get('id') ?? '');
  if (!filePath) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  try {
    const body = await req.text();
    fs.writeFileSync(filePath, body, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not write file' }, { status: 500 });
  }
}
