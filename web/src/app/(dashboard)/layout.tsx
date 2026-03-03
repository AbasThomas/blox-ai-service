'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar/sidebar';
import { Navbar } from '@/components/layout/navbar/navbar';
import { AuthGuard } from '@/components/shared/auth-guard';
import { HexagonBackground } from '@/components/shared/hexagon-background';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const stored = localStorage.getItem('blox_sidebar_collapsed');
    if (stored && window.innerWidth >= 1024) setCollapsed(stored === '1');

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggle = (next: boolean) => {
    setCollapsed(next);
    if (typeof window !== 'undefined' && !isMobile) {
      localStorage.setItem('blox_sidebar_collapsed', next ? '1' : '0');
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#0C0F13]">
        {/* Global Background for all authenticated routes */}
        <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
          <HexagonBackground hexagonSize={50} proximity={250} />
        </div>

        {/* Sidebar Navigation */}
        <Sidebar collapsed={collapsed} onToggle={handleToggle} />

        {/* Mobile Overlay */}
        {!collapsed && isMobile && (
          <div 
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => handleToggle(true)}
          />
        )}

        {/* Main Content Area */}
        <main 
          className={`relative z-10 flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isMobile ? 'pl-0' : collapsed ? 'pl-20' : 'pl-64'
          }`}
        >
          <Navbar collapsed={collapsed} onToggle={handleToggle} />
          
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
