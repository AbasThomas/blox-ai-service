'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar/sidebar';
import { HexagonBackground } from '@/components/shared/hexagon-background';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0C0F13]">
      {/* Global Background for all authenticated routes */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <HexagonBackground hexagonSize={50} proximity={250} />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
