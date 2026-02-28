'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { apiFetch } from '@/lib/api';
import { PlanTier } from '@nextjs-blox/shared-types';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  tier: PlanTier;
  createdAt: string;
  assetCount?: number;
}

interface Stats {
  totalUsers: number;
  totalAssets: number;
  tierBreakdown: Array<{ tier: string; count: number }>;
}

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  createdAt: string;
  user?: { fullName: string };
}

type ActiveTab = 'stats' | 'users' | 'audit' | 'api-keys';

export default function AdminPage() {
  const [tab, setTab] = useState<ActiveTab>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Stats>('/admin/stats');
      setStats(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ users: UserRow[] }>(`/admin/users?search=${encodeURIComponent(search)}`);
      setUsers(data.users);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [search]);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ logs: AuditLog[] }>('/admin/audit-logs');
      setAuditLogs(data.logs);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'stats') loadStats();
    else if (tab === 'users') loadUsers();
    else if (tab === 'audit') loadAuditLogs();
  }, [tab, loadStats, loadUsers, loadAuditLogs]);

  const handleUpdateTier = async (userId: string, newTier: PlanTier) => {
    setUpdatingUser(userId);
    try {
      await apiFetch(`/admin/users/${userId}/tier`, {
        method: 'PATCH',
        body: JSON.stringify({ tier: newTier }),
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, tier: newTier } : u));
    } catch { /* ignore */ }
    finally { setUpdatingUser(null); }
  };

  const TABS: Array<{ id: ActiveTab; label: string }> = [
    { id: 'stats', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'audit', label: 'Audit log' },
    { id: 'api-keys', label: 'API keys' },
  ];

  return (
    <FeaturePage
      title="Enterprise admin"
      description="User management, audit logs, API key generator, and platform oversight."
      minTier={PlanTier.ENTERPRISE}
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && (
        loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Total users', value: stats.totalUsers.toLocaleString() },
                { label: 'Total assets', value: stats.totalAssets.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-center">
                  <p className="text-3xl font-black text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Users by plan</h3>
              <div className="space-y-3">
                {stats.tierBreakdown.map((b) => {
                  const max = Math.max(...stats.tierBreakdown.map((x) => x.count), 1);
                  return (
                    <div key={b.tier} className="flex items-center gap-3">
                      <span className="w-24 text-xs font-medium text-slate-700">{b.tier}</span>
                      <div className="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-4 rounded-full bg-blue-500" style={{ width: `${(b.count / max) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs text-slate-500">{b.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">User</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 hidden sm:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Tier</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 hidden md:table-cell">Joined</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          u.tier === PlanTier.FREE ? 'bg-slate-100 text-slate-600' :
                          u.tier === PlanTier.PRO ? 'bg-blue-100 text-blue-800' :
                          u.tier === PlanTier.PREMIUM ? 'bg-purple-100 text-purple-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>{u.tier}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <select value={u.tier} disabled={updatingUser === u.id}
                          onChange={(e) => handleUpdateTier(u.id, e.target.value as PlanTier)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs">
                          {Object.values(PlanTier).map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">No users found.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Audit log */}
      {tab === 'audit' && (
        loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 hidden sm:table-cell">User</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{log.action}</td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell text-xs">{log.user?.fullName ?? log.userId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No audit logs.</p>
            )}
          </div>
        )
      )}

      {/* API keys */}
      {tab === 'api-keys' && (
        <div className="max-w-lg space-y-4">
          <p className="text-sm text-slate-600">Generate API keys for programmatic access to the Blox platform.</p>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Key label</label>
              <input placeholder="e.g. production-integration"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
              Generate API key
            </button>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            API keys grant full programmatic access. Store them securely — they are shown once.
          </div>
        </div>
      )}
    </FeaturePage>
  );
}
