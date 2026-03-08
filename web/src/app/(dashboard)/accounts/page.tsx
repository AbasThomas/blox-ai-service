'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { integrationsApi } from '@/lib/api';
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  ShieldCheck,
  X,
  Zap,
} from '@/components/ui/icons';

interface ConnectedAccount {
  id: string;
  name: string;
  category: string;
  mode: 'oauth' | 'token' | 'manual';
  scopes: string[];
  priority: 'primary' | 'secondary' | 'optional';
  connected: boolean;
  authUrl: string | null;
  oauthConfigured?: boolean;
  oauthEnvKeys?: string[];
  missingOauthEnvKeys?: string[];
  setupDocsUrl?: string | null;
  connectedAt?: string | null;
  updatedAt?: string | null;
}

interface ConnectResponse {
  authUrl?: string | null;
  connected?: boolean;
  message?: string;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function callbackUrlFor(provider: string) {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333').replace(/\/$/, '');
  return `${apiBase}/v1/auth/oauth/${provider}/callback`;
}

const CATEGORY_DOT: Record<string, string> = {
  professional: 'bg-blue-400',
  developer: 'bg-indigo-400',
  freelance: 'bg-[#1ECEFA]',
  creative: 'bg-rose-400',
  education: 'bg-amber-400',
  productivity: 'bg-emerald-400',
};

export default function ConnectedAccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [connectLoading, setConnectLoading] = useState<string | null>(null);
  const [disconnectLoading, setDisconnectLoading] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await integrationsApi.list() as ConnectedAccount[];
      setAccounts(data);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to load connected accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const connectedAccounts = useMemo(() => accounts.filter((a) => a.connected), [accounts]);
  const availableAccounts = useMemo(() => accounts.filter((a) => !a.connected), [accounts]);

