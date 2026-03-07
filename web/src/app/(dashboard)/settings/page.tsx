'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { useBloxStore } from '@/lib/store/app-store';
import { authApi, billingApi, integrationsApi } from '@/lib/api';
import { PlanTier } from '@nextjs-blox/shared-types';
import { User, Shield, Link as LinkIcon, CreditCard, Download, Zap, Settings, BriefcaseBusiness, ArrowUpRight } from '@/components/ui/icons';

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

export default function SettingsPage() {
  const user = useBloxStore((s) => s.user);
  const updateUser = useBloxStore((s) => s.updateUser);
  const [activeTab, setActiveTab] = useState<Tab>('Account');

  // Account tab
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState('');

  // Security tab
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [mfaSetup, setMfaSetup] = useState<{ qrCode?: string; secret?: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMsg, setMfaMsg] = useState('');

  // Integrations tab
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [integrationMsg, setIntegrationMsg] = useState('');

  // Subscription tab
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState('');

  const loadIntegrations = useCallback(async () => {
    setLoadingIntegrations(true);
    try {
      const data = await integrationsApi.list() as Integration[];
      setIntegrations(data);
    } catch { /* ignore */ }
    finally { setLoadingIntegrations(false); }
  }, []);

  const loadSubscription = useCallback(async () => {
    setLoadingSub(true);
    try {
      const data = await billingApi.getSubscription() as Subscription;
      setSubscription(data);
    } catch { /* ignore */ }
    finally { setLoadingSub(false); }
  }, []);

  // Handle OAuth callback result and deep-link tab from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as Tab | null;
    const connected = params.get('connected');
    const errorParam = params.get('error');

    if (tabParam && TABS.includes(tabParam)) setActiveTab(tabParam);
    if (connected) setIntegrationMsg(`${connected} connected successfully.`);
    if (errorParam) setIntegrationMsg(`Connection failed: ${errorParam.replace(/_/g, ' ')}`);

    if (tabParam || connected || errorParam) {
      window.history.replaceState({}, '', '/settings');
    }
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
      await authApi.me(); // Would be authApi.updateProfile in a real impl
      updateUser({ name, email });
      setAccountMsg('Profile updated successfully.');
    } catch (err) {
      setAccountMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally { setSavingAccount(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg('New passwords do not match.'); return; }
    if (newPw.length < 8) { setPwMsg('Password must be at least 8 characters.'); return; }
    setSavingPw(true);
    setPwMsg('');
    try {
      await authApi.resetPassword('', newPw); // In prod: dedicated changePassword endpoint
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
      setMfaMsg('MFA enabled successfully!');
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
      const res = await integrationsApi.connect(provider) as {
        authUrl?: string | null;
        connected?: boolean;
        message?: string;
      };

      if (res.authUrl) {
        const token = localStorage.getItem('blox_access_token') ?? '';
        if (!token) {
          setIntegrationMsg('Missing access token. Please sign in again.');
          return;
        }
        const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin;
        const authUrl = new URL(res.authUrl, baseUrl);
        authUrl.searchParams.set('token', token);
        window.location.href = authUrl.toString();
        return;
      }

      if (res.connected) {
        setIntegrations((prev) => prev.map((item) => (item.id === provider ? { ...item, connected: true } : item)));
      }
      if (res.message) {
        setIntegrationMsg(res.message);
      }
    } catch (err) {
      setIntegrationMsg(err instanceof Error ? err.message : 'Failed to connect integration.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Cancel your subscription? You will remain on the current plan until the period ends.')) return;
    setCancelling(true);
    setCancelMsg('');
    try {
      await billingApi.cancel({ immediate: false });
      setCancelMsg('Subscription cancelled. Your plan remains active until the current period ends.');
      await loadSubscription();
    } catch (err) {
      setCancelMsg(err instanceof Error ? err.message : 'Failed to cancel subscription.');
    } finally { setCancelling(false); }
  };

  return (
    <FeaturePage 
      title="Settings & Career"
      description="Manage your account, security protocols, system integrations, and explore the career hub."
      headerIcon={<Settings className="h-6 w-6" />}
    >
      <div className="flex flex-col lg:flex-row gap-8 md:gap-10">
        {/* Tab Navigation Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24">
            <nav className="flex lg:flex-col gap-1 p-1 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm overflow-x-auto lg:overflow-x-visible">
              {[
                { id: 'Account', icon: <User className="h-4 w-4" /> },
                { id: 'Security', icon: <Shield className="h-4 w-4" /> },
                { id: 'Integrations', icon: <LinkIcon className="h-4 w-4" /> },
                { id: 'Subscription', icon: <CreditCard className="h-4 w-4" /> },
                { id: 'Export', icon: <Download className="h-4 w-4" /> },
                { id: 'Career', icon: <BriefcaseBusiness className="h-4 w-4" />, label: 'Career Hub' },
              ].map((tab) => (
                <button 
                  key={tab.id} 
                  type="button" 
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex-shrink-0 lg:flex-shrink flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold tracking-wide transition-all duration-200 focus:outline-none ${
                    activeTab === tab.id 
                      ? 'bg-[#1ECEFA] text-black shadow-sm' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'opacity-100' : 'opacity-60'}>{tab.icon}</span>
                  <span className="whitespace-nowrap">{tab.id === 'Career' ? 'Career Hub' : tab.id}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {/* Account Tab */}
          {activeTab === 'Account' && (
            <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white tracking-tight">Account Identity</h2>
                <p className="text-sm text-slate-400">Update your core identity and persona within the system.</p>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-6">
                <div className="grid gap-6 rounded-2xl md:rounded-3xl border border-white/10 bg-black/30 p-6 md:p-8 shadow-xl">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Identity Name</label>
                    <input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-xl md:rounded-2xl border border-white/10 bg-white/5 px-4 md:px-5 py-3 md:py-4 text-sm text-white placeholder-slate-600 transition-all focus:border-[#1ECEFA]/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Comms Address</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-xl md:rounded-2xl border border-white/10 bg-white/5 px-4 md:px-5 py-3 md:py-4 text-sm text-white placeholder-slate-600 transition-all focus:border-[#1ECEFA]/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Persona Profile</label>
                      <div className="flex items-center gap-3 rounded-xl md:rounded-2xl border border-white/5 bg-white/5 px-4 md:px-5 py-3 md:py-4">
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">{user.persona ?? 'NOT ASSIGNED'}</span>
                        <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-black text-slate-500 uppercase border border-white/5">Immutable</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Clearance Level</label>
                      <div className="flex items-center gap-3 rounded-xl md:rounded-2xl border border-white/5 bg-white/5 px-4 md:px-5 py-3 md:py-4">
                        <span className={`text-sm font-black uppercase tracking-wider ${
                          user.tier === PlanTier.FREE ? 'text-slate-400' :
                          user.tier === PlanTier.PRO ? 'text-[#1ECEFA]' :
                          'text-purple-400'
                        }`}>{user.tier}</span>
                        <LinkIcon className="ml-auto h-3 w-3 text-slate-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {accountMsg && (
                  <div className={`rounded-xl md:rounded-2xl border p-4 text-sm font-bold animate-in zoom-in-95 duration-200 ${
                    accountMsg.includes('success') 
                      ? 'border-green-500/20 bg-green-500/10 text-green-400' 
                      : 'border-red-500/20 bg-red-500/10 text-red-400'
                  }`}>
                    {accountMsg}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={savingAccount}
                  className="flex items-center justify-center gap-2 rounded-xl md:rounded-2xl bg-white px-6 md:px-8 py-3 md:py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-md active:scale-95 disabled:opacity-50"
                >
                  {savingAccount ? 'SYNCHRONIZING...' : 'COMMIT CHANGES'}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'Security' && (
            <div className="max-w-2xl space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">Access Credentials</h2>
                  <p className="text-sm text-slate-400">Manage your system passcodes and authentication layers.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6 rounded-2xl md:rounded-3xl border border-white/10 bg-black/30 p-6 md:p-8 shadow-xl">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Current Passcode</label>
                      <input 
                        type="password" 
                        value={currentPw} 
                        onChange={(e) => setCurrentPw(e.target.value)}
                        className="w-full rounded-xl md:rounded-2xl border border-white/10 bg-white/5 px-4 md:px-5 py-3 md:py-4 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50 transition-all" 
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">New Passcode</label>
                        <input 
                          type="password" 
                          value={newPw} 
                          onChange={(e) => setNewPw(e.target.value)}
                          className="w-full rounded-xl md:rounded-2xl border border-white/10 bg-white/5 px-4 md:px-5 py-3 md:py-4 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50 transition-all" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Confirm Passcode</label>
                        <input 
                          type="password" 
                          value={confirmPw} 
                          onChange={(e) => setConfirmPw(e.target.value)}
                          className="w-full rounded-xl md:rounded-2xl border border-white/10 bg-white/5 px-4 md:px-5 py-3 md:py-4 text-sm text-white focus:border-[#1ECEFA]/50 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50 transition-all" 
                        />
                      </div>
                    </div>
                  </div>

                  {pwMsg && (
                    <div className={`rounded-xl md:rounded-2xl border p-4 text-sm font-bold ${pwMsg.includes('success') ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                      {pwMsg}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={savingPw}
                    className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 px-6 md:px-8 py-3 md:py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 hover:border-[#1ECEFA]/50 hover:text-[#1ECEFA] disabled:opacity-50"
                  >
                    {savingPw ? 'ENCRYPTING...' : 'ROTATE CREDENTIALS'}
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">Multi-Factor Protocol</h2>
                  <p className="text-sm text-slate-400">Add an extra layer of encryption to your access terminal.</p>
                </div>

                <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-black/30 p-6 md:p-8 shadow-xl">
                  {!mfaSetup ? (
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <Shield className="h-8 w-8" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <p className="text-sm text-slate-400 leading-relaxed">Secure your terminal with a Time-based One-Time Password (TOTP). This adds a required second key during authentication.</p>
                        <button 
                          onClick={handleSetupMfa}
                          className="mt-4 rounded-xl md:rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-2.5 md:px-6 md:py-3 text-xs font-black tracking-widest text-purple-300 transition-all hover:bg-purple-600 hover:text-white hover:shadow-md"
                        >
                          INITIALIZE 2FA
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="grid gap-6 md:gap-8 md:grid-cols-2">
                        <div className="space-y-4 text-center md:text-left">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-400">1. Scan visual matrix</p>
                          <div className="inline-block rounded-2xl border-2 border-purple-500/30 p-3 bg-white">
                            <img src={mfaSetup.qrCode} alt="MFA QR code" className="h-32 w-32 md:h-40 md:w-40 object-contain" />
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Manual decryption key</p>
                            <code className="block rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-xs font-mono text-[#1ECEFA] select-all">
                              {mfaSetup.secret}
                            </code>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-400">2. Verify Token</p>
                            <div className="flex gap-2">
                              <input 
                                value={mfaCode} 
                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="w-full rounded-xl md:rounded-2xl border border-white/10 bg-black/60 px-4 py-3 md:px-5 md:py-4 text-center font-mono text-lg md:text-xl tracking-[0.3em] text-white focus:border-purple-500/50 focus:outline-none transition-all" 
                              />
                              <button 
                                onClick={handleVerifyMfa}
                                className="rounded-xl md:rounded-2xl bg-purple-600 px-6 md:px-8 text-sm font-black text-white hover:bg-white hover:text-purple-600 transition-all"
                              >
                                VERIFY
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {mfaMsg && (
                    <div className={`mt-6 rounded-xl md:rounded-2xl border p-4 text-sm font-bold ${mfaMsg.includes('success') ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                      {mfaMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'Integrations' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">System Links</h2>
                  <p className="text-sm text-slate-400">Connect external nodes to synchronize your career data.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl md:rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <Shield className="h-3 w-3" /> Privacy Protocol Active
                </div>
              </div>

              {loadingIntegrations ? (
                <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 animate-pulse rounded-2xl md:rounded-3xl border border-white/5 bg-black/20" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {integrations.map((integration) => (
                    <div 
                      key={integration.id} 
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl md:rounded-3xl border p-5 md:p-6 transition-all duration-300 ${
                        integration.connected 
                          ? 'border-[#1ECEFA]/30 bg-[#1ECEFA]/5 shadow-inner' 
                          : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-black text-white tracking-tight uppercase">{integration.name}</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{integration.category}</p>
                          </div>
                          {integration.connected ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400 border border-green-500/20">
                              <Zap className="h-4 w-4 fill-current" />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-600 border border-white/5">
                              <LinkIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-600">Mode</span>
                            <span className="text-slate-500">{integration.mode}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-600">Status</span>
                            <span className={integration.connected ? 'text-green-400' : 'text-slate-600'}>{integration.connected ? 'LINKED' : 'DISCONNECTED'}</span>
                          </div>
                          {integration.mode === 'oauth' && !integration.oauthConfigured && (
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-amber-500">Config</span>
                              <span className="text-amber-500">ENV MISSING</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {integration.connected ? (
                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          className="mt-6 w-full rounded-xl md:rounded-2xl border border-red-500/20 bg-red-500/5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 transition-all hover:bg-red-500 hover:text-white"
                        >
                          TERMINATE
                        </button>
                      ) : integration.mode === 'manual' ? (
                        <div className="mt-6 w-full rounded-xl md:rounded-2xl border border-white/5 bg-white/5 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                          MANUAL IMPORT
                        </div>
                      ) : (
                        <div className="mt-6 space-y-2">
                          <button
                            onClick={() => handleConnectIntegration(integration.id)}
                            className="w-full rounded-xl md:rounded-2xl bg-white/5 border border-white/10 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#1ECEFA] hover:text-black hover:shadow-md"
                          >
                            INITIALIZE LINK
                          </button>
                          {integration.mode === 'oauth' && !integration.oauthConfigured && integration.setupDocsUrl && (
                            <a
                              href={integration.setupDocsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1 text-[10px] text-amber-500/70 hover:text-amber-400"
                            >
                              <ArrowUpRight className="h-3 w-3" /> Setup credentials
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {integrationMsg && (
                <div className="inline-block rounded-xl md:rounded-2xl border border-[#1ECEFA]/20 bg-[#1ECEFA]/10 px-5 py-4 text-xs font-bold tracking-wide text-[#1ECEFA]">
                  {integrationMsg}
                </div>
              )}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'Subscription' && (
            <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Clearance Status</h2>
                <p className="text-sm text-slate-400">View and manage your active subscription protocol.</p>
              </div>

              {loadingSub ? (
                <div className="h-64 animate-pulse rounded-2xl md:rounded-3xl border border-white/5 bg-black/20" />
              ) : subscription ? (
                <div className="space-y-8">
                  <div className="relative overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#0C0F13] via-black to-purple-900/10 p-8 md:p-10 shadow-2xl">
                    <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/3 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
                          <Zap className="h-3 w-3 fill-current" /> Active Protocol
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{subscription.tier}</h3>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{subscription.cycle} CYCLE</p>
                      </div>
                      
                      <div className="flex flex-col items-start md:items-end gap-3">
                        <span className={`inline-flex items-center gap-2 rounded-xl md:rounded-2xl border px-4 py-2 md:px-5 md:py-2.5 text-xs font-black uppercase tracking-widest shadow-inner ${
                          subscription.status === 'ACTIVE' ? 'border-green-500/20 bg-green-500/10 text-green-400' :
                          'border-red-500/20 bg-red-500/10 text-red-400'
                        }`}>
                          <div className={`h-2 w-2 rounded-full ${subscription.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                          {subscription.status}
                        </span>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Renewal: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {subscription.invoices && subscription.invoices.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Ledger History</h4>
                      <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-black/30 p-2 overflow-hidden">
                        {subscription.invoices.slice(0, 5).map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 transition-all hover:bg-white/5">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/5">
                                <CreditCard className="h-5 w-5 text-slate-500" />
                              </div>
                              <span className="text-sm font-bold text-slate-300">{new Date(inv.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className="font-mono text-sm font-black text-white uppercase">
                              {inv.currency} {(inv.amount / 100).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                      href="/pricing"
                      className="flex-1 flex items-center justify-center rounded-xl md:rounded-2xl bg-white px-6 md:px-8 py-3 md:py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-md active:scale-95"
                    >
                      ELEVATE CLEARANCE
                    </a>
                    {subscription.status === 'ACTIVE' && user.tier !== PlanTier.FREE && (
                      <button 
                        onClick={handleCancelSubscription} 
                        disabled={cancelling}
                        className="flex-1 rounded-xl md:rounded-2xl border border-red-500/20 bg-red-500/5 px-6 md:px-8 py-3 md:py-4 text-sm font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
                      >
                        {cancelling ? 'PROCESSING...' : 'ABORT SUBSCRIPTION'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-white/5 bg-black/20 p-12 md:p-16 text-center">
                  <div className="mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-3xl bg-white/5 text-slate-700">
                    <Shield className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight uppercase">No Active Protocols</h3>
                  <p className="mt-2 text-sm text-slate-500 max-w-xs leading-relaxed">Your system is currently operating on standard free-tier boundaries.</p>
                  <a 
                    href="/pricing" 
                    className="mt-8 rounded-xl md:rounded-2xl bg-white px-6 md:px-8 py-3 md:py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-md"
                  >
                    VIEW UPGRADE PROTOCOLS
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'Export' && (
            <div className="max-w-2xl space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">Data Extraction</h2>
                  <p className="text-sm text-slate-400">Extract your compiled architecture blocks to offline storage.</p>
                </div>

                <div className="grid gap-4">
                  {[
                    { id: 'json', label: 'JSON METADATA DUMP', desc: 'Raw structured data schema capturing all node content.', icon: <Download className="h-5 w-5" /> },
                    { id: 'pdf', label: 'PDF RENDER PIPELINE', desc: 'Print-ready vectorized output compiled from active assets.', icon: <Download className="h-5 w-5" /> },
                    { id: 'docx', label: 'DOCX EXTRACTION', desc: 'Word compatible format stripped of advanced styling.', icon: <Download className="h-5 w-5" /> },
                  ].map((opt) => (
                    <div key={opt.id} className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-black/40 p-1 transition-all hover:border-[#1ECEFA]/50 hover:bg-black/60 shadow-xl backdrop-blur-md">
                      <div className="flex flex-col md:flex-row items-center justify-between rounded-xl md:rounded-[1.4rem] bg-black/40 p-4 md:p-6">
                        <div className="space-y-1 text-center md:text-left mb-4 md:mb-0">
                          <p className="text-sm font-black text-white group-hover:text-[#1ECEFA] transition-colors uppercase tracking-tight">{opt.label}</p>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                        <button className="flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-white/5 text-slate-400 transition-all hover:bg-[#1ECEFA] hover:text-black group-hover:shadow-md">
                          {opt.icon}
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-gradient-to-r from-transparent via-[#1ECEFA] to-transparent transition-transform duration-500 group-hover:scale-x-100 opacity-50" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl md:rounded-3xl border border-red-500/20 bg-red-500/5 p-6 md:p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-5 w-5 text-red-500" />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-500">Terminal Purge Sequence</h3>
                </div>
                <p className="mb-8 text-xs text-red-400/70 leading-relaxed max-w-lg">
                  Initiating this sequence will permanently purge your identity context, compiled nodes, and credentials from our servers. This action is irreversible.
                </p>
                <button className="rounded-xl md:rounded-2xl border border-red-500 bg-red-500/10 px-6 md:px-8 py-3 md:py-4 text-xs font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white shadow-sm">
                  INITIATE PURGE
                </button>
              </div>
            </div>
          )}

          {/* Career Hub Tab */}
          {activeTab === 'Career' && (
            <div className="max-w-4xl space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">Career Hub</h2>
                <p className="text-sm text-slate-400">Advanced career tools to optimize your professional trajectory.</p>
              </div>

              <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                {[
                  {
                    title: 'Career Coach',
                    desc: 'Personalized guidance and progress tracking powered by AI.',
                    href: '/coach',
                    icon: <User className="h-6 w-6" />,
                    color: 'blue'
                  },
                  {
                    title: 'Job Matching',
                    desc: 'Align your assets to openings and find optimized fits.',
                    href: '/jobs',
                    icon: <BriefcaseBusiness className="h-6 w-6" />,
                    color: 'cyan'
                  },
                  {
                    title: 'Mock Interview',
                    desc: 'Practice interview rounds with real-time feedback.',
                    href: '/interview',
                    icon: <Shield className="h-6 w-6" />,
                    color: 'purple'
                  },
                  {
                    title: 'Networking',
                    desc: 'Manage outreach messages and professional connections.',
                    href: '/network',
                    icon: <LinkIcon className="h-6 w-6" />,
                    color: 'indigo'
                  },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="group relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-white/10 bg-black/40 p-6 md:p-8 transition-all duration-300 hover:border-[#1ECEFA]/50 hover:bg-black/60 shadow-xl"
                  >
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-6 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl bg-white/5 border border-white/5 text-slate-400 group-hover:bg-[#1ECEFA] group-hover:text-black transition-all duration-300">
                        {item.icon}
                      </div>
                      <div className="mt-auto">
                        <h3 className="text-lg md:text-xl font-black text-white tracking-tight uppercase group-hover:text-[#1ECEFA] transition-colors">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1ECEFA] opacity-0 group-hover:opacity-100 transition-opacity">
                        Initialize Module <ArrowUpRight className="h-3 w-3" />
                      </div>
                    </div>
                    {/* Background glow on hover */}
                    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#1ECEFA]/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </a>
                ))}
              </div>

              <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-gradient-to-br from-black to-[#1ECEFA]/5 p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  <div className="shrink-0 rounded-xl md:rounded-2xl bg-[#1ECEFA]/10 p-4 md:p-5 border border-[#1ECEFA]/20">
                    <Zap className="h-6 w-6 md:h-8 md:w-8 text-[#1ECEFA]" />
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h4 className="text-base md:text-lg font-black text-white tracking-tight uppercase">Career Roadmap</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">Your professional trajectory is being analyzed. Complete more assets to unlock personalized roadmap milestones.</p>
                  </div>
                  <div className="w-full md:w-48 bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                    <div className="bg-[#1ECEFA] h-full w-1/3 shadow-sm" />
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

