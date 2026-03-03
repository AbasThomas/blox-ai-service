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

const CATEGORY_STYLES: Record<string, string> = {
  professional: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  developer: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  freelance: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  creative: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  education: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  productivity: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
};

const PRIORITY_STYLES: Record<string, string> = {
  primary: 'text-[#1ECEFA]',
  secondary: 'text-slate-300',
  optional: 'text-slate-500',
};

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function callbackUrlFor(provider: string) {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333').replace(/\/$/, '');
  return `${apiBase}/v1/auth/oauth/${provider}/callback`;
}

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

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const connectedAccounts = useMemo(
    () => accounts.filter((account) => account.connected),
    [accounts],
  );
  const availableAccounts = useMemo(
    () => accounts.filter((account) => !account.connected),
    [accounts],
  );

  const handleConnect = async (provider: string) => {
    setConnectLoading(provider);
    setFeedback('');
    try {
      const result = await integrationsApi.connect(provider) as ConnectResponse;
      if (result.authUrl) {
        const token = localStorage.getItem('blox_access_token') ?? '';
        if (!token) {
          setFeedback('Missing access token. Please sign in again.');
          return;
        }
        const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin;
        const authUrl = new URL(result.authUrl, baseUrl);
        authUrl.searchParams.set('token', token);
        window.location.href = authUrl.toString();
        return;
      }

      setAccounts((prev) =>
        prev.map((item) =>
          item.id === provider
            ? { ...item, connected: result.connected ?? true, connectedAt: new Date().toISOString() }
            : item,
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
      setAccounts((prev) =>
        prev.map((item) => (item.id === provider ? { ...item, connected: false } : item)),
      );
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
      description="Review and manage professional account links like LinkedIn, Upwork, GitHub, and more."
      headerIcon={<ShieldCheck className="h-6 w-6" />}
    >
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Providers</p>
            <p className="mt-2 text-2xl font-black text-white">{accounts.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Connected</p>
            <p className="mt-2 text-2xl font-black text-white">{connectedAccounts.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Available</p>
            <p className="mt-2 text-2xl font-black text-white">{availableAccounts.length}</p>
          </div>
        </div>

        {feedback ? (
          <div className="rounded-2xl border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-4 py-3 text-sm font-semibold text-[#1ECEFA]">
            {feedback}
          </div>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
            Connected Accounts
          </h2>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
              ))}
            </div>
          ) : connectedAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-slate-500">
              No accounts connected yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {connectedAccounts.map((account) => (
                <article
                  key={account.id}
                  className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-white">{account.name}</h3>
                      <p className="mt-1 text-xs text-slate-400 uppercase tracking-wider">{account.id}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> linked
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_STYLES[account.category] ?? 'border-white/20 bg-white/5 text-slate-300'}`}>
                      {account.category}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${PRIORITY_STYLES[account.priority] ?? 'text-slate-400'}`}>
                      {account.priority}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {account.mode}
                    </span>
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    Connected on {formatDate(account.connectedAt ?? account.updatedAt)}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnectLoading === account.id}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    {disconnectLoading === account.id ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
            Available Accounts
          </h2>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-52 animate-pulse rounded-2xl border border-white/10 bg-black/20" />
              ))}
            </div>
          ) : availableAccounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-slate-500">
              All available accounts are already connected.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {availableAccounts.map((account) => (
                <article key={account.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-white">{account.name}</h3>
                      <p className="mt-1 text-xs text-slate-400 uppercase tracking-wider">{account.id}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <LinkIcon className="h-3.5 w-3.5" /> not linked
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_STYLES[account.category] ?? 'border-white/20 bg-white/5 text-slate-300'}`}>
                      {account.category}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${PRIORITY_STYLES[account.priority] ?? 'text-slate-400'}`}>
                      {account.priority}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {account.mode}
                    </span>
                  </div>

                  {account.scopes.length > 0 ? (
                    <p className="mt-3 text-[11px] text-slate-500">
                      Scopes: {account.scopes.join(', ')}
                    </p>
                  ) : (
                    <p className="mt-3 text-[11px] text-slate-500">No scopes required for this provider.</p>
                  )}

                  {account.mode === 'oauth' ? (
                    <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                        OAuth App Fields
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(account.oauthEnvKeys ?? []).map((key) => (
                          <span
                            key={`${account.id}-${key}`}
                            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-200"
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                      {account.oauthConfigured === false ? (
                        <p className="mt-2 text-[11px] text-amber-200/90">
                          Missing: {(account.missingOauthEnvKeys ?? []).join(', ')}
                        </p>
                      ) : (
                        <p className="mt-2 text-[11px] text-emerald-300/90">
                          Credentials configured in backend environment.
                        </p>
                      )}
                      <p className="mt-2 break-all text-[11px] text-slate-400">
                        Callback URL: {callbackUrlFor(account.id)}
                      </p>
                      {account.setupDocsUrl ? (
                        <a
                          href={account.setupDocsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#1ECEFA] hover:text-white"
                        >
                          Open provider setup guide
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-slate-400">
                        No client ID/secret needed. Use fallback profile details in the portfolio import flow.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleConnect(account.id)}
                    disabled={connectLoading === account.id}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black transition-colors hover:bg-[#1ECEFA] disabled:opacity-60"
                  >
                    {connectLoading === account.id ? (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect Account
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </>
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