  const handleConnect = async (provider: string) => {
    setConnectLoading(provider);
    setFeedback('');
    try {
      const result = await integrationsApi.connect(provider) as ConnectResponse;
      if (result.authUrl) {
        const token = localStorage.getItem('blox_access_token') ?? '';
        if (!token) { setFeedback('Missing access token. Please sign in again.'); return; }
        const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin;
        const authUrl = new URL(result.authUrl, baseUrl);
        authUrl.searchParams.set('token', token);
        window.location.href = authUrl.toString();
        return;
      }
      setAccounts((prev) =>
        prev.map((item) =>
          item.id === provider ? { ...item, connected: result.connected ?? true, connectedAt: new Date().toISOString() } : item,
        ),
      );
      setFeedback(result.message ?? 'Account connected.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to connect account.');
    } finally {
      setConnectLoading(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setDisconnectLoading(provider);
    setFeedback('');
    try {
      await integrationsApi.disconnect(provider);
      setAccounts((prev) => prev.map((item) => (item.id === provider ? { ...item, connected: false } : item)));
      setFeedback('Account disconnected.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to disconnect account.');
    } finally {
      setDisconnectLoading(null);
    }
  };

  return (
    <FeaturePage
      title="Connected Accounts"
      description="Manage professional account links — LinkedIn, GitHub, Figma, and more."
    >
      <div className="space-y-8">
        {/* Stat row */}
        <div className="grid gap-px sm:grid-cols-3 bg-[#1B2131] border border-[#1B2131] rounded-md overflow-hidden">
          {[
            { label: 'Total providers', value: accounts.length, accent: 'bg-[#4E5C6E]' },
            { label: 'Connected', value: connectedAccounts.length, accent: 'bg-emerald-500' },
            { label: 'Available', value: availableAccounts.length, accent: 'bg-[#2E3847]' },
          ].map((s) => (
            <div key={s.label} className="relative bg-[#0B0E14] px-5 py-4">
              <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${s.accent}`} />
              <p className="font-mono text-[11px] text-[#4E5C6E] uppercase tracking-wide">{s.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-white tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        {feedback && (
          <div className="rounded border border-[#1ECEFA]/20 bg-[#1ECEFA]/5 px-3 py-2 text-[12px] text-[#1ECEFA]">
            {feedback}
          </div>
        )}

        {/* Connected */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <h2 className="text-[13px] font-semibold text-white">Connected</h2>
          </div>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-md border border-[#1B2131] bg-[#0B0E14]" />
              ))}
            </div>
          ) : connectedAccounts.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#1B2131] p-8 text-center text-[13px] text-[#4E5C6E]">
              No accounts connected yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {connectedAccounts.map((account) => (
                <article key={account.id} className="rounded-md border border-emerald-500/20 bg-[#0B0E14] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">{account.name}</h3>
                      <p className="mt-0.5 font-mono text-[10px] text-[#4E5C6E] uppercase">{account.id}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      <CheckCircle2 size={10} /> linked
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[account.category] ?? 'bg-[#4E5C6E]'}`} />
                    <span className="text-[11px] text-[#7A8DA0]">{account.category}</span>
                    <span className="text-[11px] text-[#3A4452]">·</span>
                    <span className="text-[11px] text-[#4E5C6E]">{account.mode}</span>
                  </div>

                  <p className="text-[11px] text-[#3A4452]">Since {formatDate(account.connectedAt ?? account.updatedAt)}</p>

                  <button
                    type="button"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnectLoading === account.id}
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 h-8 rounded border border-rose-500/20 text-rose-400 text-[11px] font-medium hover:bg-rose-500/10 disabled:opacity-60 transition-colors"
                  >
                    <X size={11} />
                    {disconnectLoading === account.id ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Available */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E3847]" />
            <h2 className="text-[13px] font-semibold text-white">Available</h2>
          </div>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-md border border-[#1B2131] bg-[#0B0E14]" />
              ))}
            </div>
          ) : availableAccounts.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#1B2131] p-8 text-center text-[13px] text-[#4E5C6E]">
              All accounts are already connected.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {availableAccounts.map((account) => (
                <article key={account.id} className="rounded-md border border-[#1B2131] bg-[#0B0E14] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-[14px] font-semibold text-white">{account.name}</h3>
                      <p className="mt-0.5 font-mono text-[10px] text-[#4E5C6E] uppercase">{account.id}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded border border-[#1B2131] px-1.5 py-0.5 text-[10px] text-[#4E5C6E]">
                      <LinkIcon size={10} /> not linked
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[account.category] ?? 'bg-[#4E5C6E]'}`} />
                    <span className="text-[11px] text-[#7A8DA0]">{account.category}</span>
                    <span className="text-[11px] text-[#3A4452]">·</span>
                    <span className="text-[11px] text-[#4E5C6E]">{account.mode}</span>
                    <span className="text-[11px] text-[#3A4452]">·</span>
                    <span className="text-[11px] text-[#4E5C6E]">{account.priority}</span>
                  </div>

                  {account.scopes.length > 0 && (
                    <p className="text-[11px] text-[#3A4452] mb-3">
                      Scopes: {account.scopes.join(', ')}
                    </p>
                  )}

                  {account.mode === 'oauth' ? (
                    <div className="rounded border border-amber-500/15 bg-amber-500/5 p-2.5 mb-3">
                      <p className="text-[11px] font-medium text-amber-400 mb-1.5">OAuth credentials required</p>
                      <div className="flex flex-wrap gap-1">
                        {(account.oauthEnvKeys ?? []).map((key) => (
                          <span key={`${account.id}-${key}`} className="font-mono text-[10px] text-amber-300/70 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                            {key}
                          </span>
                        ))}
                      </div>
                      {account.oauthConfigured === false ? (
                        <p className="mt-1.5 text-[10px] text-amber-300/70">
                          Missing: {(account.missingOauthEnvKeys ?? []).join(', ')}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-[10px] text-emerald-400/70">Credentials configured.</p>
                      )}
                      <p className="mt-1.5 text-[10px] text-[#3A4452] break-all">
                        Callback: {callbackUrlFor(account.id)}
                      </p>
                      {account.setupDocsUrl && (
                        <a
                          href={account.setupDocsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#1ECEFA] hover:text-white transition-colors"
                        >
                          Setup guide <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="rounded border border-[#1B2131] bg-[#0d1018] p-2.5 mb-3">
                      <p className="text-[11px] text-[#4E5C6E]">
                        No client credentials needed. Use fallback profile import.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleConnect(account.id)}
                    disabled={connectLoading === account.id}
                    className="inline-flex w-full items-center justify-center gap-1.5 h-8 rounded bg-[#1ECEFA] text-[#060810] text-[11px] font-bold hover:bg-[#3DD5FF] disabled:opacity-60 transition-colors"
                  >
                    {connectLoading === account.id ? (
                      <><Zap size={11} /> Connecting...</>
                    ) : (
                      <>Connect <ArrowUpRight size={11} /></>
                    )}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </FeaturePage>
  );
}
