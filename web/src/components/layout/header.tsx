'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Menu, X, ChevronRight, Bell } from 'lucide-react';
import { PlanTier } from '@nextjs-blox/shared-types';
import { SIDEBAR_ITEMS } from '../../lib/navigation';
import { useBloxStore } from '../../lib/store/app-store';

const CYAN = '#1ECEFA';

const tierTone: Record<PlanTier, string> = {
  [PlanTier.FREE]: 'bg-slate-800 text-slate-300 border-white/5',
  [PlanTier.PRO]: 'bg-cyan-500/10 text-[#1ECEFA] border-[#1ECEFA]/20',
  [PlanTier.PREMIUM]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [PlanTier.ENTERPRISE]: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const LANDING_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useBloxStore((state) => state.user);
  const isAuthenticated = useBloxStore((state) => state.isAuthenticated);
  const notifications = useBloxStore((state) => state.notifications);
  const logout = useBloxStore((state) => state.logout);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.push('/');
  }

  const navLinks = pathname === '/' && !isAuthenticated ? LANDING_LINKS : SIDEBAR_ITEMS;

  return (
    <header className="fixed left-1/2 top-4 z-50 w-full max-w-6xl -translate-x-1/2 px-6">
      <div className="rounded-full border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between py-2.5 pl-6 pr-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity translate-y-[1px]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 ring-1 ring-white/10 shadow-lg" style={{ background: `linear-gradient(135deg, ${CYAN}20, rgba(15,23,42,0.8))` }}>
              <Bot size={20} className="text-[#1ECEFA]" strokeWidth={2} />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-base font-black tracking-tight text-white uppercase italic">Blox</span>
              <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">AI Engine</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] font-bold tracking-tight transition-all hover:scale-105 ${
                  pathname === item.href
                    ? 'text-[#1ECEFA]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Notifications Dot */}
                {unreadCount > 0 && (
                  <Link href="/dashboard" className="relative text-slate-400 hover:text-white">
                    <Bell size={18} />
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
                  </Link>
                )}

                {/* User Menu Trigger */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1ECEFA] text-sm font-black text-black shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    {user.name.slice(0, 1).toUpperCase()}
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-56 rounded-2xl border border-white/10 bg-slate-900/90 p-1.5 backdrop-blur-xl shadow-2xl overflow-hidden"
                      >
                        <div className="px-3 py-2.5">
                          <p className="text-xs font-bold text-white uppercase tracking-wider">{user.name}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                          <div className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ${tierTone[user.tier]}`}>
                            {user.tier} Plan
                          </div>
                        </div>
                        <div className="h-px bg-white/5 my-1" />
                        <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="block rounded-lg px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white">Dashboard</Link>
                        <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="block rounded-lg px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white">Settings</Link>
                        <div className="h-px bg-white/5 my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left rounded-lg px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10"
                        >
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="hidden text-sm font-bold text-slate-300 hover:text-white md:block"
                >
                  Sign in
                </Link>
                <Link href="/signup">
                  <motion.button
                    className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-b from-blue-600 to-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg ring-1 ring-blue-400/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center gap-2 tracking-tight">
                      Start free trial
                      <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="grid h-9 w-9 place-items-center rounded-full border border-white/5 bg-white/5 text-slate-300 hover:text-white md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-2 p-6 pt-0 border-t border-white/5 overflow-hidden">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                    <ChevronRight size={14} className="opacity-40" />
                  </Link>
                ))}
                {!isAuthenticated && (
                   <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 flex items-center justify-center rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm font-bold text-slate-300"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
