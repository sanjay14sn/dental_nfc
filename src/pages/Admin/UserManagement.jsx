import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
    Plus, Edit2, Trash2, User, X, Shield,
    Mail, Phone, Lock, Save, Search, Activity, Calendar, FileText,
    Settings, UserPlus, Users, Trash, Check
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CreditCard = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
);

const MODULE_CONFIG = {
    payments: { label: 'Revenue & Payments', Icon: CreditCard, color: '#f43f5e', bg: '#fff1f2' },
    bookings: { label: 'Appointments', Icon: Calendar, color: '#f59e0b', bg: '#fffbeb' },
    patients: { label: 'Patient Records', Icon: User, color: '#0ea5e9', bg: '#f0f9ff' },
    scans: { label: 'Medical Scans', Icon: Activity, color: '#6366f1', bg: '#eef2ff' },
    dentalChart: { label: 'Dental Charting', Icon: FileText, color: '#10b981', bg: '#ecfdf5' },
};

const ROLE_META = {
    admin: { color: '#f43f5e', bg: '#fff1f2', border: '#fecdd3' },
    doctor: { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
    nurse: { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
};

const defaultPerms = {
    payments: { read: true, write: false },
    bookings: { read: true, write: true },
    patients: { read: true, write: true },
    scans: { read: true, write: false },
    dentalChart: { read: true, write: true },
};

const blankForm = { name: '', username: '', password: '', role: 'doctor', phone: '', permissions: defaultPerms };

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserManagement() {
    const { user, authFetch, API_BASE } = useApp();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [searchQ, setSearchQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [form, setForm] = useState(blankForm);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchUsers = async () => {
        if (!user?.token) { setLoading(false); return; }
        try {
            const res = await authFetch(`${API_BASE}/auth/users`);
            if (res.ok) setUsers(await res.json());
        } catch (e) { console.error('fetchUsers:', e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [user?.token]); // eslint-disable-line

    // ── Handlers ───────────────────────────────────────────────────────────────
    const togglePerm = (mod, type) =>
        setForm(f => ({ ...f, permissions: { ...f.permissions, [mod]: { ...f.permissions[mod], [type]: !f.permissions[mod][type] } } }));

    const startEdit = (u) => {
        setEditingId(u._id);
        setForm({ name: u.name, username: u.username, password: '', role: u.role, phone: u.phone || '', permissions: u.permissions || defaultPerms });
        document.getElementById('um-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEdit = () => { setEditingId(null); setForm(blankForm); };

    const handleDelete = async (id) => {
        try {
            const res = await authFetch(`${API_BASE}/auth/users/${id}`, { method: 'DELETE' });
            if (res.ok) { fetchUsers(); setConfirmDeleteId(null); }
        } catch (e) { console.error('delete:', e); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `${API_BASE}/auth/users/${editingId}` : `${API_BASE}/auth/register`;
        const method = editingId ? 'PUT' : 'POST';
        try {
            const res = await authFetch(url, { method, body: JSON.stringify({ ...form, hospitalId: user?.hospitalId || null }) });
            if (res.ok) { cancelEdit(); fetchUsers(); }
            else { const d = await res.json(); alert(d.message || 'Action failed'); }
        } catch (e) { console.error('submit:', e); }
    };

    // ── Filtered list ──────────────────────────────────────────────────────────
    const filtered = users.filter(u => {
        const q = searchQ.toLowerCase();
        const matchQ = !q || u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.phone?.includes(q);
        return matchQ && (roleFilter === 'all' || u.role === roleFilter);
    });

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="page-loading">
            <div className="spinner" />
        </div>
    );

    const rm = (role) => ROLE_META[role] || ROLE_META.nurse;
    const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="page">

            {/* ── Page Header ── */}
            <div className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Shield size={14} color="var(--primary)" />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)' }}>Administrative Controls</span>
                    </div>
                    <h1 className="page-title">Clinic <span style={{ color: 'var(--primary)' }}>Personnel</span></h1>
                    <p className="page-subtitle">Manage staff, assign roles, and define module access.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="card" style={{ padding: '12px 20px', minWidth: 100, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>Total Staff</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>{users.length}</div>
                    </div>
                    <div className="card" style={{ padding: '12px 20px', minWidth: 100, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>Clinic ID</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>#{user?.hospitalId?.slice(-4).toUpperCase() || 'SYS'}</div>
                    </div>
                </div>
            </div>

            {/* ── Two-column layout ── */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

                {/* ── FORM SIDEBAR ── */}
                <div id="um-form" style={{ width: 340, flexShrink: 0, position: 'sticky', top: 80 }}>
                    <div className="card" style={{ overflow: 'hidden' }}>

                        {/* Form header */}
                        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 12, right: 16, opacity: 0.06 }}>
                                <UserPlus size={70} strokeWidth={1} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                {editingId
                                    ? <Settings size={18} color="#818cf8" />
                                    : <UserPlus size={18} color="#38bdf8" />}
                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                                    {editingId ? 'Edit Staff Profile' : 'Staff Enrollment'}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                                {editingId ? 'Modifying existing credentials' : 'Register a new clinic professional'}
                            </p>
                            {editingId && (
                                <button onClick={cancelEdit} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 8, padding: 6, display: 'flex' }}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Form body */}
                        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text" required value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="form-control" style={{ paddingLeft: 36 }}
                                        placeholder="e.g. Dr. Jane Smith"
                                    />
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Role *</label>
                                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="form-control">
                                        <option value="doctor">Doctor</option>
                                        <option value="nurse">Nurse</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text" value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="form-control" style={{ paddingLeft: 36 }}
                                            placeholder="+1 555..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Username / Email *</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text" required value={form.username}
                                        onChange={e => setForm({ ...form, username: e.target.value })}
                                        className="form-control" style={{ paddingLeft: 36 }}
                                        placeholder="username or email"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{editingId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="password" required={!editingId} value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="form-control" style={{ paddingLeft: 36 }}
                                        placeholder={editingId ? 'Leave blank to keep' : '••••••••'}
                                    />
                                </div>
                            </div>

                            {/* Permissions */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                                    Module Access
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {Object.entries(MODULE_CONFIG).map(([key, cfg]) => (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                                                    <cfg.Icon size={14} />
                                                </div>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>{cfg.label}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {['read', 'write'].map(type => (
                                                    <button
                                                        key={type} type="button"
                                                        onClick={() => togglePerm(key, type)}
                                                        style={{
                                                            padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                                            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                                                            background: form.permissions[key]?.[type] ? 'var(--primary)' : 'var(--border)',
                                                            color: form.permissions[key]?.[type] ? '#fff' : 'var(--text-muted)',
                                                            transition: 'all 0.15s'
                                                        }}
                                                    >{type}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                {editingId && (
                                    <button type="button" onClick={cancelEdit} className="btn btn-secondary" style={{ flex: 1 }}>
                                        Cancel
                                    </button>
                                )}
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                    {editingId ? <><Save size={15} /> Update</> : <><Plus size={15} /> Add Staff</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── STAFF LIST ── */}
                <div style={{ flex: 1, minWidth: 0 }}>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                placeholder="Search staff by name, username or phone..."
                                className="form-control" style={{ paddingLeft: 36 }}
                                value={searchQ}
                                onChange={e => setSearchQ(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {['all', 'doctor', 'nurse', 'admin'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setRoleFilter(f)}
                                    className={`btn btn-sm ${roleFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {f === 'all' ? 'All' : f + 's'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cards grid */}
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1.5px dashed var(--border)' }}>
                            <Users size={48} style={{ color: 'var(--border)', marginBottom: 12 }} />
                            <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No staff found</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>Adjust your search or add a new staff member.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {filtered.map(u => {
                                const meta = rm(u.role);
                                const isEditing = editingId === u._id;
                                const isDeleting = confirmDeleteId === u._id;
                                const writePerms = Object.entries(u.permissions || {}).filter(([, p]) => p.write).map(([k]) => k);
                                const readCount = Object.values(u.permissions || {}).filter(p => p.read).length;

                                return (
                                    <div
                                        key={u._id}
                                        className="card"
                                        style={{
                                            overflow: 'hidden',
                                            borderColor: isEditing ? 'var(--primary)' : undefined,
                                            boxShadow: isEditing ? '0 0 0 3px rgba(26,127,191,0.15)' : undefined,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {/* Card top */}
                                        <div style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                                                {/* Avatar */}
                                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: 14,
                                                        background: meta.color === '#f43f5e'
                                                            ? 'linear-gradient(135deg,#f43f5e,#fb7185)'
                                                            : meta.color === '#6366f1'
                                                                ? 'linear-gradient(135deg,#6366f1,#818cf8)'
                                                                : 'linear-gradient(135deg,#10b981,#34d399)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 800, fontSize: '1rem'
                                                    }}>
                                                        {initials(u.name)}
                                                    </div>
                                                    <div style={{
                                                        position: 'absolute', bottom: -3, right: -3,
                                                        width: 18, height: 18, borderRadius: 6,
                                                        background: '#fff', border: '1.5px solid var(--border)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        {u.role === 'admin'
                                                            ? <Shield size={10} color="#f43f5e" fill="#f43f5e" />
                                                            : u.role === 'doctor'
                                                                ? <Activity size={10} color="#6366f1" />
                                                                : <Users size={10} color="#10b981" />}
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {u.name}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, textTransform: 'uppercase', fontSize: '0.6rem', padding: '2px 8px' }}>
                                                            {u.role}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{u._id?.slice(-6)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact info */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    <Mail size={13} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    <Phone size={13} />
                                                    <span>{u.phone || 'Not listed'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card footer */}
                                        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            {/* Permission dots */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {writePerms.slice(0, 4).map((key, i) => {
                                                    const cfg = MODULE_CONFIG[key];
                                                    return cfg ? (
                                                        <div
                                                            key={key}
                                                            title={`Write: ${cfg.label}`}
                                                            style={{
                                                                width: 22, height: 22, borderRadius: '50%',
                                                                background: cfg.bg, color: cfg.color,
                                                                border: '2px solid #fff',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '0.6rem', fontWeight: 800,
                                                                marginLeft: i > 0 ? -6 : 0, zIndex: 4 - i
                                                            }}
                                                        >
                                                            {key[0].toUpperCase()}
                                                        </div>
                                                    ) : null;
                                                })}
                                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 6 }}>+{readCount} read</span>
                                            </div>

                                            {/* Actions */}
                                            {isDeleting ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff1f2', padding: '4px 10px', borderRadius: 8 }}>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f43f5e' }}>Delete?</span>
                                                    <button onClick={() => setConfirmDeleteId(null)} className="btn btn-sm btn-secondary" style={{ padding: '2px 8px' }}><X size={12} /></button>
                                                    <button onClick={() => handleDelete(u._id)} className="btn btn-sm btn-danger" style={{ padding: '2px 8px' }}><Check size={12} /></button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => startEdit(u)} className="btn btn-secondary btn-sm" title="Edit">
                                                        <Edit2 size={13} /> Edit
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteId(u._id)} className="btn btn-secondary btn-sm" title="Delete" style={{ color: '#f43f5e', borderColor: '#fecdd3' }}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
