'use client';

import { usePathname } from 'next/navigation';
import { SidebarLeft, SidebarRight, Bell } from '@/components/ui/icons';
import { SIDEBAR_ITEMS } from '@/lib/navigation';

interface NavbarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function Navbar({ collapsed, onToggle }: NavbarProps) {
  const pathname = usePathname();
  
  // Find current page title from SIDEBAR_ITEMS
  const currentItem = SIDEBAR_ITEMS.find((item) => 
    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  );
  
  const pageTitle = currentItem ? currentItem.label : 'Overview';

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/5 bg-[#0C0F13]/60 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onToggle(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all active:scale-95"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <SidebarRight className="h-5 w-5" strokeWidth={2} />
            ) : (
              <SidebarLeft className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
          
          <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
          
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-[#1ECEFA] hover:border-[#1ECEFA]/30 transition-all active:scale-95"
            title="Notifications"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
            {/* Notification Dot */}
            <span className="absolute top-2.5 right-2.5 flex h-2 w-2 rounded-full bg-[#1ECEFA] shadow-sm" />
          </button>
        </div>
      </div>
    </header>
  );
}

