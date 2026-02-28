'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { assetsApi, billingApi } from '@/lib/api';
import { PlanTier } from '@nextjs-blox/shared-types';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration?: string;
}

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  buyerEmail?: string;
}

export default function EcommercePage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'transactions'>('services');
  const [addingService, setAddingService] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', currency: 'usd', duration: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const asset = await assetsApi.getById(params.id) as {
        title: string;
        content?: { services?: Service[]; transactions?: Transaction[] };
      };
      setTitle(asset.title);
      setServices(asset.content?.services ?? []);
      setTransactions(asset.content?.transactions ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await assetsApi.update(params.id, { title, content: { services, transactions } });
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const handleAddService = () => {
    if (!newService.name || !newService.price) return;
    const svc: Service = {
      id: Date.now().toString(),
      name: newService.name,
      description: newService.description,
      price: parseFloat(newService.price),
      currency: newService.currency,
      duration: newService.duration || undefined,
    };
    setServices((prev) => [...prev, svc]);
    setNewService({ name: '', description: '', price: '', currency: 'usd', duration: '' });
    setAddingService(false);
  };

  const handleRemoveService = (id: string) => setServices((prev) => prev.filter((s) => s.id !== id));

  const handleCreateCheckout = async (svc: Service) => {
    try {
      const data = await billingApi.createCheckout({
        serviceId: svc.id,
        assetId: params.id,
        amount: Math.round(svc.price * 100),
        currency: svc.currency,
      }) as { authorizationUrl: string };
      window.open(data.authorizationUrl, '_blank');
    } catch { /* ignore */ }
  };

  const totalRevenue = transactions
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <FeaturePage
      title={title || 'E-commerce setup'}
      description="List services, embed Paystack checkout, and track transactions."
      minTier={PlanTier.PRO}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(['services', 'transactions'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
          {saving ? 'Saving...' : saveMsg || 'Save'}
        </button>
      </div>

      {/* Services tab */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {services.map((svc) => (
                  <div key={svc.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{svc.name}</h3>
                      <button onClick={() => handleRemoveService(svc.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    </div>
                    {svc.description && <p className="text-xs text-slate-500 mb-2">{svc.description}</p>}
                    {svc.duration && <p className="text-xs text-slate-400 mb-2">{svc.duration}</p>}
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black text-slate-900">
                        {svc.currency.toUpperCase()} {svc.price.toFixed(2)}
                      </p>
                      <button onClick={() => handleCreateCheckout(svc)}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
                        Copy checkout link
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add service */}
              {addingService ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">New service</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={newService.name} onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Service name" className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="flex gap-2">
                      <input type="number" value={newService.price} onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))}
                        placeholder="Price" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <select value={newService.currency} onChange={(e) => setNewService((p) => ({ ...p, currency: e.target.value }))}
                        className="rounded-md border border-slate-300 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="usd">USD</option>
                        <option value="ngn">NGN</option>
                        <option value="gbp">GBP</option>
                        <option value="eur">EUR</option>
                      </select>
                    </div>
                    <input value={newService.duration} onChange={(e) => setNewService((p) => ({ ...p, duration: e.target.value }))}
                      placeholder="Duration (e.g. 1 hour)" className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <input value={newService.description} onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Short description" className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddService} disabled={!newService.name || !newService.price}
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50">
                      Add service
                    </button>
                    <button onClick={() => setAddingService(false)}
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingService(true)}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700">
                  + Add service
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Revenue summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
              <p className="text-2xl font-black text-slate-900">{transactions.filter((t) => t.status === 'success').length}</p>
              <p className="text-xs text-slate-500 mt-1">Successful orders</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
              <p className="text-2xl font-black text-green-600">${(totalRevenue / 100).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Total revenue</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
              <p className="text-2xl font-black text-slate-900">{transactions.length}</p>
              <p className="text-xs text-slate-500 mt-1">All transactions</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
              <p className="text-4xl mb-2">💳</p>
              <p className="text-sm">No transactions yet. Share your checkout links to start accepting payments.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Reference</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 hidden sm:table-cell">Buyer</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.reference.slice(0, 12)}…</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell text-xs">{t.buyerEmail ?? '—'}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{t.currency.toUpperCase()} {(t.amount / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>{t.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </FeaturePage>
  );
}
