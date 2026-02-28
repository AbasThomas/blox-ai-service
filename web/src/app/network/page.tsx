'use client';

import { useState } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { PlanTier } from '@nextjs-blox/shared-types';

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
      title="Networking hub"
      description="AI-matched professionals, intro templates, and connection tracking."
      minTier={PlanTier.PRO}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Connections */}
        <div className="space-y-5">
          {[
            { label: 'Suggested connections', items: suggested, emptyMsg: 'No suggestions right now. Check back soon.' },
            { label: `Intro sent (${sent_.length})`, items: sent_, emptyMsg: '' },
            { label: `Connected (${connected.length})`, items: connected, emptyMsg: '' },
          ].filter((s) => s.items.length > 0 || s.label.startsWith('Suggested')).map(({ label, items, emptyMsg }) => (
            <section key={label}>
              <h2 className="text-sm font-bold text-slate-900 mb-3">{label}</h2>
              {items.length === 0 ? (
                <p className="text-sm text-slate-400">{emptyMsg}</p>
              ) : (
                <div className="space-y-3">
                  {items.map((person) => (
                    <div key={person.id} className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
                      selectedPerson?.id === person.id ? 'border-blue-400' : 'border-slate-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {person.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900">{person.name}</p>
                          <p className="text-xs text-slate-500">{person.role} at {person.company}</p>
                          <p className="text-xs text-blue-600 mt-0.5">{person.matchReason}</p>
                          <p className="text-xs text-slate-400">{person.mutualConnections} mutual connections</p>
                        </div>
                        <div className="shrink-0 flex flex-col gap-1.5">
                          {person.status === 'suggested' && (
                            <>
                              <button onClick={() => handleConnect(person.id)}
                                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700">
                                Connect
                              </button>
                              <button onClick={() => handleSelectPerson(person)}
                                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                                Compose intro
                              </button>
                            </>
                          )}
                          {person.status === 'sent' && (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Sent</span>
                          )}
                          {person.status === 'connected' && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Connected</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Intro composer */}
        <aside>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sticky top-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              {selectedPerson ? `Intro to ${selectedPerson.name}` : 'Compose intro'}
            </h3>
            {!selectedPerson ? (
              <p className="text-sm text-slate-400">Select a person to compose a personalised intro message.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Template</label>
                  <select value={templateKey} onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="networking">Networking</option>
                    <option value="job-inquiry">Job inquiry</option>
                    <option value="referral-request">Referral request</option>
                  </select>
                </div>
                <textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                {sent ? (
                  <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                    Intro sent to {selectedPerson.name}!
                  </div>
                ) : (
                  <button onClick={handleSend} disabled={sending}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                    {sending ? 'Sending...' : 'Send intro'}
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </FeaturePage>
  );
}
