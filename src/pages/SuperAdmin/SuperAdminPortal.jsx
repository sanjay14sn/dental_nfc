import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
    Plus, Edit2, Trash2, X, LogOut, ShieldCheck,
    Users, Activity, Search, Building2, UserPlus,
    Phone, Mail, MapPin, Calendar, CreditCard,
    ChevronRight, User, Stethoscope, Check, AlertTriangle, BarChart2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const API = 'http://localhost:5001/api';

// ── helpers ────────────────────────────────────────────────────────────────────
const authHeaders = (token) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
});
const get = (url, token) => fetch(url, { headers: authHeaders(token) });

const ROLE_COLORS = {
    admin: { bg: '#fff1f2', color: '#f43f5e', border: '#fecdd3' },
    doctor: { bg: '#eef2ff', color: '#6366f1', border: '#c7d2fe' },
    nurse: { bg: '#ecfdf5', color: '#10b981', border: '#a7f3d0' },
    superadmin: { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' },
};

const initials = (name = '') => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

const StatBadge = ({ icon: Icon, value, label, color = '#6366f1', bg = '#eef2ff' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: bg, borderRadius: 10 }}>
        <Icon size={14} color={color} />
        <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        </div>
    </div>
);

// ── Drawer ─────────────────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, subtitle, children }) {
    if (!open) return null;
    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, maxWidth: '95vw',
                background: '#fff', zIndex: 201, overflowY: 'auto',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'linear-gradient(135deg,#1e293b,#0f172a)', color: '#fff' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 2 }}>{title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{subtitle}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 8, padding: 8, display: 'flex' }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ flex: 1, padding: 24 }}>{children}</div>
            </div>
        </>
    );
}

// ── Delete confirm modal ───────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, name }) {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <AlertTriangle size={24} color="#f43f5e" />
                    </div>
                    <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Delete Hospital?</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        This will permanently delete <strong>{name}</strong> and all its data. This cannot be undone.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                    <button onClick={onConfirm} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>Yes, Delete</button>
                </div>
            </div>
        </div>
    );
}

