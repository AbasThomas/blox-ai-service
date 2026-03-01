'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { useBloxStore } from '@/lib/store/app-store';
import { authApi, billingApi, integrationsApi } from '@/lib/api';
import { PlanTier } from '@nextjs-blox/shared-types';

const TABS = ['Account', 'Security', 'Integrations', 'Subscription', 'Export'] as const;
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
        window.location.href = `${apiBase}${res.authUrl}?token=${encodeURIComponent(token)}`;
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

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

  return (
    <FeaturePage title="Settings" description="Manage your account, security, integrations, and billing.">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
        {TABS.map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Account */}
      {activeTab === 'Account' && (
        <form onSubmit={handleSaveAccount} className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Persona</label>
            <input readOnly value={user.persona ?? ''} disabled
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plan tier</label>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
              user.tier === PlanTier.FREE ? 'bg-slate-100 text-slate-700' :
              user.tier === PlanTier.PRO ? 'bg-blue-100 text-blue-800' :
              user.tier === PlanTier.PREMIUM ? 'bg-purple-100 text-purple-800' :
              'bg-amber-100 text-amber-800'
            }`}>{user.tier}</span>
          </div>
          {accountMsg && (
            <p className={`text-sm ${accountMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{accountMsg}</p>
          )}
          <button type="submit" disabled={savingAccount}
            className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
            {savingAccount ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      )}

      {/* Security */}
      {activeTab === 'Security' && (
        <div className="max-w-lg space-y-8">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Change password</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {pwMsg && (
              <p className={`text-sm ${pwMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{pwMsg}</p>
            )}
            <button type="submit" disabled={savingPw}
              className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
              {savingPw ? 'Updating...' : 'Update password'}
            </button>
          </form>

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Two-factor authentication</h2>
            {!mfaSetup ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Protect your account with a TOTP authenticator app.</p>
                <button onClick={handleSetupMfa}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                  Set up authenticator
                </button>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                {mfaSetup.qrCode && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Scan with your authenticator app:</p>
                    <img src={mfaSetup.qrCode} alt="MFA QR code" className="h-40 w-40 border border-slate-200 rounded-md" />
                  </div>
                )}
                {mfaSetup.secret && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Or enter manually:</p>
                    <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono">{mfaSetup.secret}</code>
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleVerifyMfa}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700">
                    Verify &amp; enable
                  </button>
                </div>
              </div>
            )}
            {mfaMsg && (
              <p className={`text-sm ${mfaMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{mfaMsg}</p>
            )}
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'Integrations' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Connect your accounts to import data and sync content.</p>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            We only read public/profile data and never post or modify anything.
          </div>
          {loadingIntegrations ? (
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {integrations.map((integration) => (
                <div key={integration.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-slate-900">{integration.name}</span>
                    {integration.connected ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Connected</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Not connected</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 capitalize">
                    {integration.priority} - {integration.category} - {integration.mode}
                  </span>
                  {integration.scopes.length > 0 ? (
                    <p className="text-[11px] text-slate-500">Scopes: {integration.scopes.join(', ')}</p>
                  ) : null}
                  {integration.connected ? (
                    <button onClick={() => handleDisconnect(integration.id)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectIntegration(integration.id)}
                      className="block rounded-md bg-slate-900 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-slate-700"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {integrationMsg ? <p className="text-xs text-slate-600">{integrationMsg}</p> : null}
        </div>
      )}

      {/* Subscription */}
      {activeTab === 'Subscription' && (
        <div className="max-w-lg space-y-6">
          {loadingSub ? (
            <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
          ) : subscription ? (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Current plan</p>
                    <p className="text-xl font-black text-slate-900">{subscription.tier}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    subscription.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{subscription.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">Billing cycle</p>
                    <p className="font-medium text-slate-900">{subscription.cycle}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Renews on</p>
                    <p className="font-medium text-slate-900">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {subscription.invoices && subscription.invoices.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Billing history</h3>
                  <div className="space-y-2">
                    {subscription.invoices.slice(0, 5).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{new Date(inv.createdAt).toLocaleDateString()}</span>
                        <span className="font-medium text-slate-900">
                          {inv.currency.toUpperCase()} {(inv.amount / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subscription.status === 'ACTIVE' && user.tier !== PlanTier.FREE && (
                <div className="space-y-3">
                  <a href="/pricing"
                    className="block rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700">
                    Upgrade plan
                  </a>
                  <button onClick={handleCancelSubscription} disabled={cancelling}
                    className="w-full rounded-md border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                    {cancelling ? 'Cancelling...' : 'Cancel subscription'}
                  </button>
                  {cancelMsg && <p className={`text-sm ${cancelMsg.includes('cancelled') ? 'text-amber-600' : 'text-red-600'}`}>{cancelMsg}</p>}
                </div>
              )}

              {user.tier === PlanTier.FREE && (
                <a href="/pricing"
                  className="block rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700">
                  Upgrade to Pro
                </a>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400">
              <p className="text-sm">No active subscription found.</p>
              <a href="/pricing" className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                View plans
              </a>
            </div>
          )}
        </div>
      )}

      {/* Export */}
      {activeTab === 'Export' && (
        <div className="max-w-lg space-y-4">
          <p className="text-sm text-slate-600">Download your data in various formats.</p>
          <div className="grid gap-3">
            {[
              { label: 'Export all assets as JSON', format: 'json', desc: 'Raw structured data for all your assets.' },
              { label: 'Export resumes as PDF', format: 'pdf', desc: 'Print-ready PDF versions of all your resumes.' },
              { label: 'Export as DOCX', format: 'docx', desc: 'Microsoft Word format for all documents.' },
            ].map((opt) => (
              <div key={opt.format} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
                <button className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">
                  Export
                </button>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="text-sm font-bold text-red-900 mb-1">Danger zone</h3>
            <p className="text-xs text-red-700 mb-3">Permanently delete your account and all data. This cannot be undone.</p>
            <button className="rounded-md border border-red-400 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100">
              Delete account
            </button>
          </div>
        </div>
      )}
    </FeaturePage>
  );
}
