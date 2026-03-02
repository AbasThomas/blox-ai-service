'use client';

import { useState } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { PlanTier } from '@nextjs-blox/shared-types';
import { Users, UserPlus, Mail, MessageSquare, Check, Zap, ArrowUpRight, Globe, Shield, Search, Send } from '@/components/ui/icons';

interface Connection {
  id: string;
  name: string;
  role: string;
  company: string;
  matchReason: string;
  mutualConnections: number;
  avatar?: string;
  status: 'suggested' | 'sent' | 'connected';
}

const MOCK_CONNECTIONS: Connection[] = [
  { id: '1', name: 'Sarah Chen', role: 'Engineering Manager', company: 'Stripe', matchReason: 'Works in your target industry', mutualConnections: 3, status: 'suggested' },
  { id: '2', name: 'Marcus Johnson', role: 'Senior SWE', company: 'Vercel', matchReason: 'Similar skills: TypeScript, React', mutualConnections: 5, status: 'suggested' },
  { id: '3', name: 'Priya Nair', role: 'Product Manager', company: 'Linear', matchReason: 'Hiring in your target role area', mutualConnections: 1, status: 'sent' },
  { id: '4', name: 'James Okafor', role: 'DevRel Engineer', company: 'Supabase', matchReason: 'Open source contributor match', mutualConnections: 8, status: 'connected' },
];

const INTRO_TEMPLATES: Record<string, string> = {
  'job-inquiry': "Hi {name},\n\nI came across your profile and was impressed by your work at {company}. I'm currently exploring opportunities in {role} and would love to connect and learn from your experience.\n\nWould you be open to a 15-minute chat?\n\nBest,\n[Your name]",
  'networking': "Hi {name},\n\nI see we share a passion for {skill}. I've been following {company}'s work closely and think there's a lot of overlap with what I've been building.\n\nWould love to connect and exchange ideas.\n\nBest,\n[Your name]",
  'referral-request': "Hi {name},\n\nI'm reaching out because I'm applying to {company} and noticed you work there. I'd love to hear about your experience and, if my background seems like a good fit, whether you'd be comfortable referring me.\n\nBest,\n[Your name]",
};

