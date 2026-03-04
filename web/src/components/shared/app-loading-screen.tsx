interface AppLoadingScreenProps {
  message?: string;
}

export function AppLoadingScreen({
  message = 'Loading your workspace...',
}: AppLoadingScreenProps) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#060A12]"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Ambient glow — single radial behind the logo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(30,206,250,0.09) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-9">

        {/* ── Logo SVG — 4 blocks animate in sequentially ── */}
        <svg
          width="96"
          height="96"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Block 1 — cyan, top-left — pops in first, then glows */}
          <rect
            x="12" y="12" width="34" height="34" rx="10"
            fill="#1ECEFA"
            className="blox-block-cyan"
          />

          {/* Block 2 — dark, top-right */}
          <rect
            x="54" y="12" width="34" height="34" rx="10"
            fill="#0B121C" stroke="#1A2634" strokeWidth="3.5"
            className="blox-block blox-block-d1"
          />

          {/* Block 3 — dark, bottom-left */}
          <rect
            x="12" y="54" width="34" height="34" rx="10"
            fill="#0B121C" stroke="#1A2634" strokeWidth="3.5"
            className="blox-block blox-block-d2"
          />

          {/* Block 4 — dark, bottom-right */}
          <rect
            x="54" y="54" width="34" height="34" rx="10"
            fill="#0B121C" stroke="#1A2634" strokeWidth="3.5"
            className="blox-block blox-block-d3"
          />
        </svg>

        {/* ── Wordmark + message ── */}
        <div className="blox-wordmark space-y-2 text-center">
          <p className="text-sm font-black tracking-[0.28em] text-white">BLOX</p>
          <p className="text-xs text-slate-500">{message}</p>
        </div>

        {/* ── Shimmer progress bar ── */}
        <div className="h-px w-28 overflow-hidden rounded-full bg-white/8">
          <div className="blox-shimmer h-full w-2/5 rounded-full bg-gradient-to-r from-transparent via-[#1ECEFA]/60 to-transparent" />
        </div>

      </div>
    </div>
  );
}
