import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone, Mail, Wifi, Activity, CreditCard, CalendarDays, FileImage, Edit2, UserMinus, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DOCTORS } from '../data/mockData';
import { format, differenceInYears, parseISO } from 'date-fns';
import AISummary from '../components/AISummary';

const STATUS_COLORS = {
    healthy: '#22c55e', issue: '#ef4444', treatment: '#f59e0b',
    completed: '#3b82f6', missing: '#94a3b8'
};

export default function PatientProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getPatient, appointments, bills, loading } = useApp();
    const patient = getPatient(id);
    const [tab, setTab] = useState('overview');
    const [showAI, setShowAI] = useState(false);

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    if (!patient) return (
        <div className="page">
            <div className="empty-state" style={{ marginTop: 80 }}>Patient not found.<br />
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/patients')}>Back to Patients</button>
            </div>
        </div>
    );

    const age = patient.dob ? differenceInYears(new Date(), parseISO(patient.dob)) : '—';
    const patientAppts = appointments.filter(a => a.patientId === id).sort((a, b) => b.date.localeCompare(a.date));
    const patientBills = bills.filter(b => b.patientId === id).sort((a, b) => b.date.localeCompare(a.date));
    const pendingAmt = patientBills.filter(b => b.status !== 'paid').reduce((s, b) => s + (b.total - b.paid), 0);
    const toothEntries = Object.entries(patient.toothRecords || {});
    const doctor = DOCTORS.find(d => d.id === patient.firstDoctor);

    const statusLabel = { scheduled: 'Scheduled', waiting: 'Waiting', 'in-treatment': 'In Treatment', completed: 'Done', cancelled: 'Cancelled' };
    const statusColor = { scheduled: '#3b82f6', waiting: '#f59e0b', 'in-treatment': '#8b5cf6', completed: '#22c55e', cancelled: '#ef4444' };

    // --- Advanced AI Features ---
    const calculateAcceptanceLevel = () => {
        let score = 75; // Base 75%
        const missedVal = patientAppts.filter(a => a.status === 'cancelled').length;
        const totalBilled = patientBills.reduce((s, b) => s + b.total, 0);
        const totalPaid = patientBills.reduce((s, b) => s + b.paid, 0);
        const debtRatio = totalBilled > 0 ? (totalBilled - totalPaid) / totalBilled : 0;

        score -= (missedVal * 20); // -20% for each missed visit
        score -= (debtRatio * 40); // -40% if they owe a lot
        if (patient.status === 'inactive') score -= 15;

        if (score > 60) return { label: 'High', color: '#16a34a', bg: '#f0fdf4' };
        if (score > 30) return { label: 'Medium', color: '#d97706', bg: '#fffbeb' };
        return { label: 'Low', color: '#dc2626', bg: '#fef2f2' };
    };

    const acceptance = calculateAcceptanceLevel();

    const handleWhatsAppReferral = () => {
        const teeth = Object.entries(patient.toothRecords || {})
            .map(([num, status]) => `Tooth ${num}: ${status}`)
            .join(', ');

        const text = `*DentaFlow Case Referral*\n\n` +
            `*Patient:* ${patient.name} (${age}y)\n` +
            `*Clinical Profile:* ${patient.medicalHistory || 'No major issues'}\n` +
            `*Tooth Records:* ${teeth || 'Standard'}\n` +
            `*Latest Note:* ${patientAppts[0]?.notes || 'Pending evaluation'}\n\n` +
            `Shared via DentaFlow AI Panel`;

        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };
    // ----------------------------

    return (
        <div className="page">
            {showAI && <AISummary patient={patient} appointments={patientAppts} bills={patientBills} onClose={() => setShowAI(false)} />}

            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h1 className="page-title">{patient.name}</h1>
                            <div className="acceptance-tag" style={{ background: acceptance.bg, color: acceptance.color }}>
                                <Sparkles size={12} /> {acceptance.label} Acceptance Propensity
                            </div>
                        </div>
                        <p className="page-subtitle">Patient ID: {patient.id} · NFC: {patient.nfcId}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }} onClick={handleWhatsAppReferral}>
                        <Mail size={15} /> Refer Case
                    </button>
                    <button className="btn btn-ghost" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #c4b5fd', color: '#6d28d9' }} onClick={() => setShowAI(true)}>
                        <Sparkles size={15} /> AI Summary
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate(`/dental-chart/${id}`)}>
                        <Activity size={15} /> Dental Chart
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate(`/billing/new/${id}`)}>
                        <CreditCard size={15} /> New Bill
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="profile-hero">
                <div className="profile-avatar" style={{
                    background: patient.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : 'linear-gradient(135deg,#3b82f6,#93c5fd)'
                }}>
                    {patient.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="profile-details">
                    <div className="profile-name">{patient.name}</div>
                    <div className="profile-meta">{patient.gender} · {age} yrs · {patient.bloodGroup}</div>
                    <div className="profile-contacts">
                        {patient.phone && <span><Phone size={13} /> {patient.phone}</span>}
                        {patient.email && <span><Mail size={13} /> {patient.email}</span>}
                        {patient.nfcId && <span><Wifi size={13} /> {patient.nfcId}</span>}
                    </div>
                    {patient.medicalHistory && patient.medicalHistory !== 'None' && (
                        <div className="profile-tag warning"><span>⚠</span> {patient.medicalHistory}</div>
                    )}
                    {patient.allergies && <div className="profile-tag danger">Allergies: {patient.allergies}</div>}
                </div>
                <div className="profile-stats">
                    <div className="profile-stat"><div className="stat-num">{patientAppts.length}</div><div className="stat-lbl">Visits</div></div>
                    <div className="profile-stat"><div className="stat-num">{patientBills.length}</div><div className="stat-lbl">Bills</div></div>
                    <div className="profile-stat" style={{ color: pendingAmt > 0 ? '#f59e0b' : 'inherit' }}>
                        <div className="stat-num">₹{pendingAmt.toLocaleString('en-IN')}</div>
                        <div className="stat-lbl">Pending</div>
                    </div>
                    <div className="profile-stat">
                        <div className="stat-num">{toothEntries.length}</div>
                        <div className="stat-lbl">Teeth Noted</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-bar">
                {['overview', 'appointments', 'billing', 'teeth'].map(t => (
                    <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'overview' && (
                <div className="tab-content">
                    <div className="info-grid">
                        <div className="info-block">
                            <div className="info-title">Personal</div>
                            <div className="info-row"><span>DOB</span><span>{patient.dob ? format(parseISO(patient.dob), 'd MMM yyyy') : '—'}</span></div>
                            <div className="info-row"><span>Gender</span><span>{patient.gender}</span></div>
                            <div className="info-row"><span>Blood Group</span><span>{patient.bloodGroup}</span></div>
                            <div className="info-row"><span>Address</span><span>{patient.address || '—'}</span></div>
                        </div>
                        <div className="info-block">
                            <div className="info-title">Medical</div>
                            <div className="info-row"><span>History</span><span>{patient.medicalHistory || 'None'}</span></div>
                            <div className="info-row"><span>Allergies</span><span>{patient.allergies || 'None'}</span></div>
                            <div className="info-row"><span>Medications</span><span>{patient.conditions || 'None'}</span></div>
                            <div className="info-row"><span>Emergency</span><span>{patient.emergencyContact || '—'}</span></div>
                        </div>
                        <div className="info-block">
                            <div className="info-title">Clinic</div>
                            <div className="info-row"><span>Assigned Dr.</span><span>{doctor?.name || '—'}</span></div>
                            <div className="info-row"><span>Registered</span><span>{patient.registrationDate ? format(parseISO(patient.registrationDate), 'd MMM yyyy') : '—'}</span></div>
                            <div className="info-row"><span>Status</span><span style={{ color: patient.status === 'active' ? '#22c55e' : '#94a3b8' }}>{patient.status}</span></div>
                        </div>
                    </div>
                    {patient.notes && <div className="info-notes"><strong>Notes:</strong> {patient.notes}</div>}
                </div>
            )}

            {tab === 'appointments' && (
                <div className="tab-content">
                    {patientAppts.length === 0 && <div className="empty-state">No appointments found</div>}
                    {patientAppts.map(a => {
                        const dr = DOCTORS.find(d => d.id === a.doctorId);
                        return (
                            <div key={a.id} className="timeline-item">
                                <div className="timeline-dot" style={{ background: statusColor[a.status] || '#888' }} />
                                <div className="timeline-body">
                                    <div className="timeline-title">{a.treatmentType}</div>
                                    <div className="timeline-meta">{a.date} at {a.time} · {dr?.name}</div>
                                    {a.notes && <div className="timeline-notes">{a.notes}</div>}
                                </div>
                                <span className="status-badge" style={{ '--s': statusColor[a.status] || '#888' }}>{statusLabel[a.status] || a.status}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {tab === 'billing' && (
                <div className="tab-content">
                    {patientBills.length === 0 && <div className="empty-state">No bills found</div>}
                    {patientBills.map(b => (
                        <div key={b.id} className="bill-item">
                            <div>
                                <div className="bill-items-list">{b.items.map((it, i) => <span key={i}>{it.treatment}{it.tooth ? ` (#${it.tooth})` : ''}</span>)}</div>
                                <div className="bill-meta">{b.date} · {b.paymentMode}</div>
                            </div>
                            <div className="bill-amounts">
                                <div className="bill-total">₹{b.total?.toLocaleString('en-IN')}</div>
                                <span className={`status-badge`} style={{ '--s': b.status === 'paid' ? '#22c55e' : b.status === 'partial' ? '#f59e0b' : '#ef4444' }}>
                                    {b.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'teeth' && (
                <div className="tab-content">
                    {toothEntries.length === 0 && <div className="empty-state">No tooth records yet. <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={() => navigate(`/dental-chart/${id}`)}>Open Chart</button></div>}
                    <div className="teeth-records">
                        {toothEntries.map(([tooth, rec]) => (
                            <div key={tooth} className="tooth-record-item">
                                <div className="tooth-num-badge" style={{ background: STATUS_COLORS[rec.status] || '#888' }}>#{tooth}</div>
                                <div>
                                    <div className="tooth-condition">{rec.condition}</div>
                                    {rec.notes && <div className="tooth-notes">{rec.notes}</div>}
                                </div>
                                <span className="tooth-status-tag" style={{ color: STATUS_COLORS[rec.status] || '#888' }}>{rec.status}</span>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate(`/dental-chart/${id}`)}>
                        <Activity size={15} /> Open Full Dental Chart
                    </button>
                </div>
            )}
        </div>
    );
}
