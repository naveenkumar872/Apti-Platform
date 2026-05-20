import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, UserCheck, UserX } from 'lucide-react';

const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Other'];
const ROLES = ['student', 'teacher'];

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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="font-semibold text-gray-800 text-lg mb-4">Create User</h2>
        <div className="space-y-3">
          {[['Name *', 'name', 'text', 'Full name'], ['Email *', 'email', 'email', 'Email address'], ['Password *', 'password', 'password', 'Min 8 chars']].map(([lbl, key, type, ph]) => (
            <div key={key}>
              <label className="block text-xs text-gray-600 mb-1">{lbl}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                placeholder={ph} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Year</label>
              <select value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Branch</label>
            <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">-- Select branch --</option>
              {BRANCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-60">
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="font-semibold text-gray-800 text-lg mb-4">Create Batch</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Batch Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="e.g., 2025-CSE-A" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Optional description" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-60">
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

  const roleColors = { student: 'bg-blue-100 text-blue-700', teacher: 'bg-purple-100 text-purple-700', admin: 'bg-red-100 text-red-700' };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users & Batches</h1>
        <button
          onClick={() => tab === 'users' ? setShowUserModal(true) : setShowBatchModal(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> {tab === 'users' ? 'Add User' : 'Add Batch'}
        </button>
      </div>

      {showUserModal && <UserModal onClose={() => setShowUserModal(false)} onSave={u => { setUsers(p => [u, ...p]); setShowUserModal(false); }} />}
      {showBatchModal && <BatchModal onClose={() => setShowBatchModal(false)} onSave={b => { setBatches(p => [b, ...p]); setShowBatchModal(false); }} />}

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-4">
        {['users', 'batches'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none"
              placeholder="Search users..." />
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl" />)}</div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.user_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[u.role] || 'bg-gray-100'}`}>{u.role}</span>
                  <button onClick={() => toggleActive(u)} className={`p-1.5 rounded-lg ${u.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-400 hover:bg-red-50'}`}>
                    {u.is_active ? <UserCheck size={16} /> : <UserX size={16} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'batches' && (
        loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}</div>
        ) : batches.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No batches yet</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map(b => (
              <div key={b.batch_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="font-semibold text-gray-800">{b.name}</p>
                {b.description && <p className="text-xs text-gray-500 mt-1">{b.description}</p>}
                <p className="text-xs text-gray-400 mt-2">{b.student_count ?? 0} students</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
