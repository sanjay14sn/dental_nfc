import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Plus, Edit2, Trash2, User, Check, X, Shield,
    Mail, Phone, Lock, Save, Search, MoreVertical,
    FileText, CreditCard, Activity, Calendar, Eye, PenTool
} from 'lucide-react';

export default function UserManagement() {
    const { user, patients, appointments } = useApp();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // Initial State & Config
    const initialForm = {
        name: '',
        username: '',
        password: '',
        role: 'doctor',
        phone: '',
        permissions: {
            payments: { read: true, write: true },
            bookings: { read: true, write: true },
            patients: { read: true, write: true },
            scans: { read: true, write: true },
            dentalChart: { read: true, write: true }
        }
    };

    const [formData, setFormData] = useState(initialForm);
    const API_BASE = 'http://localhost:5001/api';

    // Module Icons Mapping
    const MODULE_CONFIG = {
        payments: { label: 'Revenue & Payments', icon: CreditCard },
        bookings: { label: 'Appointments', icon: Calendar },
        patients: { label: 'Patient Records', icon: User },
        scans: { label: 'Medical Scans', icon: Activity },
        dentalChart: { label: 'Dental Charting', icon: FileText }
    };

    // Data Fetching
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

    // Handlers
    const togglePerm = (module, type) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [module]: {
                    ...prev.permissions[module],
                    [type]: !prev.permissions[module][type]
                }
            }
        }));
    };

    const getTargetHospitalId = () => {
        if (user?.hospitalId) return user.hospitalId;
        if (patients?.length > 0) return patients[0].hospitalId;
        if (appointments?.length > 0) return appointments[0].hospitalId;
        return null;
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
                    hospitalId: getTargetHospitalId()
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

    // Helper: Generate Initials
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-12 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Team Management
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Manage access, roles, and permissions for your medical staff.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Shield size={16} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">
                            {users.length} Active Accounts
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">

                    {/* Left Column: Form */}
                    <div className="xl:col-span-4 xl:sticky xl:top-8 z-10">
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {editingUser ? 'Edit Profile' : 'New User'}
                                    </h2>
                                    <p className="text-slate-400 text-xs mt-1">
                                        {editingUser ? 'Update credentials & access' : 'Onboard a new staff member'}
                                    </p>
                                </div>
                                {editingUser && (
                                    <button onClick={handleCancel} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Identity */}
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
                                            className="staff-input"
                                            style={{ paddingLeft: '1rem' }}
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

                                {/* Permissions */}
                                <div className="space-y-4 pt-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Module Permissions</label>
                                    <div className="space-y-3">
                                        {Object.entries(MODULE_CONFIG).map(([key, config]) => (
                                            <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-md text-indigo-500 shadow-sm border border-slate-100">
                                                        <config.icon size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{config.label}</span>
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
                                                                    ? (type === 'read' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600')
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

                                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                    {editingUser ? <Save size={20} /> : <Plus size={20} />}
                                    {editingUser ? 'Save Changes' : 'Create Account'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: User List */}
                    <div className="xl:col-span-8 space-y-6">
                        {/* Search / Filter Bar (Visual Only) */}
                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex-1 flex items-center gap-3 px-4">
                                <Search className="text-slate-400" size={20} />
                                <input type="text" placeholder="Search staff..." className="flex-1 py-2 outline-none text-sm placeholder:text-slate-400" />
                            </div>
                            <div className="hidden sm:flex gap-2 pr-2">
                                <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">Doctors</button>
                                <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">Admin</button>
                            </div>
                        </div>

                        {/* User Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {users.map(u => (
                                <div key={u._id} className={`
                                    staff-card relative transition-all duration-300 group
                                    ${editingUser === u._id ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-xl' : ''}
                                `}>
                                    {/* Card Header */}
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border-2 border-white shadow-md
                                                    ${u.role === 'admin' ? 'bg-gradient-to-br from-rose-400 to-red-600 text-white' :
                                                        u.role === 'doctor' ? 'bg-gradient-to-br from-indigo-400 to-blue-600 text-white' :
                                                            'bg-gradient-to-br from-emerald-400 to-teal-600 text-white'}
                                                `}>
                                                    {getInitials(u.name)}
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

                                    {/* Card Footer / Actions */}
                                    <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between rounded-b-2xl">
                                        <div className="flex gap-1">
                                            {/* Mini permission dots */}
                                            {Object.entries(u.permissions || {}).map(([key, p]) => (
                                                p.write && (
                                                    <div key={key} title={key} className="w-2 h-2 rounded-full bg-indigo-400" />
                                                )
                                            ))}
                                        </div>

                                        {confirmDeleteId === u._id ? (
                                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <span className="text-xs font-bold text-red-600 mr-2">Confirm?</span>
                                                <button onClick={() => setConfirmDeleteId(null)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                                                    <X size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(u._id)} className="p-2 bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 text-white shadow-md shadow-red-200 transition-colors">
                                                    <Check size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(u)} className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md transition-all">
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
        </div>
    );
}