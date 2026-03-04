import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, CalendarDays, Clock, X, Check, AlertCircle, Circle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TREATMENTS } from '../data/mockData';

const today = format(new Date(), 'yyyy-MM-dd');

const STATUS_CONFIG = {
    scheduled: { label: 'Scheduled', color: '#3b82f6', icon: Circle },
    waiting: { label: 'Waiting', color: '#f59e0b', icon: Clock },
    'in-treatment': { label: 'In Treatment', color: '#8b5cf6', icon: AlertCircle },
    completed: { label: 'Completed', color: '#22c55e', icon: Check },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: X },
};

const EMPTY_FORM = {
    patientId: '',
    patientName: '',
    patientPhone: '',
    doctorId: '',
    date: today,
    time: '09:00',
    treatmentType: '',
    status: 'scheduled',
    notes: ''
};

export default function Appointments() {
    const { appointments, patients, doctors, addAppointment, updateAppointment, deleteAppointment } = useApp();
    const [dateFilter, setDateFilter] = useState(today);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const filtered = appointments.filter(a => {
        if (!dateFilter) return true;
        const apptDate = a.date.includes('T') ? a.date.split('T')[0] : a.date;
        return apptDate === dateFilter;
    }).sort((a, b) => a.time.localeCompare(b.time));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isRegistered = !!form.patientId;
        if (!isRegistered && !form.patientName) return;
        if (!form.treatmentType) return;

        try {
            const payload = {
                ...form,
                reason: form.treatmentType // Sync with backend if needed, but we added treatmentType to backend too
            };

            if (editId) {
                await updateAppointment(editId, payload);
            } else {
                await addAppointment(payload);
            }
        } catch (err) {
            console.error('Failed to save appointment:', err);
        }
        setShowForm(false);
        setForm(EMPTY_FORM);
        setEditId(null);
    };

    const handleEdit = (a) => {
        setForm({
            patientId: a.patientId || '',
            patientName: a.patientName || '',
            patientPhone: a.patientPhone || '',
            doctorId: a.doctorId,
            date: a.date,
            time: a.time,
            treatmentType: a.treatmentType || a.reason || '',
            status: a.status,
            notes: a.notes || ''
        });
        setEditId(a._id || a.id);
        setShowForm(true);
    };

    const handleStatus = async (id, st) => {
        try {
            await updateAppointment(id, { status: st });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const counts = Object.fromEntries(Object.keys(STATUS_CONFIG).map(s => [s, filtered.filter(a => a.status === s).length]));

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Appointments</h1>
                    <p className="page-subtitle">{filtered.length} appointment{filtered.length !== 1 ? 's' : ''} on {dateFilter ? format(parseISO(dateFilter), 'd MMMM yyyy') : 'All Days'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="date-input" />
                    <button className="btn btn-ghost btn-sm" onClick={() => setDateFilter('')}>All</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setDateFilter(today)}>Today</button>
                    <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
                        <Plus size={16} /> New
                    </button>
                </div>
            </div>

            {/* Status Summary */}
            <div className="status-summary">
                {Object.entries(STATUS_CONFIG).map(([s, cfg]) => counts[s] > 0 && (
                    <div key={s} className="status-chip" style={{ '--c': cfg.color }}>
                        <cfg.icon size={13} /> {counts[s]} {cfg.label}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editId ? 'Edit Appointment' : 'New Appointment'}</h3>
                            <button className="btn-close" onClick={() => setShowForm(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Patient Type</label>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                        <input type="radio" name="ptype" checked={!!form.patientId || (!form.patientName && !form.patientPhone)} onChange={() => { set('patientName', ''); set('patientPhone', ''); }} /> Registered
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                        <input type="radio" name="ptype" checked={!form.patientId && (!!form.patientName || !!form.patientPhone)} onChange={() => set('patientId', '')} /> Walk-in / New
                                    </label>
                                </div>

                                {(!form.patientName && !form.patientPhone) || form.patientId ? (
                                    <select value={form.patientId} onChange={e => set('patientId', e.target.value)} required>
                                        <option value="">Select patient…</option>
                                        {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.phone || p.contact})</option>)}
                                    </select>
                                ) : (
                                    <div className="form-grid">
                                        <input placeholder="Patient Name *" value={form.patientName} onChange={e => set('patientName', e.target.value)} required />
                                        <input placeholder="Phone Number" value={form.patientPhone} onChange={e => set('patientPhone', e.target.value)} />
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Doctor *</label>
                                <select value={form.doctorId} onChange={e => set('doctorId', e.target.value)} required>
                                    <option value="">Select doctor…</option>
                                    {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Time</label>
                                    <input type="time" value={form.time} onChange={e => set('time', e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Treatment *</label>
                                <input list="treatments-list" value={form.treatmentType} onChange={e => set('treatmentType', e.target.value)} placeholder="Select or type treatment" required />
                                <datalist id="treatments-list">
                                    {TREATMENTS.map(t => <option key={t.id} value={t.name} />)}
                                </datalist>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={form.status} onChange={e => set('status', e.target.value)}>
                                    {Object.entries(STATUS_CONFIG).map(([s, c]) => <option key={s} value={s}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes" />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Book'} Appointment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Appointment List */}
            <div className="appt-full-list">
                {filtered.length === 0 && <div className="empty-state">No appointments for this date</div>}
                {filtered.map(a => {
                    const id = a._id;
                    const pId = typeof a.patientId === 'object' ? a.patientId?._id : a.patientId;
                    const patient = patients.find(p => p._id === pId || p.id === pId);
                    const doctor = doctors.find(d => d._id === a.doctorId || d.id === a.doctorId);
                    const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.scheduled;
                    const displayDate = a.date.includes('T') ? format(parseISO(a.date), 'yyyy-MM-dd') : a.date;

                    return (
                        <div key={id || a.id} className="appt-card">
                            <div className="appt-card-time">
                                <Clock size={14} />
                                <span>{a.time}</span>
                                <span className="appt-card-date">{displayDate}</span>
                            </div>
                            <div className="appt-card-patient">
                                <div className="appt-avatar-sm" style={{ background: (patient?.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : 'linear-gradient(135deg,#3b82f6,#93c5fd)') }}>
                                    {(patient?.name || a.patientName)?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                </div>
                                <div>
                                    <div className="appt-patient-name">{patient?.name || a.patientName || 'Unknown'}</div>
                                    <div className="appt-patient-sub">
                                        {a.treatmentType || a.reason} · {doctor?.name}
                                        {a.patientPhone && <span style={{ marginLeft: 8, opacity: 0.7 }}>📞 {a.patientPhone}</span>}
                                    </div>
                                    {a.notes && <div className="appt-patient-notes">{a.notes}</div>}
                                </div>
                            </div>
                            <div className="appt-card-actions">
                                <span className="status-badge" style={{ '--s': cfg.color }}>{cfg.label}</span>
                                <div className="appt-actions">
                                    {a.status !== 'completed' && a.status !== 'cancelled' && (
                                        <button className="btn btn-ghost btn-xs" onClick={() => handleStatus(id, 'completed')} title="Mark done"><Check size={14} /></button>
                                    )}
                                    <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(a)} title="Edit">✎</button>
                                    <button className="btn btn-ghost btn-xs danger" onClick={() => deleteAppointment(id)} title="Delete"><X size={14} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
