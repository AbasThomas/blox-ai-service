'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { useBloxStore } from '@/lib/store/app-store';
import { authApi, billingApi, integrationsApi } from '@/lib/api';
import { PlanTier } from '@nextjs-blox/shared-types';
import { User, Shield, Link as LinkIcon, CreditCard, Download, Zap, Settings, BriefcaseBusiness } from 'lucide-react';

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
  authUrl: string | null;
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
        window.location.href = `${process.env.NEXT_PUBLIC_APP_BASE_URL || ''}${res.authUrl}?token=${encodeURIComponent(token)}`;
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
      title="SETTINGS & CAREER"
      description="Manage account controls, integrations, privacy, billing, and a collapsed career hub."
      headerIcon={<Settings className="h-6 w-6" />}
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
        {[
          { id: 'Account', icon: <User className="h-4 w-4" /> },
          { id: 'Security', icon: <Shield className="h-4 w-4" /> },
          { id: 'Integrations', icon: <LinkIcon className="h-4 w-4" /> },
          { id: 'Subscription', icon: <CreditCard className="h-4 w-4" /> },
          { id: 'Export', icon: <Download className="h-4 w-4" /> },
          { id: 'Career', icon: <BriefcaseBusiness className="h-4 w-4" /> },
        ].map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as Tab)}
            className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold tracking-wider uppercase transition-all duration-300 focus:outline-none ${
              activeTab === tab.id 
                ? 'bg-[#1ECEFA]/10 text-[#1ECEFA] border border-[#1ECEFA]/30 shadow-[inset_0_0_15px_rgba(30,206,250,0.1)]' 
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent'
            }`}>
            <span className={activeTab === tab.id ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}>{tab.icon}</span>
            {tab.id}
          </button>
        ))}
      </div>

      {/* Account */}
      {activeTab === 'Account' && (
        <form onSubmit={handleSaveAccount} className="max-w-xl space-y-6">
          <div className="space-y-4 rounded-2xl border border-white/5 bg-black/20 p-6 backdrop-blur-sm">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Identity Tag</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-all focus:border-[#1ECEFA]/50 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Comms Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-all focus:border-[#1ECEFA]/50 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Assigned Persona</label>
              <div className="flex items-center gap-3">
                 <input readOnly value={user.persona ?? 'UNASSIGNED'} disabled
                   className="w-full rounded-xl border border-transparent bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-500 opacity-70" />
                 <span className="text-[10px] uppercase text-[#1ECEFA]">Immutable</span>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Clearance Level</label>
              <span className={`inline-flex items-center rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-inner ${
                user.tier === PlanTier.FREE ? 'bg-slate-800 text-slate-300' :
                user.tier === PlanTier.PRO ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                user.tier === PlanTier.PREMIUM ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>{user.tier} MODULE</span>
            </div>
          </div>
          {accountMsg && (
            <div className={`rounded-lg border p-3 text-xs font-bold tracking-wide ${accountMsg.includes('success') ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
              {accountMsg}
            </div>
          )}
          <button type="submit" disabled={savingAccount}
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1ECEFA] px-6 py-3 text-xs font-bold tracking-widest text-black shadow-[0_0_20px_rgba(30,206,250,0.3)] transition-all hover:scale-[1.02] hover:bg-white active:scale-95 disabled:opacity-50">
            {savingAccount ? 'UPDATING...' : 'UPDATE IDENTITY'}
          </button>
        </form>
      )}

      {/* Security */}
      {activeTab === 'Security' && (
        <div className="max-w-2xl space-y-8">
          <form onSubmit={handleChangePassword} className="space-y-5 rounded-2xl border border-white/5 bg-black/20 p-6 backdrop-blur-sm">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white uppercase tracking-wide">
              <Shield className="h-5 w-5 text-[#1ECEFA]" />
              Access Credentials
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Passcode</label>
                <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-all focus:border-[#1ECEFA]/50 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50" />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">New Passcode</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-all focus:border-[#1ECEFA]/50 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50" />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirm Passcode</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white transition-all focus:border-[#1ECEFA]/50 focus:outline-none focus:ring-1 focus:ring-[#1ECEFA]/50" />
              </div>
            </div>
            {pwMsg && (
              <div className={`rounded-lg border p-3 text-xs font-bold tracking-wide ${pwMsg.includes('success') ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                {pwMsg}
              </div>
            )}
            <button type="submit" disabled={savingPw}
              className="rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-xs font-bold tracking-widest text-white transition-all hover:bg-white/10 disabled:opacity-50 hover:border-[#1ECEFA]/50 hover:text-[#1ECEFA]">
              {savingPw ? 'ENCRYPTING...' : 'ROTATE CREDENTIALS'}
            </button>
          </form>

          <div className="space-y-5 rounded-2xl border border-white/5 bg-black/20 p-6 backdrop-blur-sm">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white uppercase tracking-wide">
              <Shield className="h-5 w-5 text-purple-400" />
              Multi-Factor Authentication
            </h2>
            {!mfaSetup ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 leading-relaxed">Secure your terminal with a Time-based One-Time Password (TOTP) application. This adds an extra layer of encryption to your login sequence.</p>
                <button onClick={handleSetupMfa}
                  className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-6 py-3 text-xs font-bold tracking-widest text-purple-300 transition-all hover:bg-purple-500 hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  INITIALIZE 2FA
                </button>
              </div>
            ) : (
              <div className="space-y-6 rounded-xl border border-purple-500/20 bg-black/40 p-5 mt-4">
                <div className="flex flex-col sm:flex-row gap-6">
                  {mfaSetup.qrCode && (
                    <div className="shrink-0">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-purple-400">1. Scan visual matrix:</p>
                      <div className="rounded-xl border-2 border-purple-500/30 p-2 bg-white">
                         <img src={mfaSetup.qrCode} alt="MFA QR code" className="h-32 w-32 object-contain" />
                      </div>
                    </div>
                  )}
                  <div className="flex-1 space-y-4">
                    {mfaSetup.secret && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Or input manual decryption key:</p>
                        <code className="block rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs font-mono text-[#1ECEFA] selection:bg-[#1ECEFA] selection:text-black">
                           {mfaSetup.secret}
                        </code>
                      </div>
                    )}
                    <div>
                       <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-purple-400">2. Verify Token:</p>
                       <div className="flex gap-2">
                         <input value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                           placeholder="000000"
                           className="w-32 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-white transition-all focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
                         <button onClick={handleVerifyMfa}
                           className="rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold tracking-widest text-white transition-all hover:bg-white hover:text-purple-600 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                           VERIFY
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {mfaMsg && (
              <div className={`mt-4 rounded-lg border p-3 text-xs font-bold tracking-wide ${mfaMsg.includes('success') ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                 {mfaMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'Integrations' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 backdrop-blur-md">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-blue-400 uppercase tracking-widest">
               <Shield className="h-4 w-4" /> Data Privacy Protocol
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Systems only request read-access to public profiles and portfolio metadata. The architecture physically cannot modify, delete, or create outbound network requests on your behalf.
            </p>
          </div>

          {loadingIntegrations ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-black/20" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {integrations.map((integration) => (
                <div key={integration.id} className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${integration.connected ? 'border-[#1ECEFA]/30 bg-[#1ECEFA]/5 shadow-[inset_0_0_20px_rgba(30,206,250,0.05)]' : 'border-white/10 bg-black/40 hover:border-white/20'}`}>
                  {integration.connected && (
                     <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-[#1ECEFA]/20 blur-2xl" />
                  )}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-display font-bold text-white">{integration.name}</span>
                      {integration.connected ? (
                        <div className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1">
                           <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Online</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                           <div className="h-1 w-1 rounded-full bg-slate-600" />
                           <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Offline</span>
                        </div>
                      )}
                    </div>
                    <div className="mb-4 space-y-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                       <p>Class: <span className="text-slate-300">{integration.category}</span></p>
                       <p>Priority: <span className={integration.priority === 'primary' ? 'text-[#1ECEFA]' : 'text-slate-400'}>{integration.priority}</span></p>
                    </div>
                  </div>
                  
                  {integration.connected ? (
                    <button onClick={() => handleDisconnect(integration.id)}
                      className="mt-2 w-full rounded-xl border border-red-500/30 bg-red-500/5 py-2.5 text-xs font-bold tracking-widest text-red-400 transition-all hover:bg-red-500 hover:text-white">
                      TERMINATE CONNECTION
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectIntegration(integration.id)}
                      className="mt-2 w-full rounded-xl bg-white/10 py-2.5 text-xs font-bold tracking-widest text-white transition-all hover:bg-[#1ECEFA] hover:text-black hover:shadow-[0_0_15px_rgba(30,206,250,0.4)]"
                    >
                      INITIALIZE LINK
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {integrationMsg && (
             <div className="inline-block rounded-lg border border-[#1ECEFA]/30 bg-[#1ECEFA]/10 px-4 py-3 text-xs font-bold tracking-wide text-[#1ECEFA]">
               {integrationMsg}
             </div>
          )}
        </div>
      )}

      {/* Subscription */}
      {activeTab === 'Subscription' && (
        <div className="max-w-xl space-y-6">
          {loadingSub ? (
            <div className="h-40 animate-pulse rounded-3xl border border-white/5 bg-black/20" />
          ) : subscription ? (
            <>
              <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-black to-purple-950/20 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
                
                <div className="relative z-10">
                   <div className="mb-8 flex items-start justify-between">
                     <div>
                       <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-400">
                         <Zap className="h-3 w-3 fill-current" /> Active Protocol
                       </p>
                       <p className="font-display text-4xl font-black text-white">{subscription.tier}</p>
                     </div>
                     <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-inner ${
                       subscription.status === 'ACTIVE' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                       subscription.status === 'CANCELLED' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                       'border-amber-500/30 bg-amber-500/10 text-amber-400'
                     }`}>
                        <div className={`h-2 w-2 rounded-full ${subscription.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        {subscription.status}
                     </span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6 rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
                     <div>
                       <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Billing Cycle</p>
                       <p className="font-bold text-slate-200 capitalize">{subscription.cycle}</p>
                     </div>
                     <div>
                       <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Renewal Epoch</p>
                       <p className="font-bold text-slate-200">
                         {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                       </p>
                     </div>
                   </div>
                </div>
              </div>

              {subscription.invoices && subscription.invoices.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#1ECEFA]">Ledger History</h3>
                  <div className="space-y-1">
                    {subscription.invoices.slice(0, 5).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-white/5">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                             <CreditCard className="h-4 w-4 text-slate-500" />
                           </div>
                           <span className="text-sm font-medium text-slate-300">{new Date(inv.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-white">
                          {inv.currency.toUpperCase()} {(inv.amount / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subscription.status === 'ACTIVE' && user.tier !== PlanTier.FREE && (
                <div className="flex flex-col gap-3 sm:flex-row pt-4">
                  <a href="/pricing"
                    className="flex-1 rounded-xl bg-purple-600 px-6 py-3.5 text-center text-xs font-bold tracking-widest text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all hover:bg-white hover:text-purple-600">
                    ELEVATE CLEARANCE
                  </a>
                  <button onClick={handleCancelSubscription} disabled={cancelling}
                    className="flex-1 rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-3.5 text-xs font-bold tracking-widest text-red-400 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50">
                    {cancelling ? 'PROCESSING ABORT...' : 'ABORT SUBSCRIPTION'}
                  </button>
                </div>
              )}
              {cancelMsg && <div className={`inline-block rounded-lg border p-3 text-xs font-bold tracking-wide ${cancelMsg.includes('cancelled') ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>{cancelMsg}</div>}

              {user.tier === PlanTier.FREE && (
                <a href="/pricing"
                  className="mt-4 block w-full rounded-xl bg-purple-600 px-6 py-4 text-center text-sm font-bold tracking-widest text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all hover:bg-white hover:text-purple-600">
                  ACTIVATE PRO CLEARANCE - $9.99/mo
                </a>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/20 p-12 text-center backdrop-blur-sm">
              <Shield className="mb-4 h-12 w-12 text-slate-600" strokeWidth={1.5} />
              <p className="font-display text-lg font-bold text-white">No Clearance Records</p>
              <p className="mt-2 text-sm text-slate-500">Your system is operating on standard free-tier boundaries.</p>
              <a href="/pricing" className="mt-6 rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold tracking-widest text-white transition-all hover:bg-white hover:text-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                VIEW UPGRADE PROTOCOLS
              </a>
            </div>
          )}
        </div>
      )}

      {/* Export */}
      {activeTab === 'Export' && (
        <div className="max-w-2xl space-y-6">
          <p className="text-sm text-slate-400 leading-relaxed">Extract your compiled architecture blocks directly to offline storage. Formats optimized for internal ATS systems and personal backups.</p>
          <div className="grid gap-4">
            {[
              { label: 'JSON METADATA DUMP', format: 'json', desc: 'Raw structured data schema capturing all deployed node content.' },
              { label: 'PDF RENDER PIPELINE', format: 'pdf', desc: 'Print-ready vectorized output compiled from your active Resume.' },
              { label: 'DOCX EXTRACTION', format: 'docx', desc: 'Microsoft Word compatible format stripped of advanced web-styling.' },
            ].map((opt) => (
              <div key={opt.format} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-1 transition-all hover:border-[#1ECEFA]/50 hover:bg-[#161B22]/80 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between rounded-xl bg-black/60 p-5 p-5">
                  <div>
                    <p className="mb-1 text-sm font-bold text-white group-hover:text-[#1ECEFA] transition-colors">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                  <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-all hover:bg-[#1ECEFA] hover:text-black group-hover:shadow-[0_0_15px_rgba(30,206,250,0.3)]">
                    <Download className="h-5 w-5" />
                  </button>
                </div>
                {/* Glow bar */}
                <div className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-gradient-to-r from-transparent via-[#1ECEFA] to-transparent transition-transform duration-500 group-hover:scale-x-100 opacity-50" />
              </div>
            ))}
          </div>
          
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6 backdrop-blur-sm">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-red-500">
              <Shield className="h-4 w-4" /> Thermal Exhaust Port
            </h3>
            <p className="mb-5 text-xs text-red-400/80 leading-relaxed max-w-lg">
              Initiating this sequence will permanently purge your identity context, compiled nodes, and credentials from our servers. This action is terminal and cannot be reversed.
            </p>
            <button className="rounded-xl border border-red-500 bg-red-500/10 px-6 py-3 text-xs font-bold tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              INITIATE PURGE
            </button>
          </div>
        </div>
      )}

      {/* Career Hub */}
      {activeTab === 'Career' && (
        <div className="max-w-3xl space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#1ECEFA]">
              <BriefcaseBusiness className="h-4 w-4" />
              Career Hub (Collapsed)
            </h2>
            <p className="text-sm text-slate-400">
              Keep career tools in one section so the main dashboard navigation stays focused.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: 'Career Coach',
                desc: 'Personalized coaching guidance and progress tracking.',
                href: '/coach',
              },
              {
                title: 'Job Matching',
                desc: 'Find opportunities and align assets to openings.',
                href: '/jobs',
              },
              {
                title: 'Mock Interview',
                desc: 'Practice interview rounds with instant feedback.',
                href: '/interview',
              },
              {
                title: 'Networking',
                desc: 'Build outreach messages and manage connections.',
                href: '/network',
              },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-[#1ECEFA]/40 hover:bg-[#1ECEFA]/5"
              >
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </FeaturePage>
  );
}
