'use client';

import { useRef, useState } from 'react';

const ALL_SECTIONS = ['hero', 'about', 'projects', 'skills', 'contact'] as const;
type SectionKey = (typeof ALL_SECTIONS)[number];

const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero',
  about: 'About',
  projects: 'Projects',
  skills: 'Skills',
  contact: 'Contact',
};

export const DEFAULT_SECTION_ORDER: SectionKey[] = ['hero', 'about', 'projects', 'skills', 'contact'];

interface SectionOrderPanelProps {
  order: string[];
  onChange: (order: string[]) => void;
}

export function SectionOrderPanel({ order, onChange }: SectionOrderPanelProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dropIndex = useRef<number | null>(null);

  // Ensure all canonical sections are present; unknown entries are dropped
  const sections: SectionKey[] = [
    ...order.filter((s): s is SectionKey => ALL_SECTIONS.includes(s as SectionKey)),
    ...ALL_SECTIONS.filter((s) => !order.includes(s)),
  ];

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dropIndex.current = index;
  };

  const handleDragEnd = () => {
    const from = dragIndex;
    const to = dropIndex.current;
    if (from !== null && to !== null && from !== to) {
      const next = [...sections];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange(next);
    }
    setDragIndex(null);
    dropIndex.current = null;
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...sections];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const next = [...sections];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    onChange(next);
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-400">Section Order</p>
      <p className="text-[11px] text-slate-600">Drag to reorder. Changes apply on save.</p>
      <div className="space-y-1.5">
        {sections.map((section, index) => (
          <div
            key={section}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex cursor-grab items-center gap-2 rounded-lg border px-3 py-2 transition-all select-none active:cursor-grabbing ${
              dragIndex === index
                ? 'border-purple-500/40 bg-purple-500/10 opacity-50'
                : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
            }`}
          >
            <span className="text-slate-600 text-xs leading-none" aria-hidden>⠿</span>
            <span className="flex-1 text-xs font-medium text-slate-300">
              {SECTION_LABELS[section]}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="rounded p-0.5 text-[10px] text-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === sections.length - 1}
                className="rounded p-0.5 text-[10px] text-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...DEFAULT_SECTION_ORDER])}
        className="w-full rounded-lg border border-white/8 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:border-white/15 hover:text-slate-300 transition-colors"
      >
        Reset order
      </button>
    </div>
  );
}
