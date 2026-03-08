'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { useBloxStore } from '@/lib/store/app-store';
import { authApi, billingApi, integrationsApi } from '@/lib/api';
import { PlanTier } from '@nextjs-blox/shared-types';
import { User, Shield, Link as LinkIcon, CreditCard, Download, Zap, BriefcaseBusiness, ArrowUpRight } from '@/components/ui/icons';

const TABS = ['Account', 'Security', 'Integrations', 'Subscription', 'Export', 'Career'] as const;
type Tab = typeof TABS[number];

interface Integration {
  id: string;
  name: string;
  category: string;
  mode: 'oauth' | 'token' | 'manual';
  scopes: string[];
  priority: 'primary' | 'secondary' | 'optional';
  connected: boolean;
  connectedAt: string | null;
  authUrl: string | null;
  oauthConfigured: boolean;
  missingOauthEnvKeys: string[];
  fallbackMode: boolean;
  setupDocsUrl?: string;
}

interface Subscription {
  tier: string;
  status: string;
  cycle: string;
  currentPeriodEnd: string;
  invoices?: Array<{ id: string; amount: number; currency: string; createdAt: string }>;
}

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  Account: <User size={14} />,
  Security: <Shield size={14} />,
  Integrations: <LinkIcon size={14} />,
  Subscription: <CreditCard size={14} />,
  Export: <Download size={14} />,
  Career: <BriefcaseBusiness size={14} />,
};

const TAB_LABELS: Record<Tab, string> = {
  Account: 'Account',
  Security: 'Security',
  Integrations: 'Integrations',
  Subscription: 'Subscription',
  Export: 'Export',
  Career: 'Career Hub',
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="font-mono text-[11px] uppercase tracking-wide text-[#4E5C6E]">{children}</label>;
}

function Input({ type = 'text', value, onChange, placeholder, readOnly }: {
  type?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className="w-full h-10 rounded border border-[#1B2131] bg-[#0d1018] px-3 text-[13px] text-white placeholder-[#3A4452] outline-none focus:border-[#2A3A50] disabled:opacity-50 transition-colors"
    />
  );
}

function Msg({ text, isError }: { text: string; isError?: boolean }) {
  if (!text) return null;
  return (
    <div className={`rounded border px-3 py-2 text-[12px] ${isError ? 'border-rose-500/20 bg-rose-500/5 text-rose-400' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'}`}>
      {text}
    </div>
  );
}

