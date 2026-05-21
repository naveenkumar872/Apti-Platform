import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, UserCheck, UserX, Users as UsersIcon, TrendingUp, ClipboardList, Award, Trash2 } from 'lucide-react';

const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Other'];
const ROLES = ['student', 'teacher'];
const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";
const inputCls = "w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
const selectCls = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none";

function UserModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', branch: '', year: 2 });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const res = await api.post('/admin/users', form);
      onSave(res.data.user);
      toast.success('User created!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="font-semibold text-gray-800 dark:text-white text-lg mb-4">Create User</h2>
        <div className="space-y-3">
          {[['Name *', 'name', 'text', 'Full name'], ['Email *', 'email', 'email', 'Email address'], ['Password *', 'password', 'password', 'Min 8 chars']].map(([lbl, key, type, ph]) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{lbl}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className={inputCls}
                placeholder={ph} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className={selectCls}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Year</label>
              <select value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                className={selectCls}>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Branch</label>
            <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
              className={selectCls}>
              <option value="">-- Select branch --</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-violet-600 text-white rounded-xl py-2 text-sm hover:bg-violet-500 disabled:opacity-60 transition-colors">
            {saving ? 'Saving...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BatchModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '', year: '', branch: '' });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/admin/batches', form);
      onSave(res.data.batch);
      toast.success('Batch created!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="font-semibold text-gray-800 dark:text-white text-lg mb-4">Create Batch</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Batch Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls} placeholder="e.g., 2025-CSE-A" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={inputCls} placeholder="Optional description" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-violet-600 text-white rounded-xl py-2 text-sm hover:bg-violet-500 disabled:opacity-60 transition-colors">
            {saving ? 'Saving...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users', { params: { search } }).then(r => setUsers(r.data.users || [])).catch(() => {}).finally(() => setLoading(false));
  };

  const fetchBatches = () => {
    setLoading(true);
    api.get('/admin/batches').then(r => setBatches(r.data.batches || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    else fetchBatches();
  }, [tab, search]);

  const toggleActive = async (user) => {
    try {
      await api.put(`/admin/users/${user.user_id}`, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, is_active: !u.is_active } : u));
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete "${user.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.user_id}`);
      setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  const deleteBatch = async (batch) => {
    if (!window.confirm(`Delete batch "${batch.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/batches/${batch.batch_id}`);
      setBatches(prev => prev.filter(b => b.batch_id !== batch.batch_id));
      toast.success('Batch deleted');
    } catch { toast.error('Failed to delete batch'); }
  };

  const roleColors = {
    student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    teacher: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  };

  const cards = [
    { label: 'Total Students', value: stats?.total_students ?? 0, icon: UsersIcon, grad: 'from-blue-500 to-indigo-600' },
    { label: 'Active Today', value: stats?.active_today ?? 0, icon: TrendingUp, grad: 'from-emerald-500 to-teal-600' },
    { label: 'Tests This Week', value: stats?.tests_this_week ?? 0, icon: ClipboardList, grad: 'from-violet-500 to-purple-600' },
    { label: 'Avg Score', value: `${Math.round(stats?.avg_score ?? 0)}%`, icon: Award, grad: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Management</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Users &amp; Batches</h1>
            <p className="text-white/70 text-sm mt-1.5">Manage students, teachers &amp; batches</p>
          </div>
          <button
            onClick={() => tab === 'users' ? setShowUserModal(true) : setShowBatchModal(true)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-colors mt-1 flex-shrink-0"
          >
            <Plus size={15} /> {tab === 'users' ? 'Add User' : 'Add Batch'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className={C + " p-4 shadow-sm"}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
        {showUserModal && <UserModal onClose={() => setShowUserModal(false)} onSave={u => { setUsers(p => [u, ...p]); setShowUserModal(false); }} />}
        {showBatchModal && <BatchModal onClose={() => setShowBatchModal(false)} onSave={b => { setBatches(p => [b, ...p]); setShowBatchModal(false); }} />}

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit mb-5">
          {['users', 'batches'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Search users..." />
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No users found</p>
            ) : (
              <div className={C + ' shadow-sm overflow-hidden'}>
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">All Users</h2>
                  <span className="text-xs text-gray-400">{users.length} users</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">#</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">User</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Role</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Batch</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Branch / Year</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Status</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {users.map((u, idx) => (
                        <tr key={u.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                          <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 text-xs font-medium">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{u.name}</p>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${roleColors[u.role] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {u.batch_name
                              ? <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2.5 py-1 rounded-full font-medium">{u.batch_name}</span>
                              : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">
                            {u.branch || '—'}{u.year ? ` · Year ${u.year}` : ''}
                          </td>
                          <td className="px-5 py-3.5">
                            <button onClick={() => toggleActive(u)}
                              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                                u.is_active
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                              }`}>
                              {u.is_active ? <><UserCheck size={11} /> Active</> : <><UserX size={11} /> Inactive</>}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => deleteUser(u)}
                              className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'batches' && (
          loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
          ) : batches.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">No batches yet</p>
          ) : (
            <div className={C + ' shadow-sm overflow-hidden'}>
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">All Batches</h2>
                <span className="text-xs text-gray-400">{batches.length} batches</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">#</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Batch Name</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Description</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Students</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Created</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {batches.map((b, idx) => (
                      <tr key={b.batch_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                        <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 text-xs font-medium">{idx + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {b.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{b.name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{b.description || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
                            {b.student_count ?? 0} students
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                          {b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => deleteBatch(b)}
                            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
