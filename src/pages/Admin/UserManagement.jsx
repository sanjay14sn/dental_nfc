import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Plus, Edit2, Trash2, User, Check, X, Shield,
    Mail, Phone, Lock, Save, Search, Activity, Calendar, FileText, Eye, PenTool
} from 'lucide-react';

export default function UserManagement() {
    const { user, patients, appointments } = useApp();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState('all');

    const initialForm = {
        name: '',
        username: '',
        password: '',
        role: 'doctor',
        phone: '',
        permissions: {
            payments: { read: true, write: false },
            bookings: { read: true, write: true },
            patients: { read: true, write: true },
            scans: { read: true, write: false },
            dentalChart: { read: true, write: true }
        }
    };

    const [formData, setFormData] = useState(initialForm);
    const API_BASE = 'http://localhost:5001/api';

    const MODULE_CONFIG = {
        payments: { label: 'Revenue & Payments', icon: CreditCard },
        bookings: { label: 'Appointments', icon: Calendar },
        patients: { label: 'Patient Records', icon: User },
        scans: { label: 'Medical Scans', icon: Activity },
        dentalChart: { label: 'Dental Charting', icon: FileText }
    };

    const fetchUsers = async () => {
        if (!user?.token) return;
        try {
            const res = await fetch(`${API_BASE}/auth/users`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user?.token]);

    const togglePerm = (module, type) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [module]: { ...prev.permissions[module], [type]: !prev.permissions[module][type] }
            }
        }));
    };

    const handleEdit = (u) => {
        setEditingUser(u._id);
        setFormData({
            name: u.name,
            username: u.username,
            password: '',
            role: u.role,
            phone: u.phone || '',
            permissions: u.permissions || initialForm.permissions
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingUser(null);
        setFormData(initialForm);
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/auth/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                fetchUsers();
                setConfirmDeleteId(null);
            }
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingUser ? `${API_BASE}/auth/users/${editingUser}` : `${API_BASE}/auth/register`;
        const method = editingUser ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    ...formData,
                    hospitalId: user?.hospitalId || null
                })
            });

            if (res.ok) {
                setFormData(initialForm);
                setEditingUser(null);
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.message || 'Action failed');
            }
        } catch (err) {
            console.error('Submit failed', err);
        }
    };

    const filtered = users.filter(u => {
        const matchQ = !q || u.name?.toLowerCase().includes(q.toLowerCase()) || u.username?.toLowerCase().includes(q.toLowerCase()) || u.phone?.includes(q);
        const matchF = filter === 'all' || u.role === filter;
        return matchQ && matchF;
    });

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Team Management</h1>
                    <p className="page-subtitle">{users.length} total active medical staff</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Shield size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 uppercase">Admin Access</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                {/* Form Column */}
                <div className="xl:col-span-4 xl:sticky xl:top-8 z-10">
                    <div className="card shadow-xl border-slate-200 overflow-hidden">
                        <div className="p-5 bg-slate-800 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-base font-bold">
                                    {editingUser ? 'Edit Profile' : 'New User'}
                                </h2>
                                <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">
                                    {editingUser ? 'Update credentials' : 'Add staff member'}
                                </p>
                            </div>
                            {editingUser && (
                                <button onClick={handleCancel} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="staff-input-group">
                                <label>Provider Identity</label>
                                <div className="staff-input-wrapper">
                                    <User className="staff-input-icon" size={20} />
                                    <input
                                        type="text" required value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="staff-input"
                                        placeholder="Full Professional Name"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="staff-input-group">
                                    <label>Clinic Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="staff-input !pl-4"
                                    >
                                        <option value="doctor">Doctor</option>
                                        <option value="nurse">Nurse</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                                <div className="staff-input-group">
                                    <label>Contact Phone</label>
                                    <div className="staff-input-wrapper">
                                        <Phone className="staff-input-icon" size={18} />
                                        <input
                                            type="text" value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="staff-input"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <div className="staff-input-group mt-4">
                                    <label>System Access (Email)</label>
                                    <div className="staff-input-wrapper">
                                        <Mail className="staff-input-icon" size={18} />
                                        <input
                                            type="email" required value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            className="staff-input"
                                            placeholder="Professional Email"
                                        />
                                    </div>
                                </div>
                                <div className="staff-input-group">
                                    <label>Secure Credentials</label>
                                    <div className="staff-input-wrapper">
                                        <Lock className="staff-input-icon" size={18} />
                                        <input
                                            type="password" required={!editingUser} value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="staff-input"
                                            placeholder={editingUser ? "•••••••• (Keep Existing)" : "•••••••• (New Key)"}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Module Permissions</label>
                                <div className="space-y-3">
                                    {Object.entries(MODULE_CONFIG).map(([key, config]) => (
                                        <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-md text-blue-500 shadow-sm border border-slate-100">
                                                    <config.icon size={16} />
                                                </div>
                                                <span className="text-xs font-medium text-slate-700">{config.label}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {['read', 'write'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => togglePerm(key, type)}
                                                        className={`
                                                            relative px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all border
                                                            ${formData.permissions[key][type]
                                                                ? (type === 'read' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-blue-600 border-blue-600 text-white')
                                                                : 'bg-white border-slate-200 text-slate-300 hover:border-slate-300'}
                                                        `}
                                                    >
                                                        {type === 'read' ? <Eye size={12} className="inline mr-1" /> : <PenTool size={12} className="inline mr-1" />}
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-full py-3.5 !justify-center">
                                {editingUser ? <Save size={18} /> : <Plus size={18} />}
                                {editingUser ? 'Save Changes' : 'Create Account'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: User List */}
                <div className="xl:col-span-8 space-y-6">
                    {/* Toolbar */}
                    <div className="toolbar">
                        <div className="search-bar-inline">
                            <Search size={15} />
                            <input
                                placeholder="Search by name, email, phone..."
                                value={q}
                                onChange={e => setQ(e.target.value)}
                            />
                        </div>
                        <div className="filter-tabs">
                            {['all', 'doctor', 'nurse', 'admin'].map(f => (
                                <button
                                    key={f}
                                    className={`filter-tab ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filtered.length === 0 && (
                            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                                <div className="text-slate-400 mb-2"><Search size={40} /></div>
                                <p>No staff members found matching your search.</p>
                                <button className="btn btn-ghost btn-sm text-blue-600" onClick={() => { setQ(''); setFilter('all'); }}>Clear Filters</button>
                            </div>
                        )}
                        {filtered.map(u => (
                            <div key={u._id} className={`
                                staff-card relative transition-all duration-300 group
                                ${editingUser === u._id ? 'ring-2 ring-blue-500 shadow-lg' : ''}
                            `}>
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm text-white" style={{
                                                background: u.role === 'admin' ? 'linear-gradient(135deg,#f87171,#dc2626)' :
                                                    u.role === 'doctor' ? 'linear-gradient(135deg,#3b82f6,#93c5fd)' :
                                                        'linear-gradient(135deg,#34d399,#10b981)'
                                            }}>
                                                {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg leading-tight">{u.name}</h3>
                                                <span className={`
                                                    staff-badge mt-1 inline-block
                                                    ${u.role === 'admin' ? 'staff-badge-admin' :
                                                        u.role === 'doctor' ? 'staff-badge-doctor' :
                                                            'staff-badge-nurse'}
                                                `}>
                                                    {u.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-slate-400" />
                                            <span className="truncate">{u.username}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-slate-400" />
                                            <span>{u.phone || 'No contact info'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between rounded-b-2xl">
                                    <div className="flex gap-1">
                                        {Object.entries(u.permissions || {}).map(([key, p]) => (
                                            p.write && (
                                                <div key={key} title={key} className="w-2 h-2 rounded-full bg-blue-400" />
                                            )
                                        ))}
                                    </div>

                                    {confirmDeleteId === u._id ? (
                                        <div className="flex items-center gap-2 animate-in">
                                            <span className="text-[10px] font-bold text-red-600 mr-2">Confirm?</span>
                                            <button onClick={() => setConfirmDeleteId(null)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                                                <X size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(u._id)} className="p-2 bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 text-white shadow-md shadow-red-200 transition-colors">
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(u)} className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => setConfirmDeleteId(u._id)} className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:border-rose-300 hover:text-rose-600 hover:shadow-md transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const CreditCard = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
);