import { TEMPLATE_META } from './meta';
import { RESUME_TEMPLATES } from './mapping';
import { MOCK_PREVIEW_DATA } from './mock-data';
import { CheckCircle } from '@/components/ui/icons';

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {TEMPLATE_META.map((t) => {
        const isSelected = selectedId === t.id;
        const Template = RESUME_TEMPLATES[t.id];

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
              isSelected
                ? 'border-indigo-500/50 ring-1 ring-indigo-500/30'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            {/* Live Preview Container */}
            <div className="relative aspect-[210/297] w-full overflow-hidden bg-white">
              {/* Scaled Resume Page */}
              <div className="absolute left-0 top-0 h-[297mm] w-[210mm] origin-top-left scale-[0.25] select-none">
                <div className="h-full w-full bg-white text-slate-900 shadow-sm">
                  {Template ? (
                    <Template data={MOCK_PREVIEW_DATA} />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-50 text-slate-400">
                      Preview Unavailable
                    </div>
                  )}
                </div>
              </div>
              
              {/* Interaction Overlay */}
              <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-black/2 transition-colors" />
            </div>

            {/* Meta Info */}
            <div className="flex flex-col gap-1 border-t border-white/5 bg-[#0C0F13] p-3">
              <p className="truncate text-xs font-semibold text-slate-200">{t.name}</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 capitalize">
                  {t.category}
                </span>
              </div>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute right-2 top-2 z-20 text-indigo-500 drop-shadow-md">
                <CheckCircle className="h-6 w-6 fill-current bg-white rounded-full" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