// ── Main Portal ────────────────────────────────────────────────────────────────
export default function SuperAdminPortal() {
    const { user, logout } = useApp();
    const navigate = useNavigate();

    const [tab, setTab] = useState('hospitals');
    const [hospitals, setHospitals] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allPatients, setAllPatients] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [allBills, setAllBills] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hospital form
    const [showHospForm, setShowHospForm] = useState(false);
    const [editingHosp, setEditingHosp] = useState(null);
    const [hospForm, setHospForm] = useState({ name: '', doctorName: '', address: '', contact: '', email: '', password: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Staff form
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [staffForm, setStaffForm] = useState({ name: '', username: '', password: '', role: 'doctor', hospitalId: '', phone: '' });

    // Drawer state
    const [drawer, setDrawer] = useState({ open: false, type: null, hospital: null });

    // Search
    const [search, setSearch] = useState('');

    // ── fetch all ──────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const token = user?.token;
            const [hR, uR, pR, aR, bR] = await Promise.all([
                get(`${API}/hospitals`, token),
                get(`${API}/auth/users`, token),
                get(`${API}/patients`, token),
                get(`${API}/appointments`, token),
                get(`${API}/bills`, token),
            ]);
            const [h, u, p, a, b] = await Promise.all([
                hR.ok ? hR.json() : [],
                uR.ok ? uR.json() : [],
                pR.ok ? pR.json() : [],
                aR.ok ? aR.json() : [],
                bR.ok ? bR.json() : [],
            ]);
            setHospitals(Array.isArray(h) ? h : []);
            setAllUsers(Array.isArray(u) ? u : []);
            setAllPatients(Array.isArray(p) ? p : []);
            setAllAppointments(Array.isArray(a) ? a : []);
            setAllBills(Array.isArray(b) ? b : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user?.token]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── per-hospital slices ────────────────────────────────────────────────────
    const hStaff = (hid) => allUsers.filter(u => u.hospitalId === hid || u.hospitalId?._id === hid);
    const hPatients = (hid) => allPatients.filter(p => p.hospitalId === hid || p.hospitalId?._id === hid);
    const hAppts = (hid) => allAppointments.filter(a => a.hospitalId === hid || a.hospitalId?._id === hid);
    const hBills = (hid) => allBills.filter(b => b.hospitalId === hid || b.hospitalId?._id === hid);
    const hRevenue = (hid) => hBills(hid).reduce((s, b) => s + (b.total || b.amount || 0), 0);

    // Today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppts = allAppointments.filter(a => (a.date || '').startsWith(todayStr));

    // ── hospital CRUD ──────────────────────────────────────────────────────────
    const submitHosp = async (e) => {
        e.preventDefault();
        const url = editingHosp ? `${API}/hospitals/${editingHosp}` : `${API}/hospitals`;
        const method = editingHosp ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: authHeaders(user.token), body: JSON.stringify(hospForm) });
            if (!res.ok) { const d = await res.json(); alert(d.message || 'Failed'); return; }
            setShowHospForm(false); setEditingHosp(null);
            setHospForm({ name: '', doctorName: '', address: '', contact: '', email: '', password: '' });
            fetchAll();
        } catch (e) { console.error(e); }
    };

    const deleteHosp = async () => {
        try {
            const res = await fetch(`${API}/hospitals/${deleteTarget._id}`, { method: 'DELETE', headers: authHeaders(user.token) });
            if (res.ok) { setDeleteTarget(null); fetchAll(); }
            else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (e) { console.error(e); }
    };

    // ── staff CRUD ─────────────────────────────────────────────────────────────
    const submitStaff = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/auth/register`, { method: 'POST', headers: authHeaders(user.token), body: JSON.stringify(staffForm) });
            if (res.ok) { setShowStaffForm(false); setStaffForm({ name: '', username: '', password: '', role: 'doctor', hospitalId: '', phone: '' }); fetchAll(); }
            else { const d = await res.json(); alert(d.message || 'Failed'); }
        } catch (e) { console.error(e); }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Remove this staff member?')) return;
        try {
            const res = await fetch(`${API}/auth/users/${id}`, { method: 'DELETE', headers: authHeaders(user.token) });
            if (res.ok) fetchAll();
        } catch (e) { console.error(e); }
    };

    // ── filtered lists ─────────────────────────────────────────────────────────
    const q = search.toLowerCase();
    const filteredHosp = hospitals.filter(h => !q || h.name?.toLowerCase().includes(q) || h.doctorName?.toLowerCase().includes(q) || h.address?.toLowerCase().includes(q));
    const filteredUsers = allUsers.filter(u => !q || u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.role?.includes(q));
    const filteredPatients = allPatients.filter(p => !q || p.name?.toLowerCase().includes(q) || p.phone?.includes(q));
    const filteredAppts = allAppointments.filter(a => !q || a.patientName?.toLowerCase().includes(q) || a.treatmentType?.toLowerCase().includes(q));

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Loading Central Control...</div>
            </div>
        </div>
    );

    const totalRevenue = allBills.reduce((s, b) => s + (b.total || b.amount || 0), 0);

    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

            {/* ── Header ── */}
            <header className="app-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>DentaFlow <span style={{ color: 'var(--primary)' }}>Central</span></div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Super Admin Portal</div>
                    </div>
                </div>

                <div style={{ flex: 1, maxWidth: 360, margin: '0 24px', position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="form-control"
                        style={{ paddingLeft: 34, fontSize: '0.82rem' }}
                        placeholder="Search hospitals, staff, patients…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6366f1' }}>Global Authority</div>
                    </div>
                    <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary btn-sm">
                        <LogOut size={15} /> Sign Out
                    </button>
                </div>
            </header>

            <div className="page">

                {/* ── Global KPIs ── */}
                <div className="kpi-grid" style={{ marginBottom: 24 }}>
                    {[
                        { label: 'Hospitals', value: hospitals.length, icon: Building2, cls: 'blue' },
                        { label: 'Total Staff', value: allUsers.length, icon: Users, cls: 'yellow' },
                        { label: 'Total Patients', value: allPatients.length, icon: User, cls: 'green' },
                        { label: "Today's Appts", value: todayAppts.length, icon: Calendar, cls: 'cyan' },
                        { label: 'Total Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}k`, icon: CreditCard, cls: 'red' },
                    ].map(({ label, value, icon: Icon, cls }) => (
                        <div key={label} className="kpi-card">
                            <div className={`kpi-icon ${cls}`}><Icon size={22} /></div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                                <div className="kpi-value">{value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Tabs ── */}
                <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 14, width: 'fit-content', marginBottom: 24 }}>
                    {[
                        { id: 'hospitals', label: 'Hospital Network' },
                        { id: 'staff', label: 'All Staff' },
                        { id: 'patients', label: 'All Patients' },
                        { id: 'appointments', label: 'Appointments' },
                        { id: 'analytics', label: '📊 Analytics' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={{
                                padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
                                background: tab === t.id ? '#fff' : 'transparent',
                                color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                            }}
                        >{t.label}</button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════════
                    TAB: HOSPITAL NETWORK
                ══════════════════════════════════════════════════ */}
                {tab === 'hospitals' && (
                    <div>
                        <div className="page-header">
                            <div>
                                <h2 className="page-title">Hospital Network</h2>
                                <p className="page-subtitle">{filteredHosp.length} clinic{filteredHosp.length !== 1 ? 's' : ''} registered</p>
                            </div>
                            <button onClick={() => { setShowHospForm(true); setEditingHosp(null); setHospForm({ name: '', doctorName: '', address: '', contact: '', email: '', password: '' }); }} className="btn btn-primary">
                                <Plus size={16} /> Register Hospital
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                            {filteredHosp.map(h => {
                                const staff = hStaff(h._id);
                                const patients = hPatients(h._id);
                                const appts = hAppts(h._id);
                                const revenue = hRevenue(h._id);

                                return (
                                    <div key={h._id} className="card" style={{ overflow: 'hidden' }}>
                                        {/* Card header */}
                                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                                        <Building2 size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>{h.name}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID: #{h._id?.slice(-6).toUpperCase()}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        onClick={() => { setEditingHosp(h._id); setHospForm({ name: h.name, doctorName: h.doctorName, address: h.address, contact: h.contact, email: h.email, password: '' }); setShowHospForm(true); }}
                                                        className="btn btn-secondary btn-sm btn-icon" title="Edit"
                                                    ><Edit2 size={14} /></button>
                                                    <button onClick={() => setDeleteTarget(h)} className="btn btn-secondary btn-sm btn-icon" style={{ color: '#f43f5e' }} title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Contact info */}
                                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {h.doctorName && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        <Stethoscope size={12} /> Dr. {h.doctorName}
                                                    </div>
                                                )}
                                                {h.email && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        <Mail size={12} /> {h.email}
                                                    </div>
                                                )}
                                                {h.contact && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        <Phone size={12} /> {h.contact}
                                                    </div>
                                                )}
                                                {h.address && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        <MapPin size={12} /> {h.address}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div style={{ padding: '12px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--bg)' }}>
                                            <StatBadge icon={Users} value={staff.length} label="Staff" color="#6366f1" bg="#eef2ff" />
                                            <StatBadge icon={User} value={patients.length} label="Patients" color="#0ea5e9" bg="#f0f9ff" />
                                            <StatBadge icon={Calendar} value={appts.length} label="Appts" color="#f59e0b" bg="#fffbeb" />
                                            <StatBadge icon={CreditCard} value={`₹${(revenue / 1000).toFixed(1)}k`} label="Revenue" color="#10b981" bg="#ecfdf5" />
                                        </div>

                                        {/* Action buttons */}
                                        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                                            <button onClick={() => setDrawer({ open: true, type: 'staff', hospital: h })} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                                                <Users size={13} /> Staff <ChevronRight size={13} />
                                            </button>
                                            <button onClick={() => setDrawer({ open: true, type: 'patients', hospital: h })} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                                                <User size={13} /> Patients <ChevronRight size={13} />
                                            </button>
                                            <button onClick={() => setDrawer({ open: true, type: 'appts', hospital: h })} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                                                <Calendar size={13} /> Appts <ChevronRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredHosp.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 'var(--radius)', border: '1.5px dashed var(--border)' }}>
                                <Building2 size={48} style={{ color: 'var(--border)', marginBottom: 12 }} />
                                <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No hospitals found</div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    TAB: ALL STAFF
                ══════════════════════════════════════════════════ */}
                {tab === 'staff' && (
                    <div>
                        <div className="page-header">
                            <div>
                                <h2 className="page-title">Global Clinical Staff</h2>
                                <p className="page-subtitle">{filteredUsers.length} staff members across all clinics</p>
                            </div>
                            <button onClick={() => { setShowStaffForm(true); setStaffForm({ name: '', username: '', password: '', role: 'doctor', hospitalId: '', phone: '' }); }} className="btn btn-primary">
                                <UserPlus size={16} /> Add Staff
                            </button>
                        </div>
                        <div className="card">
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Clinic</th>
                                            <th>Username</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(u => {
                                            const meta = ROLE_COLORS[u.role] || ROLE_COLORS.nurse;
                                            const clinic = hospitals.find(h => h._id === u.hospitalId || h._id === u.hospitalId?._id);
                                            return (
                                                <tr key={u._id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ width: 32, height: 32, borderRadius: 10, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem' }}>
                                                                {initials(u.name)}
                                                            </div>
                                                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{clinic?.name || <em>Global</em>}</td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{u.username}</td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{u.phone || '—'}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Active</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {u.role !== 'superadmin' && (
                                                            <button onClick={() => deleteUser(u._id)} className="btn btn-secondary btn-sm btn-icon" style={{ color: '#f43f5e' }}>
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    TAB: ALL PATIENTS
                ══════════════════════════════════════════════════ */}
                {tab === 'patients' && (
                    <div>
                        <div className="page-header">
                            <div>
                                <h2 className="page-title">All Patients</h2>
                                <p className="page-subtitle">{filteredPatients.length} patients across all clinics</p>
                            </div>
                        </div>
                        <div className="card">
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Phone</th>
                                            <th>Gender</th>
                                            <th>Blood Group</th>
                                            <th>Clinic</th>
                                            <th>NFC ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPatients.map(p => {
                                            const clinic = hospitals.find(h => h._id === p.hospitalId || h._id === p.hospitalId?._id);
                                            const gColor = p.gender === 'Female' ? '#be185d' : p.gender === 'Male' ? '#1d4ed8' : '#7e22ce';
                                            const gBg = p.gender === 'Female' ? '#fce7f3' : p.gender === 'Male' ? '#dbeafe' : '#f3e8ff';
                                            return (
                                                <tr key={p._id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: gBg, color: gColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem' }}>
                                                                {initials(p.name)}
                                                            </div>
                                                            <span style={{ fontWeight: 600 }}>{p.name}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.phone || p.contact || '—'}</td>
                                                    <td><span className="badge badge-gray" style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>{p.gender || '—'}</span></td>
                                                    <td style={{ fontWeight: 700, color: '#f43f5e' }}>{p.bloodGroup || '—'}</td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{clinic?.name || '—'}</td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.nfcId || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════
                    TAB: APPOINTMENTS
                ══════════════════════════════════════════════════ */}
                {tab === 'appointments' && (
                    <div>
                        <div className="page-header">
                            <div>
                                <h2 className="page-title">All Appointments</h2>
                                <p className="page-subtitle">{filteredAppts.length} total · {todayAppts.length} today</p>
                            </div>
                        </div>
                        <div className="card">
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Treatment</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Status</th>
                                            <th>Clinic</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAppts.map(a => {
                                            const clinic = hospitals.find(h => h._id === a.hospitalId || h._id === a.hospitalId?._id);
                                            const STATUS_COLORS = {
                                                scheduled: '#3b82f6',
                                                waiting: '#f59e0b',
                                                'in-treatment': '#8b5cf6',
                                                completed: '#22c55e',
                                                cancelled: '#ef4444',
                                            };
                                            const sc = STATUS_COLORS[a.status] || '#64748b';
                                            return (
                                                <tr key={a._id}>
                                                    <td style={{ fontWeight: 600 }}>{a.patientName || 'Unknown'}</td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{a.treatmentType || a.reason || '—'}</td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{(a.date || '').split('T')[0]}</td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{a.time || '—'}</td>
                                                    <td>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: `${sc}15`, color: sc, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                                                            {a.status || 'scheduled'}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{clinic?.name || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════
                    TAB: ANALYTICS
                ══════════════════════════════════════════════════ */}
            {tab === 'analytics' && (() => {
                // --- data prep ---
                const CHART_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

                // per-hospital bar data
                const hospBarData = hospitals.map((h, i) => ({
                    name: h.name.length > 12 ? h.name.slice(0, 12) + '…' : h.name,
                    Staff: hStaff(h._id).length,
                    Patients: hPatients(h._id).length,
                    Appointments: hAppts(h._id).length,
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                }));

                // role pie
                const roleCounts = allUsers.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
                const rolePie = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

                // appointment status pie
                const statusCounts = allAppointments.reduce((acc, a) => { const s = a.status || 'scheduled'; acc[s] = (acc[s] || 0) + 1; return acc; }, {});
                const statusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

                // clinic leaderboard sorted by patients
                const ranked = [...hospitals].sort((a, b) => hPatients(b._id).length - hPatients(a._id).length);

                // custom tooltip
                const CustomTooltip = ({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                        <div style={{ background: '#1e293b', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#f8fafc', fontSize: '0.8rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                            <div style={{ fontWeight: 700, marginBottom: 6, color: '#94a3b8' }}>{label}</div>
                            {payload.map(p => (
                                <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill }} />
                                    <span>{p.name}: <strong>{p.value}</strong></span>
                                </div>
                            ))}
                        </div>
                    );
                };

                return (
                    <div>
                        <div className="page-header" style={{ marginBottom: 24 }}>
                            <div>
                                <h2 className="page-title">Analytics Dashboard</h2>
                                <p className="page-subtitle">Live insights across all {hospitals.length} clinics</p>
                            </div>
                        </div>

                        {/* Row 1: Bar charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

                            {/* Patients per clinic */}
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>Patients per Clinic</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>Total registered patients by hospital</div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={hospBarData} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="Patients" radius={[6, 6, 0, 0]}>
                                            {hospBarData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Staff per clinic */}
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>Staff per Clinic</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>Enrolled staff members per hospital</div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={hospBarData} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="Staff" radius={[6, 6, 0, 0]}>
                                            {hospBarData.map((e, i) => <Cell key={i} fill={['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#0ea5e9'][i % 7]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Row 2: Pie charts + grouped bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 20, marginBottom: 20 }}>

                            {/* Role distribution pie */}
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>Staff Role Mix</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Across all clinics</div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={rolePie} cx="50%" cy="45%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                            {rolePie.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Appointment status pie */}
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>Appointment Status</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Global breakdown</div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={statusPie} cx="50%" cy="45%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                            {statusPie.map((e, i) => <Cell key={i} fill={['#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444'][i % 5]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Grouped bar: staff+patients+appts per clinic */}
                            <div className="card" style={{ padding: 20 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>Clinic Overview</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Staff · Patients · Appointments per clinic</div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={hospBarData} barSize={10}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="Staff" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Patients" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Appointments" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Row 3: Clinic leaderboard */}
                        <div className="card">
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 700 }}>Clinic Leaderboard</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ranked by patient count</div>
                            </div>
                            <div style={{ padding: '8px 20px 16px' }}>
                                {ranked.map((h, i) => {
                                    const pts = hPatients(h._id).length;
                                    const maxPts = hPatients(ranked[0]._id).length || 1;
                                    const pct = Math.round((pts / maxPts) * 100);
                                    const medalColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : '#e2e8f0';
                                    return (
                                        <div key={h._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < ranked.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: medalColor, color: i < 3 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                                                {i + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {pts} patients · {hStaff(h._id).length} staff · {hAppts(h._id).length} appts
                                                    </span>
                                                </div>
                                                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 99, transition: 'width 0.6s ease' }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ══════════════════════════════════════════════════
                DRAWER: per-hospital detail
            ══════════════════════════════════════════════════ */}
            <Drawer
                open={drawer.open}
                onClose={() => setDrawer({ open: false, type: null, hospital: null })}
                title={drawer.hospital?.name}
                subtitle={
                    drawer.type === 'staff' ? `Staff roster — ${hStaff(drawer.hospital?._id).length} members` :
                        drawer.type === 'patients' ? `Patient list — ${hPatients(drawer.hospital?._id).length} registered` :
                            drawer.type === 'appts' ? `Appointments — ${hAppts(drawer.hospital?._id).length} total` : ''
                }
            >
                {/* Staff drawer */}
                {drawer.type === 'staff' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {hStaff(drawer.hospital?._id).length === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No staff in this clinic yet.</div>
                        )}
                        {hStaff(drawer.hospital?._id).map(u => {
                            const meta = ROLE_COLORS[u.role] || ROLE_COLORS.nurse;
                            return (
                                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 12, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                                        {initials(u.name)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.username} · {u.phone || 'No phone'}</div>
                                    </div>
                                    <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                        {u.role}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Patients drawer */}
                {drawer.type === 'patients' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {hPatients(drawer.hospital?._id).length === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No patients registered in this clinic.</div>
                        )}
                        {hPatients(drawer.hospital?._id).map(p => {
                            const gColor = p.gender === 'Female' ? '#be185d' : '#1d4ed8';
                            const gBg = p.gender === 'Female' ? '#fce7f3' : '#dbeafe';
                            return (
                                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: gBg, color: gColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                                        {initials(p.name)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.phone || p.contact || 'No phone'} · {p.bloodGroup || '?'}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{p.gender || '?'}</span>
                                        {p.nfcId && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>🔖 {p.nfcId}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Appointments drawer */}
                {drawer.type === 'appts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {hAppts(drawer.hospital?._id).length === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No appointments for this clinic.</div>
                        )}
                        {hAppts(drawer.hospital?._id).map(a => {
                            const STATUS_COLORS = { scheduled: '#3b82f6', waiting: '#f59e0b', 'in-treatment': '#8b5cf6', completed: '#22c55e', cancelled: '#ef4444' };
                            const sc = STATUS_COLORS[a.status] || '#64748b';
                            return (
                                <div key={a._id} style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{a.patientName || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                {a.treatmentType || a.reason || 'Treatment'} · {(a.date || '').split('T')[0]} {a.time && `@ ${a.time}`}
                                            </div>
                                        </div>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: `${sc}15`, color: sc, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                                            {a.status || 'scheduled'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Drawer>

            {/* ══════════════════════════════════════════════════
                HOSPITAL FORM MODAL
            ══════════════════════════════════════════════════ */}
            {showHospForm && (
                <div className="modal-overlay" onClick={() => setShowHospForm(false)}>
                    <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingHosp ? 'Edit Hospital' : 'Register New Hospital'}</h3>
                            <button onClick={() => setShowHospForm(false)} className="btn btn-icon btn-secondary btn-sm"><X size={18} /></button>
                        </div>
                        <form onSubmit={submitHosp} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">Hospital Name *</label>
                                <input required className="form-control" placeholder="City General Dental" value={hospForm.name} onChange={e => setHospForm({ ...hospForm, name: e.target.value })} />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Lead Doctor *</label>
                                    <input required className="form-control" placeholder="Dr. Smith" value={hospForm.doctorName} onChange={e => setHospForm({ ...hospForm, doctorName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact *</label>
                                    <input required className="form-control" placeholder="+91…" value={hospForm.contact} onChange={e => setHospForm({ ...hospForm, contact: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Login Email *</label>
                                <input type="email" required className="form-control" placeholder="clinic@email.com" value={hospForm.email} onChange={e => setHospForm({ ...hospForm, email: e.target.value })} />
                            </div>
                            {!editingHosp && (
                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <input type="password" required className="form-control" placeholder="••••••••" value={hospForm.password} onChange={e => setHospForm({ ...hospForm, password: e.target.value })} />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea className="form-control" rows={2} placeholder="Full address…" value={hospForm.address} onChange={e => setHospForm({ ...hospForm, address: e.target.value })} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowHospForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingHosp ? <><Check size={15} /> Update</> : <><Plus size={15} /> Register</>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                STAFF FORM MODAL
            ══════════════════════════════════════════════════ */}
            {showStaffForm && (
                <div className="modal-overlay" onClick={() => setShowStaffForm(false)}>
                    <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Staff Member</h3>
                            <button onClick={() => setShowStaffForm(false)} className="btn btn-icon btn-secondary btn-sm"><X size={18} /></button>
                        </div>
                        <form onSubmit={submitStaff} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input required className="form-control" placeholder="Dr. John Doe" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Username / Email *</label>
                                <input type="text" required className="form-control" placeholder="username or email" value={staffForm.username} onChange={e => setStaffForm({ ...staffForm, username: e.target.value })} />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <input type="password" required className="form-control" placeholder="••••••••" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-control" placeholder="+91…" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Role *</label>
                                    <select className="form-control" value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}>
                                        <option value="doctor">Doctor</option>
                                        <option value="nurse">Nurse</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Assign to Hospital *</label>
                                    <select required className="form-control" value={staffForm.hospitalId} onChange={e => setStaffForm({ ...staffForm, hospitalId: e.target.value })}>
                                        <option value="">Select clinic…</option>
                                        {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowStaffForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><UserPlus size={15} /> Register Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={deleteHosp}
                name={deleteTarget?.name}
            />
        </div>
    );
}