export default function NetworkPage() {
  const [connections, setConnections] = useState(MOCK_CONNECTIONS);
  const [selectedPerson, setSelectedPerson] = useState<Connection | null>(null);
  const [message, setMessage] = useState('');
  const [templateKey, setTemplateKey] = useState('networking');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleConnect = (id: string) => {
    setConnections((prev) => prev.map((c) => c.id === id ? { ...c, status: 'sent' } : c));
  };

  const handleSelectPerson = (person: Connection) => {
    setSelectedPerson(person);
    setMessage(INTRO_TEMPLATES[templateKey]
      .replace('{name}', person.name.split(' ')[0])
      .replace('{company}', person.company)
      .replace('{role}', person.role)
      .replace('{skill}', 'TypeScript'));
    setSent(false);
  };

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    if (selectedPerson) {
      setMessage(INTRO_TEMPLATES[key]
        .replace('{name}', selectedPerson.name.split(' ')[0])
        .replace('{company}', selectedPerson.company)
        .replace('{role}', selectedPerson.role)
        .replace('{skill}', 'TypeScript'));
    }
  };

  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000)); // Simulated send
    setSending(false);
    setSent(true);
    if (selectedPerson) {
      setConnections((prev) => prev.map((c) => c.id === selectedPerson.id ? { ...c, status: 'sent' } : c));
    }
  };

  const suggested = connections.filter((c) => c.status === 'suggested');
  const sent_ = connections.filter((c) => c.status === 'sent');
  const connected = connections.filter((c) => c.status === 'connected');

  return (
    <FeaturePage
      title="Networking Hub"
      description="Strategically expand your professional reach through AI-matched node discovery."
      minTier={PlanTier.PRO}
      headerIcon={<Users className="h-6 w-6" />}
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_420px] animate-in fade-in duration-500">
        {/* Connection discovery nodes */}
        <div className="space-y-10">
          {[
            { label: 'Strategic Suggestions', items: suggested, emptyMsg: 'Discovery nodes synchronized. No new matches detected.' },
            { label: `Active Outbound (${sent_.length})`, items: sent_, emptyMsg: '' },
            { label: `Established Links (${connected.length})`, items: connected, emptyMsg: '' },
          ].filter((s) => s.items.length > 0 || s.label.startsWith('Strategic')).map(({ label, items, emptyMsg }) => (
            <section key={label} className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1ECEFA] px-2">{label}</h2>
              {items.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-white/5 bg-black/20 p-10 text-center">
                  <p className="text-xs text-slate-600 uppercase tracking-widest italic">{emptyMsg}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {items.map((person) => (
                    <div 
                      key={person.id} 
                      className={`group relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 ${
                        selectedPerson?.id === person.id 
                          ? 'border-[#1ECEFA] bg-[#1ECEFA]/5 shadow-xl' 
                          : 'border-white/10 bg-black/40 hover:border-white/20 shadow-lg'
                      }`}
                    >
                      <div className="relative z-10 flex items-start gap-6">
                        <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-[#1ECEFA]/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xl font-black text-white group-hover:scale-105 transition-transform">
                          {person.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-black text-white tracking-tight uppercase group-hover:text-[#1ECEFA] transition-colors">{person.name}</h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>{person.role}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-800" />
                            <span>{person.company}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Zap className="h-2.5 w-2.5 fill-current" /> {person.matchReason}
                            </span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{person.mutualConnections} Mutual Nodes</span>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col gap-2">
                          {person.status === 'suggested' && (
                            <>
                              <button 
                                onClick={() => handleConnect(person.id)}
                                className="rounded-xl bg-white px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-[0_0_15px_rgba(30,206,250,0.4)] active:scale-95"
                              >
                                Connect
                              </button>
                              <button 
                                onClick={() => handleSelectPerson(person)}
                                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                              >
                                Intro
                              </button>
                            </>
                          )}
                          {person.status === 'sent' && (
                            <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                              <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                              Transmitting
                            </div>
                          )}
                          {person.status === 'connected' && (
                            <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1.5">
                              <Check className="h-2.5 w-2.5" />
                              Linked
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Background glow on hover */}
                      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-[#1ECEFA]/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Intro Composer Hub */}
        <aside className="lg:sticky lg:top-10 h-fit">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-24 bg-[#1ECEFA]/20 rounded-full blur-[2px]" />
            
            <div className="relative z-10 space-y-8">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  {selectedPerson ? `Link to ${selectedPerson.name.split(' ')[0]}` : 'Intro Composer'}
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Advanced Transmission Module</p>
              </div>

              {!selectedPerson ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-16 w-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-700">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <p className="text-xs text-slate-600 max-w-[200px] leading-relaxed italic uppercase tracking-wider font-bold">Select a target node to initialize message synthesis.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-1">Protocol Template</label>
                    <div className="relative group">
                      <select 
                        value={templateKey} 
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 focus:border-[#1ECEFA]/50 focus:outline-none transition-all appearance-none"
                      >
                        <option value="networking">Standard Link</option>
                        <option value="job-inquiry">Job Alignment</option>
                        <option value="referral-request">Strategic Referral</option>
                      </select>
                      <ArrowUpRight className="absolute right-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-1">Message Content</label>
                    <textarea 
                      rows={10} 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs text-white placeholder-slate-600 focus:border-[#1ECEFA]/50 focus:outline-none transition-all resize-none font-medium leading-relaxed" 
                    />
                  </div>

                  {sent ? (
                    <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-center animate-in zoom-in-95 duration-300">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Transmission Successful to {selectedPerson.name.split(' ')[0]}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={handleSend} 
                      disabled={sending}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-[0_0_20px_rgba(30,206,250,0.4)] active:scale-95 disabled:opacity-50"
                    >
                      {sending ? 'Transmitting...' : 'Initiate Transmission'} <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </FeaturePage>
  );
}