function PrimaryBtn({ type = 'button', disabled, onClick, children }: {
  type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center h-9 px-5 rounded bg-[#1ECEFA] text-[#060810] text-[12px] font-bold hover:bg-[#3DD5FF] disabled:opacity-50 transition-colors"
    >
      {children}
    </button>
  );
}

function GhostBtn({ type = 'button', disabled, onClick, className = '', children }: {
  type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void; className?: string; children: React.ReactNode;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center h-9 px-4 rounded border border-[#1B2131] text-[12px] font-medium text-[#7A8DA0] hover:text-white hover:border-[#2A3A50] disabled:opacity-50 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const user = useBloxStore((s) => s.user);
  const updateUser = useBloxStore((s) => s.updateUser);
  const [activeTab, setActiveTab] = useState<Tab>('Account');

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [mfaSetup, setMfaSetup] = useState<{ qrCode?: string; secret?: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMsg, setMfaMsg] = useState('');

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [integrationMsg, setIntegrationMsg] = useState('');

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState('');

  const loadIntegrations = useCallback(async () => {
    setLoadingIntegrations(true);
    try {
      const data = await integrationsApi.list() as Integration[];
      setIntegrations(data);
    } catch { /* ignore */ } finally { setLoadingIntegrations(false); }
  }, []);

  const loadSubscription = useCallback(async () => {
    setLoadingSub(true);
    try {
      const data = await billingApi.getSubscription() as Subscription;
      setSubscription(data);
    } catch { /* ignore */ } finally { setLoadingSub(false); }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as Tab | null;
    const connected = params.get('connected');
    const errorParam = params.get('error');
    if (tabParam && TABS.includes(tabParam)) setActiveTab(tabParam);
    if (connected) setIntegrationMsg(`${connected} connected successfully.`);
    if (errorParam) setIntegrationMsg(`Connection failed: ${errorParam.replace(/_/g, ' ')}`);
    if (tabParam || connected || errorParam) window.history.replaceState({}, '', '/settings');
  }, []);

  useEffect(() => {
    if (activeTab === 'Integrations') loadIntegrations();
    if (activeTab === 'Subscription') loadSubscription();
  }, [activeTab, loadIntegrations, loadSubscription]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    setAccountMsg('');
    try {
      await authApi.me();
      updateUser({ name, email });
      setAccountMsg('Profile updated successfully.');
    } catch (err) {
      setAccountMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally { setSavingAccount(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match.'); return; }
    if (newPw.length < 8) { setPwMsg('Password must be at least 8 characters.'); return; }
    setSavingPw(true);
    setPwMsg('');
    try {
      await authApi.resetPassword('', newPw);
      setPwMsg('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg(err instanceof Error ? err.message : 'Failed to change password.');
    } finally { setSavingPw(false); }
  };

  const handleSetupMfa = async () => {
    try {
      const data = await authApi.setupMfa() as { qrCode: string; secret: string };
      setMfaSetup(data);
    } catch (err) {
      setMfaMsg(err instanceof Error ? err.message : 'Failed to set up MFA.');
    }
  };

  const handleVerifyMfa = async () => {
    if (mfaCode.length !== 6) { setMfaMsg('Enter the 6-digit code.'); return; }
    try {
      await authApi.verifyMfa(mfaCode, '');
      setMfaMsg('MFA enabled!');
      setMfaSetup(null);
      setMfaCode('');
    } catch (err) {
      setMfaMsg(err instanceof Error ? err.message : 'Invalid code.');
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      await integrationsApi.disconnect(provider);
      setIntegrations((prev) => prev.map((i) => i.id === provider ? { ...i, connected: false } : i));
      setIntegrationMsg('Provider disconnected.');
    } catch { /* ignore */ }
  };

  const handleConnectIntegration = async (provider: string) => {
    setIntegrationMsg('');
    try {
      const res = await integrationsApi.connect(provider) as { authUrl?: string | null; connected?: boolean; message?: string };
      if (res.authUrl) {
        const token = localStorage.getItem('blox_access_token') ?? '';
        if (!token) { setIntegrationMsg('Missing access token. Please sign in again.'); return; }
        const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin;
        const authUrl = new URL(res.authUrl, baseUrl);
        authUrl.searchParams.set('token', token);
        window.location.href = authUrl.toString();
        return;
      }
      if (res.connected) setIntegrations((prev) => prev.map((item) => (item.id === provider ? { ...item, connected: true } : item)));
      if (res.message) setIntegrationMsg(res.message);
    } catch (err) {
      setIntegrationMsg(err instanceof Error ? err.message : 'Failed to connect.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Cancel your subscription? You will remain on the current plan until the period ends.')) return;
    setCancelling(true);
    setCancelMsg('');
    try {
      await billingApi.cancel({ immediate: false });
      setCancelMsg('Subscription cancelled. Your plan remains active until the period ends.');
      await loadSubscription();
    } catch (err) {
      setCancelMsg(err instanceof Error ? err.message : 'Failed to cancel subscription.');
    } finally { setCancelling(false); }
  };

  return (
    <FeaturePage
      title="Settings & Career"
      description="Manage your account, security, integrations, and career tools."
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar nav */}
        <aside className="lg:w-52 shrink-0">
          <div className="lg:sticky lg:top-24">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`group flex items-center gap-2.5 h-9 rounded text-[13px] font-medium transition-colors shrink-0 ${
                    activeTab === tab
                      ? 'bg-[#141C28] text-white pl-3 pr-4'
                      : 'text-[#46566A] hover:text-[#8899AA] pl-3 pr-4'
                  }`}
                >
                  <span className={activeTab === tab ? 'text-[#1ECEFA]' : 'text-[#2E3847] group-hover:text-[#46566A] transition-colors'}>
                    {TAB_ICONS[tab]}
                  </span>
                  <span className="whitespace-nowrap">{TAB_LABELS[tab]}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Account */}
          {activeTab === 'Account' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-[14px] font-semibold text-white">Account Identity</h2>
                <p className="mt-0.5 text-[12px] text-[#4E5C6E]">Update your core profile details.</p>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] p-4 space-y-4">
                  <div className="space-y-1.5">
                    <FieldLabel>Name</FieldLabel>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Email</FieldLabel>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <FieldLabel>Persona</FieldLabel>
                      <div className="h-10 rounded border border-[#1B2131] bg-[#0d1018] px-3 flex items-center">
                        <span className="text-[12px] text-[#7A8DA0]">{user.persona ?? '—'}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Plan Tier</FieldLabel>
                      <div className="h-10 rounded border border-[#1B2131] bg-[#0d1018] px-3 flex items-center">
                        <span className={`text-[12px] font-medium ${user.tier === PlanTier.PRO ? 'text-[#1ECEFA]' : user.tier === PlanTier.FREE ? 'text-[#4E5C6E]' : 'text-violet-400'}`}>
                          {user.tier}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Msg text={accountMsg} isError={!accountMsg.includes('success')} />
                <PrimaryBtn type="submit" disabled={savingAccount}>
                  {savingAccount ? 'Saving...' : 'Save changes'}
                </PrimaryBtn>
              </form>
            </div>
          )}

          {/* Security */}
          {activeTab === 'Security' && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-[14px] font-semibold text-white">Security</h2>
                <p className="mt-0.5 text-[12px] text-[#4E5C6E]">Change your password and set up two-factor auth.</p>
              </div>

              <form onSubmit={handleChangePassword} className="rounded-md border border-[#1B2131] bg-[#0B0E14] p-4 space-y-4">
                <p className="text-[13px] font-medium text-white">Change Password</p>
                <div className="space-y-1.5">
                  <FieldLabel>Current Password</FieldLabel>
                  <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel>New Password</FieldLabel>
                    <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Confirm</FieldLabel>
                    <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                  </div>
                </div>
                <Msg text={pwMsg} isError={!pwMsg.includes('success')} />
                <GhostBtn type="submit" disabled={savingPw}>
                  {savingPw ? 'Updating...' : 'Update password'}
                </GhostBtn>
              </form>

              <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] p-4 space-y-4">
                <p className="text-[13px] font-medium text-white">Two-Factor Authentication</p>
                {!mfaSetup ? (
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-[#4E5C6E] max-w-xs">Add a TOTP authenticator for extra account security.</p>
                    <GhostBtn onClick={handleSetupMfa}>Set up 2FA</GhostBtn>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-6">
                      <div className="rounded border border-[#1B2131] p-2 bg-white inline-block">
                        <img src={mfaSetup.qrCode} alt="MFA QR code" className="h-32 w-32 object-contain" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <FieldLabel>Manual key</FieldLabel>
                          <code className="block rounded border border-[#1B2131] bg-[#0d1018] px-3 py-2 font-mono text-[11px] text-[#1ECEFA] select-all">
                            {mfaSetup.secret}
                          </code>
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel>Verify token</FieldLabel>
                          <div className="flex gap-2">
                            <input
                              value={mfaCode}
                              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              className="flex-1 h-10 rounded border border-[#1B2131] bg-[#0d1018] px-3 font-mono text-center text-[14px] tracking-[0.2em] text-white outline-none focus:border-[#2A3A50] transition-colors"
                            />
                            <PrimaryBtn onClick={handleVerifyMfa}>Verify</PrimaryBtn>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <Msg text={mfaMsg} isError={!mfaMsg.includes('success') && !mfaMsg.includes('enabled')} />
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === 'Integrations' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-white">Connected Integrations</h2>
                  <p className="mt-0.5 text-[12px] text-[#4E5C6E]">Link external services to sync your career data.</p>
                </div>
                <div className="flex items-center gap-1.5 rounded border border-[#1B2131] px-2.5 py-1.5">
                  <Shield size={11} className="text-[#1ECEFA]" />
                  <span className="text-[11px] text-[#4E5C6E]">Privacy active</span>
                </div>
              </div>

              {integrationMsg && (
                <div className="rounded border border-[#1ECEFA]/20 bg-[#1ECEFA]/5 px-3 py-2 text-[12px] text-[#1ECEFA]">
                  {integrationMsg}
                </div>
              )}

              {loadingIntegrations ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-40 animate-pulse rounded-md border border-[#1B2131] bg-[#0B0E14]" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className={`rounded-md border p-4 flex flex-col gap-3 ${
                        integration.connected ? 'border-emerald-500/20 bg-[#0B0E14]' : 'border-[#1B2131] bg-[#0B0E14]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-[13px] font-semibold text-white">{integration.name}</h3>
                          <p className="mt-0.5 font-mono text-[10px] text-[#4E5C6E] uppercase">{integration.category}</p>
                        </div>
                        <span className={`h-1.5 w-1.5 rounded-full mt-1.5 ${integration.connected ? 'bg-emerald-500' : 'bg-[#2E3847]'}`} />
                      </div>

                      <div className="text-[11px] text-[#4E5C6E] space-y-0.5">
                        <p>Mode: <span className="text-[#7A8DA0]">{integration.mode}</span></p>
                        {integration.mode === 'oauth' && !integration.oauthConfigured && (
                          <p className="text-amber-400">Missing env credentials</p>
                        )}
                      </div>

                      {integration.connected ? (
                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          className="mt-auto inline-flex w-full items-center justify-center h-7 rounded border border-rose-500/20 text-[11px] text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : integration.mode === 'manual' ? (
                        <div className="mt-auto text-center text-[11px] text-[#3A4452]">Manual import only</div>
                      ) : (
                        <div className="mt-auto space-y-1.5">
                          <button
                            onClick={() => handleConnectIntegration(integration.id)}
                            className="inline-flex w-full items-center justify-center h-7 rounded bg-[#1ECEFA] text-[#060810] text-[11px] font-bold hover:bg-[#3DD5FF] transition-colors"
                          >
                            Connect
                          </button>
                          {integration.mode === 'oauth' && !integration.oauthConfigured && integration.setupDocsUrl && (
                            <a
                              href={integration.setupDocsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              Setup guide <ArrowUpRight size={9} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subscription */}
          {activeTab === 'Subscription' && (
            <div className="max-w-lg space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-white">Subscription</h2>
                <p className="mt-0.5 text-[12px] text-[#4E5C6E]">View and manage your active plan.</p>
              </div>

              {loadingSub ? (
                <div className="h-48 animate-pulse rounded-md border border-[#1B2131] bg-[#0B0E14]" />
              ) : subscription ? (
                <div className="space-y-4">
                  <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
                    <div className="relative px-5 py-5">
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1ECEFA]" />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-[11px] text-[#4E5C6E] uppercase">Active plan</p>
                          <p className="mt-1 text-2xl font-bold text-white">{subscription.tier}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-[#4E5C6E]">{subscription.cycle} cycle</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium ${
                            subscription.status === 'ACTIVE' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${subscription.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {subscription.status}
                          </span>
                          <p className="mt-1.5 text-[11px] text-[#4E5C6E]">
                            Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {subscription.invoices && subscription.invoices.length > 0 && (
                      <div className="border-t border-[#1B2131]">
                        <p className="px-4 py-2.5 font-mono text-[10px] uppercase text-[#3A4452] tracking-wide border-b border-[#1B2131]">Invoice history</p>
                        {subscription.invoices.slice(0, 5).map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#1B2131] last:border-b-0 hover:bg-[#0d1018] transition-colors">
                            <span className="text-[12px] text-[#7A8DA0]">{new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="font-mono text-[12px] text-white">{inv.currency} {(inv.amount / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Msg text={cancelMsg} isError={!cancelMsg.includes('cancelled')} />

                  <div className="flex gap-2">
                    <PrimaryBtn onClick={() => window.location.href = '/pricing'}>Upgrade Plan</PrimaryBtn>
                    {subscription.status === 'ACTIVE' && user.tier !== PlanTier.FREE && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelling}
                        className="inline-flex items-center justify-center h-9 px-4 rounded border border-rose-500/20 text-rose-400 text-[12px] font-medium hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
                      >
                        {cancelling ? 'Processing...' : 'Cancel subscription'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#1B2131] p-12 text-center gap-3">
                  <Shield size={22} className="text-[#2E3847]" />
                  <p className="text-[13px] font-medium text-[#8899AA]">No active subscription</p>
                  <p className="text-[12px] text-[#4E5C6E]">Currently on free tier.</p>
                  <GhostBtn onClick={() => window.location.href = '/pricing'}>View Plans</GhostBtn>
                </div>
              )}
            </div>
          )}

          {/* Export */}
          {activeTab === 'Export' && (
            <div className="max-w-lg space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-white">Data Export</h2>
                <p className="mt-0.5 text-[12px] text-[#4E5C6E]">Download your data in various formats.</p>
              </div>

              <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] overflow-hidden">
                {[
                  { id: 'json', label: 'JSON Metadata', desc: 'Structured data for all your assets.' },
                  { id: 'pdf', label: 'PDF Export', desc: 'Print-ready compiled asset output.' },
                  { id: 'docx', label: 'DOCX Export', desc: 'Word-compatible format.' },
                ].map((opt, i) => (
                  <div key={opt.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-[#1B2131]' : ''}`}>
                    <div>
                      <p className="text-[13px] font-medium text-white">{opt.label}</p>
                      <p className="text-[11px] text-[#4E5C6E]">{opt.desc}</p>
                    </div>
                    <button className="flex h-8 w-8 items-center justify-center rounded border border-[#1B2131] text-[#4E5C6E] hover:text-white hover:border-[#2A3A50] transition-colors">
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-md border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
                <p className="text-[13px] font-semibold text-rose-400">Danger Zone</p>
                <p className="text-[12px] text-rose-400/60">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
                <button className="inline-flex items-center h-8 px-4 rounded border border-rose-500/30 text-rose-400 text-[12px] font-medium hover:bg-rose-500/10 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Career Hub */}
          {activeTab === 'Career' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[14px] font-semibold text-white">Career Hub</h2>
                <p className="mt-0.5 text-[12px] text-[#4E5C6E]">Advanced tools to optimize your professional trajectory.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { title: 'Career Coach', desc: 'Personalized guidance and progress tracking.', href: '/coach', icon: <User size={16} /> },
                  { title: 'Job Matching', desc: 'Align your assets to openings.', href: '/jobs', icon: <BriefcaseBusiness size={16} /> },
                  { title: 'Mock Interview', desc: 'Practice rounds with real-time feedback.', href: '/interview', icon: <Shield size={16} /> },
                  { title: 'Networking', desc: 'Manage outreach and connections.', href: '/network', icon: <LinkIcon size={16} /> },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="group rounded-md border border-[#1B2131] bg-[#0B0E14] p-4 hover:border-[#2A3A50] transition-colors flex gap-3"
                  >
                    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded border border-[#1B2131] text-[#4E5C6E] group-hover:text-[#1ECEFA] group-hover:border-[#1ECEFA]/30 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white group-hover:text-[#1ECEFA] transition-colors">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-[#4E5C6E]">{item.desc}</p>
                    </div>
                    <ArrowUpRight size={12} className="ml-auto self-start mt-0.5 text-[#2E3847] group-hover:text-[#4E5C6E] transition-colors shrink-0" />
                  </a>
                ))}
              </div>

              <div className="rounded-md border border-[#1B2131] bg-[#0B0E14] p-4 flex items-center gap-4">
                <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded border border-[#1ECEFA]/20 bg-[#1ECEFA]/5 text-[#1ECEFA]">
                  <Zap size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white">Career Roadmap</p>
                  <p className="text-[11px] text-[#4E5C6E]">Complete more assets to unlock personalized milestones.</p>
                </div>
                <div className="w-32 shrink-0">
                  <div className="h-[3px] rounded-full bg-[#1B2131]">
                    <div className="h-[3px] rounded-full bg-[#1ECEFA] w-1/3" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  );
}
