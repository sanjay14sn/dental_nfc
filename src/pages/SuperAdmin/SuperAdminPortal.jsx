import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
    Plus, Edit2, Trash2, Hospital as HospitalIcon,
    Check, X, Users, LayoutDashboard, LogOut,
    ShieldCheck, Activity, Search, Bell
} from 'lucide-react';

export default function SuperAdminPortal() {
    const { user, logout } = useApp();
    const navigate = useNavigate();
    const [tab, setTab] = useState('hospitals');
    const [hospitals, setHospitals] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', doctorName: '', address: '', contact: '', email: '', password: ''
    });
    const [staffFormData, setStaffFormData] = useState({
        name: '', username: '', password: '', role: 'doctor', hospitalId: '', phone: ''
    });

    const API_BASE = 'http://localhost:5001/api';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [hRes, uRes] = await Promise.all([
                fetch(`${API_BASE}/hospitals`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }),
                fetch(`${API_BASE}/auth/users`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                })
            ]);

            const [hData, uData] = await Promise.all([hRes.json(), uRes.json()]);
            setHospitals(hData);
            setUsers(uData);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editing ? 'PUT' : 'POST';
        const url = editing ? `${API_BASE}/hospitals/${editing}` : `${API_BASE}/hospitals`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.message || 'Failed to save hospital');
                return;
            }

            setFormData({ name: '', doctorName: '', address: '', contact: '', email: '', password: '' });
            setEditing(null);
            setShowForm(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save hospital', err);
        }
    };

    const handleStaffSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(staffFormData)
            });

            if (res.ok) {
                setStaffFormData({ name: '', username: '', password: '', role: 'doctor', hospitalId: '', phone: '' });
                setShowForm(false);
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to register staff');
            }
        } catch (err) {
            console.error('Failed to register staff', err);
        }
    };

    const handleDeleteHospital = async (id) => {
        if (!window.confirm('Are you sure you want to delete this hospital? This action cannot be undone.')) return;

        try {
            const res = await fetch(`${API_BASE}/hospitals/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete hospital');
            }
        } catch (err) {
            console.error('Failed to delete hospital', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-pulse text-blue-600 font-medium">Loading Central Control...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
            {/* Top Navigation */}
            <header className="app-header">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">DentaFlow <span className="text-blue-600">Central</span></h1>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold -mt-1">Super Admin Portal</p>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="text-right mr-2 hidden sm:block">
                        <div className="text-sm font-semibold">{user?.name}</div>
                        <div className="text-[11px] text-slate-500 uppercase font-bold">Global Authority</div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </header>

            <main className="page">
                {/* Dashboard Stats */}
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-icon blue">
                            <HospitalIcon size={24} />
                        </div>
                        <div className="kpi-info">
                            <div className="kpi-label uppercase tracking-widest text-[10px]">Active Units</div>
                            <div className="kpi-value">{hospitals.length}</div>
                            <div className="kpi-label mt-1">Hospitals registered globally</div>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon yellow">
                            <Users size={24} />
                        </div>
                        <div className="kpi-info">
                            <div className="kpi-label uppercase tracking-widest text-[10px]">Total Staff</div>
                            <div className="kpi-value">{users.length}</div>
                            <div className="kpi-label mt-1">Doctors & Admins across units</div>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon green">
                            <Activity size={24} />
                        </div>
                        <div className="kpi-info">
                            <div className="kpi-label uppercase tracking-widest text-[10px]">System Health</div>
                            <div className="kpi-value text-emerald-600">Stable</div>
                            <div className="kpi-label mt-1">All services operational</div>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex gap-1 bg-slate-200/50 p-1 rounded-2xl w-fit mb-8">
                    <button
                        onClick={() => { setTab('hospitals'); setShowForm(false); }}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'hospitals' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Hospital Network
                    </button>
                    <button
                        onClick={() => { setTab('staff'); setShowForm(false); }}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'staff' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Global Staff List
                    </button>
                </div>

                {tab === 'hospitals' && (
                    <div className="space-y-6">
                        <div className="page-header">
                            <div>
                                <h2 className="page-title">Hospital Network</h2>
                                <p className="page-subtitle">Manage all clinical units in your network</p>
                            </div>
                            <button
                                onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', doctorName: '', address: '', contact: '', email: '', password: '' }); }}
                                className="btn btn-primary"
                            >
                                <Plus size={18} />
                                Register New hospital
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hospitals.map(h => (
                                <div key={h._id} className="card group relative overflow-hidden">
                                    <div className="card-body">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                            <button
                                                onClick={() => { setEditing(h._id); setFormData(h); setShowForm(true); }}
                                                className="btn btn-icon btn-secondary btn-sm"
                                                title="Edit Hospital"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHospital(h._id)}
                                                className="btn btn-icon btn-secondary btn-sm text-red-500 hover:bg-red-50"
                                                title="Delete Hospital"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                                <HospitalIcon size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{h.name}</h3>
                                                <p className="text-sm text-slate-500">Unit ID: {h._id.slice(-6)}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center text-slate-400">
                                                    <Users size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700">Dr. {h.doctorName}</div>
                                                    <div className="text-[11px] text-slate-400 uppercase font-bold">Lead Clinician</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center text-slate-400">
                                                    <Check size={14} />
                                                </div>
                                                <span>{h.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'staff' && (
                    <div className="space-y-6">
                        <div className="page-header">
                            <div>
                                <h2 className="page-title">Global Clinical Staff</h2>
                                <p className="page-subtitle">Overview of all personnel across units</p>
                            </div>
                            <button
                                onClick={() => { setShowForm(true); setEditing(null); setStaffFormData({ name: '', username: '', password: '', role: 'doctor', hospitalId: '', phone: '' }); }}
                                className="btn btn-primary"
                            >
                                <Plus size={18} />
                                Add Staff Member
                            </button>
                        </div>

                        <div className="card">
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Full Name</th>
                                            <th>Role</th>
                                            <th>Unit Access</th>
                                            <th>Contact</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id}>
                                                <td>
                                                    <div className="font-bold text-slate-800">{u.name}</div>
                                                    <div className="text-xs text-slate-400">{u.username}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${u.role === 'admin' ? 'badge-blue' :
                                                        u.role === 'superadmin' ? 'badge-yellow' : 'badge-gray'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="text-slate-600">
                                                    {u.hospitalId ? hospitals.find(h => h._id === u.hospitalId)?.name || 'Direct Unit' : 'Global Access'}
                                                </td>
                                                <td className="text-slate-500">{u.phone || 'N/A'}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                        <span className="text-xs font-semibold text-slate-700">Active</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Registration Modals */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-slate-800">
                                {tab === 'hospitals' ? (editing ? 'Modify Unit' : 'Register New Unit') : 'Add Staff Member'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="btn btn-icon btn-ghost">
                                <X size={24} />
                            </button>
                        </div>

                        {tab === 'hospitals' ? (
                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-grid">
                                    <div className="form-full">
                                        <label className="form-label">Hospital Name</label>
                                        <input
                                            type="text" required value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="form-control"
                                            placeholder="City General Dental"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Doctor Name</label>
                                        <input
                                            type="text" required value={formData.doctorName}
                                            onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                                            className="form-control"
                                            placeholder="Dr. Smith"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Number</label>
                                        <input
                                            type="text" required value={formData.contact}
                                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                            className="form-control"
                                            placeholder="+91..."
                                        />
                                    </div>
                                    <div className="form-full">
                                        <label className="form-label">Mail ID (Login Username)</label>
                                        <input
                                            type="email" required value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="form-control"
                                            placeholder="hospital@email.com"
                                        />
                                    </div>
                                    {!editing && (
                                        <div className="form-full">
                                            <label className="form-label">Password</label>
                                            <input
                                                type="password" required value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="form-control"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    )}
                                    <div className="form-full">
                                        <label className="form-label">Address</label>
                                        <textarea
                                            required value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="form-control"
                                            placeholder="Hospital location..."
                                        />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        {editing ? 'Apply Changes' : 'Confirm Registration'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleStaffSubmit} className="modal-form">
                                <div className="form-grid">
                                    <div className="form-full">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text" required value={staffFormData.name}
                                            onChange={e => setStaffFormData({ ...staffFormData, name: e.target.value })}
                                            className="form-control"
                                            placeholder="Dr. John Doe"
                                        />
                                    </div>
                                    <div className="form-full">
                                        <label className="form-label">Mail ID (Login Username)</label>
                                        <input
                                            type="email" required value={staffFormData.username}
                                            onChange={e => setStaffFormData({ ...staffFormData, username: e.target.value })}
                                            className="form-control"
                                            placeholder="doctor@email.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Password</label>
                                        <input
                                            type="password" required value={staffFormData.password}
                                            onChange={e => setStaffFormData({ ...staffFormData, password: e.target.value })}
                                            className="form-control"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Number</label>
                                        <input
                                            type="text" value={staffFormData.phone}
                                            onChange={e => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                                            className="form-control"
                                            placeholder="+91..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <select
                                            value={staffFormData.role}
                                            onChange={e => setStaffFormData({ ...staffFormData, role: e.target.value })}
                                            className="form-control"
                                        >
                                            <option value="doctor">Doctor</option>
                                            <option value="admin">Clinic Admin</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Assign to Hospital</label>
                                        <select
                                            required
                                            value={staffFormData.hospitalId}
                                            onChange={e => setStaffFormData({ ...staffFormData, hospitalId: e.target.value })}
                                            className="form-control"
                                        >
                                            <option value="">Select Hospital</option>
                                            {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        Register Staff Member
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
