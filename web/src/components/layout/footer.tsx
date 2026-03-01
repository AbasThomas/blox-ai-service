import Link from 'next/link';
import { Bot, Twitter, Github, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative  border-white/10 bg-[#0C0F13] pt-24 pb-12 overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      
      {/* Top subtle gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1ECEFA]/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 hover:opacity-90 transition-opacity">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#1ECEFA] backdrop-blur-md shadow-[0_0_15px_rgba(30,206,250,0.2)]">
                <Bot size={22} />
              </span>
              <span className="font-display font-black text-2xl tracking-tighter text-white">
                BLOX<span className="text-[#1ECEFA]">.</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400 mb-8">
              The AI-driven portfolio builder for the modern professional. Build, snap, and deploy your professional identity with physical weight and digital precision.
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a 
                  key={i}
                  href="#" 
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-[#1ECEFA]/50 hover:bg-[#1ECEFA]/10 hover:text-[#1ECEFA] hover:shadow-[0_0_15px_rgba(30,206,250,0.3)]"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-1">
            <h4 className="mb-6 font-display text-sm font-bold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-4">
              {['Features', 'Integrations', 'Pricing', 'Changelog', 'Templates'].map(link => (
                <li key={link}>
                  <Link href="#" className="text-sm text-slate-400 transition-colors hover:text-[#1ECEFA]">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="mb-6 font-display text-sm font-bold uppercase tracking-wider text-white">Resources</h4>
            <ul className="space-y-4">
              {['Documentation', 'Community', 'Careers Directory', 'Blog', 'Help Center'].map(link => (
                <li key={link}>
                  <Link href="#" className="text-sm text-slate-400 transition-colors hover:text-[#1ECEFA]">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="mb-6 font-display text-sm font-bold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
                <li key={link}>
                  <Link href="#" className="text-sm text-slate-400 transition-colors hover:text-[#1ECEFA]">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 flex flex-col items-center justify-between border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Blox, Inc. All rights reserved.
          </p>
          <div className="mt-4 flex items-center gap-6 sm:mt-0">
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
