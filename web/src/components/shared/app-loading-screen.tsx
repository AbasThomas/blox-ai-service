import { Logo } from '@/components/ui/logo';

interface AppLoadingScreenProps {
  message?: string;
}

export function AppLoadingScreen({
  message = 'Loading your workspace...',
}: AppLoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden bg-[#060A12]" role="status" aria-live="polite" aria-label={message}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(30,206,250,0.14),transparent_38%),radial-gradient(circle_at_82%_75%,rgba(30,206,250,0.08),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:42px_42px] opacity-30" />

      <div className="relative flex h-full items-center justify-center">
        <div className="relative flex flex-col items-center gap-7">
          <div className="relative">
            <div className="blox-loader-orbit absolute -inset-8 rounded-full border border-[#1ECEFA]/20" />
            <div className="blox-loader-orbit blox-loader-orbit-delayed absolute -inset-[3.4rem] rounded-full border border-[#1ECEFA]/10" />
            <div className="blox-loader-ring absolute -inset-[4.5rem] rounded-full border border-white/5" />

            <div className="relative rounded-[1.8rem] border border-white/10 bg-black/40 p-7 backdrop-blur-xl shadow-sm">
              <Logo iconOnly size="custom" iconClassName="h-20 w-20 blox-loader-float" />
              <div className="blox-loader-scan absolute left-1/2 top-0 h-[2px] w-20 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#9feeff] to-transparent" />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.34em] text-[#8FEAFC]">BLOX</p>
            <p className="text-sm text-slate-400">{message}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="blox-loader-dot h-2 w-2 rounded-full bg-[#1ECEFA]" />
            <span className="blox-loader-dot blox-loader-dot-delay-1 h-2 w-2 rounded-full bg-[#1ECEFA]" />
            <span className="blox-loader-dot blox-loader-dot-delay-2 h-2 w-2 rounded-full bg-[#1ECEFA]" />
          </div>
        </div>
      </div>
    </div>
  );
}

