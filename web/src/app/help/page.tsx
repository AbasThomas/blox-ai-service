'use client';

import { useState } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';

const FAQ_ITEMS = [
  {
    category: 'Getting started',
    questions: [
      { q: 'How fast is AI asset generation?', a: 'Target P95 generation latency is under 120 seconds. Most portfolios are ready in 30–60 seconds.' },
      { q: 'What types of assets can I create?', a: 'Blox supports portfolios, resumes/CVs, and cover letters. Each can be generated, edited, and published independently.' },
      { q: 'Can I import data from LinkedIn or GitHub?', a: 'Yes. Connect your accounts in Settings → Integrations. We import your experience, repos, skills, and projects automatically.' },
    ],
  },
  {
    category: 'ATS & Scanner',
    questions: [
      { q: 'How does ATS optimisation work?', a: 'Our scanner compares your asset against job descriptions keyword-by-keyword, checking contact info, sections, action verbs, and quantified achievements.' },
      { q: 'What is a good ATS score?', a: 'Scores above 70% indicate a well-optimised asset. Aim for 80%+ for competitive roles.' },
      { q: 'Can the scanner auto-tailor my resume?', a: 'Yes. After scanning, click "Create tailored version" to duplicate and optimise your asset for that specific job.' },
    ],
  },
  {
    category: 'Publishing & domains',
    questions: [
      { q: 'How do I publish my portfolio?', a: 'Go to the editor, click "Preview & publish", choose your subdomain, and hit Publish. Your portfolio will be live at subdomain.blox.app.' },
      { q: 'Can I use a custom domain?', a: 'Yes, on Pro and above. Add a CNAME record pointing to blox.app, then configure it in Publish settings.' },
      { q: 'How long does publishing take?', a: 'Publishing typically completes within 30 seconds. SSL provisioning may take up to 2 minutes.' },
    ],
  },
  {
    category: 'Billing',
    questions: [
      { q: 'Can I cancel anytime?', a: 'Yes. Cancel from Settings → Subscription. Your plan remains active until the current period ends — no partial refunds.' },
      { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards and bank transfers via Paystack.' },
      { q: 'Is there a free trial?', a: 'All new accounts start with a 7-day Pro trial. No credit card required.' },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [openItem, setOpenItem] = useState<string | null>(null);

  const filtered = FAQ_ITEMS.map((cat) => ({
    ...cat,
    questions: cat.questions.filter((q) =>
      !search || q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0);

  return (
    <FeaturePage title="Help &amp; FAQ" description="Find answers, browse docs, or contact our support team.">
      {/* Search */}
      <div className="max-w-xl mb-8">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search help topics..."
          className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Quick links */}
      {!search && (
        <div className="grid gap-3 sm:grid-cols-4 mb-8">
          {[
            { label: 'Getting started guide', icon: '🚀', href: '#getting-started' },
            { label: 'Video tutorials', icon: '🎬', href: '#' },
            { label: 'API documentation', icon: '📖', href: '#' },
            { label: 'Status page', icon: '✅', href: '#' },
          ].map((link) => (
            <a key={link.label} href={link.href}
              className="rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-slate-300 hover:shadow-sm transition-all">
              <p className="text-2xl mb-1">{link.icon}</p>
              <p className="text-xs font-medium text-slate-700">{link.label}</p>
            </a>
          ))}
        </div>
      )}

      {/* FAQ */}
      <div className="space-y-6">
        {filtered.map((cat) => (
          <div key={cat.category} id={cat.category.toLowerCase().replace(/\s/g, '-')}>
            <h2 className="text-base font-bold text-slate-900 mb-3">{cat.category}</h2>
            <div className="space-y-2">
              {cat.questions.map((item) => {
                const key = `${cat.category}-${item.q}`;
                const open = openItem === key;
                return (
                  <div key={item.q} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <button onClick={() => setOpenItem(open ? null : key)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                      <span className="shrink-0 text-slate-400 text-lg leading-none">{open ? '−' : '+'}</span>
                    </button>
                    {open && (
                      <div className="px-5 pb-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm">No results for &quot;{search}&quot;. Try different keywords.</p>
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">Still need help?</h3>
        <p className="text-sm text-slate-500 mb-4">Our support team typically responds within 4 hours.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:support@blox.app"
            className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
            Email support
          </a>
          <a href="https://github.com/blox-app/issues" target="_blank" rel="noopener noreferrer"
            className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            GitHub issues
          </a>
        </div>
      </div>
    </FeaturePage>
  );
}
