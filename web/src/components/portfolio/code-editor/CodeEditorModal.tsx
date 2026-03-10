'use client';

/**
 * CodeEditorModal — full-screen split-view code editor for portfolio templates.
 *
 * Left pane:  Monaco editor (CSS Overrides | Config JSON tabs)
 * Right pane: Live preview with CSS injected — debounced 300 ms
 *
 * Saves to asset content.codeCustomizations.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PublicProfilePayload } from '@nextjs-blox/shared-types';
import { PortfolioTemplateRenderer } from '../templates/PortfolioTemplateRenderer';
import { getTemplateById } from '@/lib/portfolio-templates';
import {
  CheckCircle,
  RotateCcw,
  Settings,
  Sparkles,
  X,
} from '@/components/ui/icons';

// Monaco loaded client-side only — large bundle, not needed on server
const MonacoEditorComponent = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-[#1e1e1e]">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1ECEFA] border-t-transparent" />
    </div>
  ),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CodeCustomizations {
  css: string;
  config: string;
}

export interface CodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  profile: PublicProfilePayload;
  initialCss?: string;
  initialConfig?: string;
  onSave: (customizations: CodeCustomizations) => Promise<void>;
}

type EditorTab = 'css' | 'config';

// ─── Default starters ───────────────────────────────────────────────────────

const DEFAULT_CONFIG_JSON = `{
  "colors": {
    "accent": "",
    "background": "",
    "text": ""
  },
  "typography": {
    "fontFamily": "",
    "headingFont": ""
  },
  "layout": {
    "sectionSpacing": "default",
    "heroStyle": "default"
  }
}`;

// ─── Small inline SVG icons (avoids new dependency) ─────────────────────────

function CodeBracketsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function SaveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function RedoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 14 20 9 15 4" />
      <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CodeEditorModal({
  isOpen,
  onClose,
  templateId,
  profile,
  initialCss,
  initialConfig,
  onSave,
}: CodeEditorModalProps) {
  const template = getTemplateById(templateId);
  const defaultCss = initialCss ?? (template.starterCss ?? `/* ${template.name} — CSS Overrides */\n/* Use specific CSS selectors to customise this template */\n`);
  const defaultConfig = initialConfig ?? DEFAULT_CONFIG_JSON;

  const [tab, setTab] = useState<EditorTab>('css');
  const [cssCode, setCssCode] = useState(defaultCss);
  const [configCode, setConfigCode] = useState(defaultConfig);
  const [livePreviewCss, setLivePreviewCss] = useState(defaultCss);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Monaco editor ref for undo/redo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-init when template changes
  useEffect(() => {
    if (initialCss !== undefined) setCssCode(initialCss);
    if (initialConfig !== undefined) setConfigCode(initialConfig);
  }, [initialCss, initialConfig]);

  // Debounced live preview update (CSS only — JSON config not live-previewed)
  const handleCssChange = useCallback((value: string | undefined) => {
    const v = value ?? '';
    setCssCode(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setLivePreviewCss(v);
    }, 350);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({ css: cssCode, config: configCode });
      setSaved(true);
      setPreviewKey((k) => k + 1); // force preview refresh after save
      setTimeout(() => setSaved(false), 2200);
    } catch {
      // parent handles error display
    } finally {
      setSaving(false);
    }
  }, [cssCode, configCode, onSave]);

  const handleUndo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'undo', null);
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'redo', null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleSave, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#09090b' }}
      role="dialog"
      aria-modal="true"
      aria-label="Template Code Editor"
    >
      {/* ── Top bar ── */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/8 px-4">
        <CodeBracketsIcon size={15} />
        <span className="text-sm font-semibold text-white">Edit Template Code</span>
        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
          {template.name}
        </span>

        {/* Tab switcher */}
        <div className="ml-3 flex overflow-hidden rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setTab('css')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === 'css' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CodeBracketsIcon size={12} /> CSS
          </button>
          <button
            type="button"
            onClick={() => setTab('config')}
            className={`flex items-center gap-1.5 border-l border-white/10 px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === 'config' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings size={12} /> Config
          </button>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
            className="flex h-7 w-7 items-center justify-center rounded border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <RotateCcw size={13} />
          </button>
          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="flex h-7 w-7 items-center justify-center rounded border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <RedoIcon size={13} />
          </button>

          {/* Reset to defaults */}
          <button
            type="button"
            title="Reset to template defaults"
            onClick={() => {
              setCssCode(defaultCss);
              setConfigCode(DEFAULT_CONFIG_JSON);
              setLivePreviewCss(defaultCss);
            }}
            className="flex h-7 items-center gap-1 rounded border border-white/10 px-2 text-[11px] text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Sparkles size={11} /> Reset
          </button>

          {/* Save — Ctrl+S */}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            title="Save (Ctrl+S)"
            className="flex h-7 items-center gap-1.5 rounded bg-[#1ECEFA] px-3 text-xs font-semibold text-[#09090b] hover:bg-[#3DD5FF] disabled:opacity-60 transition-colors"
          >
            {saved ? <CheckCircle size={12} /> : <SaveIcon size={12} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="flex h-7 w-7 items-center justify-center rounded border border-white/10 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Split pane ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor pane */}
        <div className="flex w-1/2 flex-col overflow-hidden border-r border-white/8">
          {/* Pane label */}
          <div className="flex h-8 shrink-0 items-center gap-2 border-b border-white/5 bg-[#161618] px-3">
            <span className="text-[11px] text-slate-500">
              {tab === 'css' ? 'styles.css' : 'config.json'}
            </span>
            {tab === 'css' && (
              <span className="ml-auto text-[10px] text-slate-600">
                CSS rules — update instantly in preview →
              </span>
            )}
          </div>

          <MonacoEditorComponent
            height="100%"
            language={tab === 'css' ? 'css' : 'json'}
            value={tab === 'css' ? cssCode : configCode}
            onChange={tab === 'css' ? handleCssChange : (v) => setConfigCode(v ?? '')}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            theme="vs-dark"
            options={{
              fontSize: 13,
              lineHeight: 22,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              renderLineHighlight: 'gutter',
              padding: { top: 10, bottom: 12 },
              fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Consolas, monospace',
              fontLigatures: true,
              formatOnPaste: true,
              formatOnType: tab === 'config',
              quickSuggestions: true,
              suggestOnTriggerCharacters: true,
              smoothScrolling: true,
              cursorSmoothCaretAnimation: 'on',
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>

        {/* Live preview pane */}
        <div className="flex w-1/2 flex-col overflow-hidden bg-[#060A12]">
          {/* Preview pane label */}
          <div className="flex h-8 shrink-0 items-center gap-2 border-b border-white/8 px-3">
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: '#1ECEFA' }}
            />
            <span className="text-[11px] text-slate-500">Live Preview</span>
            <span className="ml-auto text-[10px] text-slate-600">
              {tab === 'css' ? 'Updates as you type (350 ms)' : 'Save to see config changes'}
            </span>
            {/* Device badge */}
            <span className="rounded border border-white/8 px-1.5 py-0.5 text-[10px] text-slate-500">
              1280 × 800
            </span>
          </div>

          {/* Scaled template preview */}
          <div className="flex-1 overflow-auto">
            <div
              className="relative"
              style={{
                /* Container shows at 50% of 1280px = 640px wide */
                width: '640px',
                height: '400px',
              }}
            >
              {/* CSS injection — scoped to preview by position */}
              {livePreviewCss && (
                <style dangerouslySetInnerHTML={{ __html: livePreviewCss }} />
              )}
              {/* Template at full size, scaled down 0.5× */}
              <div
                key={previewKey}
                style={{
                  width: '1280px',
                  height: '800px',
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  overflow: 'hidden',
                }}
              >
                <PortfolioTemplateRenderer
                  profile={profile}
                  subdomain="preview"
                  templateId={templateId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Help footer ── */}
      <div className="flex h-7 shrink-0 items-center gap-4 border-t border-white/5 bg-[#0d0d10] px-4">
        <span className="text-[10px] text-slate-600">Ctrl+S to save</span>
        <span className="text-[10px] text-slate-600">Esc to close</span>
        <span className="text-[10px] text-slate-600">CSS applies immediately · Config saves on Save</span>
        <span className="ml-auto text-[10px] text-slate-700">Blox Code Editor</span>
      </div>
    </div>
  );
}
