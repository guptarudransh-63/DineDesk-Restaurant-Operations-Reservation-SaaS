import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New staff modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('waiter');
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/staff');
      setStaffList(res.data.data);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/staff', {
        name,
        email,
        password,
        phone,
        role,
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/staff/${staffId}/status`, { status: nextStatus });
      setStaffList((prev) =>
        prev.map((s) => (s._id === staffId ? { ...s, status: nextStatus } : s))
      );
    } catch (err) {
      alert('Failed to update staff status.');
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'manager':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'kitchen':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'cashier':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'waiter':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl font-bold font-display text-stone-100">
                Staff Accounts & Role-Based Access
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Role definitions: Administrator, Manager, Captain/Waiter, Head Chef, and Cashier
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/10"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Staff Name & Contact</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Registered</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {staffList.map((member) => (
                <tr key={member._id} className="hover:bg-stone-800/40 transition">
                  <td className="p-3.5">
                    <p className="font-bold text-stone-200 text-sm">{member.name}</p>
                    <p className="text-stone-400 text-[11px]">{member.email}</p>
                    {member.phone && <p className="text-stone-500 text-[10px]">{member.phone}</p>}
                  </td>

                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        member.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {member.status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Inactive
                        </>
                      )}
                    </span>
                  </td>

                  <td className="p-3.5 text-stone-400">
                    {new Date(member.createdAt).toLocaleDateString('en-IN')}
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleToggleStatus(member._id, member.status)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        member.status === 'active'
                          ? 'bg-stone-800 hover:bg-rose-500/20 text-stone-300 hover:text-rose-300'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {member.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Staff Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-base font-bold text-stone-100">Add Staff Account</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Arjun Nair"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arjun@dinedesk.com"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Role *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500 capitalize"
                    >
                      <option value="waiter">Captain / Waiter</option>
                      <option value="kitchen">Kitchen Chef</option>
                      <option value="cashier">Billing Cashier</option>
                      <option value="manager">Restaurant Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98450 00000"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
