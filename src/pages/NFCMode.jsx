import React, { useState } from 'react';
import { Wifi, Search, User, CreditCard, CalendarDays, Activity, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { DOCTORS } from '../data/mockData';
import { format, parseISO, differenceInYears } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');

export default function NFCMode() {
    const { patients, appointments, bills, getPatientByNfc } = useApp();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [patient, setPatient] = useState(null);
    const [tapping, setTapping] = useState(false);
    const [error, setError] = useState('');

    const lookup = (q) => {
        setError('');
        setPatient(null);
        if (!q.trim()) return;
        // Try NFC first
        let found = getPatientByNfc(q.trim());
        // Then name search
        if (!found) found = patients.find(p => p.name?.toLowerCase().includes(q.toLowerCase()));
        if (found) setPatient(found);
        else setError('No patient found. Check NFC ID or name.');
    };

    const simulateTap = () => {
        if (patients.length === 0) return;
        setTapping(true);
        setTimeout(() => {
            const p = patients[Math.floor(Math.random() * patients.length)];
            setQuery(p.nfcId);
            setPatient(p);
            setError('');
            setTapping(false);
        }, 1200);
    };

    const age = patient?.dob ? differenceInYears(new Date(), parseISO(patient.dob)) : '—';
    const patientAppts = patient ? appointments.filter(a => a.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date)) : [];
    const todayAppt = patientAppts.find(a => a.date === today);
    const nextAppt = patientAppts.find(a => a.date >= today && a.status !== 'cancelled');
    const patientBills = patient ? bills.filter(b => b.patientId === patient.id) : [];
    const pendingAmt = patientBills.filter(b => b.status !== 'paid').reduce((s, b) => s + (b.total - b.paid), 0);
    const lastBill = patientBills.sort((a, b) => b.date.localeCompare(a.date))[0];
    const lastAppt = patientAppts[0];
    const doctor = DOCTORS.find(d => d.id === patient?.firstDoctor);

    return (
        <div className="page nfc-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">NFC Quick Mode</h1>
                    <p className="page-subtitle">Tap patient card or search by name / NFC ID</p>
                </div>
            </div>

            {/* NFC Tap Zone */}
            <div className="nfc-zone">
                <div className={`nfc-tap-area ${tapping ? 'tapping' : ''}`} onClick={simulateTap}>
                    <Wifi size={52} className="nfc-icon" />
                    <div className="nfc-tap-label">{tapping ? 'Reading card…' : 'Tap NFC Card Here'}</div>
                    <div className="nfc-tap-sub">or use search below</div>
                </div>

                <div className="nfc-search">
                    <div className="search-bar-inline big">
                        <Search size={18} />
                        <input
                            placeholder="Enter NFC ID or patient name…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && lookup(query)}
                        />
                        <button className="btn btn-primary" onClick={() => lookup(query)}>Lookup</button>
                    </div>

                    {/* Quick pick */}
                    <div className="nfc-quick-picks">
                        {patients.slice(0, 5).map(p => (
                            <button key={p.id} className="nfc-quick-btn" onClick={() => { setQuery(p.nfcId); setPatient(p); setError(''); }}>
                                {p.nfcId} — {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && <div className="error-banner"><AlertCircle size={16} />{error}</div>}

            {/* Patient Card */}
            {patient && (
                <div className="nfc-patient-card">
                    <div className="nfc-card-header">
                        <div className="nfc-avatar" style={{
                            background: patient.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : 'linear-gradient(135deg,#3b82f6,#93c5fd)'
                        }}>
                            {patient.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="nfc-patient-main">
                            <div className="nfc-name">{patient.name}</div>
                            <div className="nfc-meta">{patient.gender} · {age} yrs · {patient.bloodGroup} · {patient.phone}</div>
                            {patient.medicalHistory && patient.medicalHistory !== 'None' && (
                                <div className="profile-tag warning" style={{ display: 'inline-flex', marginTop: 6 }}>
                                    <span>⚠</span> {patient.medicalHistory}
                                </div>
                            )}
                        </div>
                        <div className="nfc-card-badge">
                            <Wifi size={18} /> {patient.nfcId}
                        </div>
                    </div>

                    <div className="nfc-info-grid">
                        <div className="nfc-info-block">
                            <div className="nfc-info-icon" style={{ color: todayAppt ? '#8b5cf6' : '#3b82f6' }}><CalendarDays size={20} /></div>
                            <div>
                                <div className="nfc-info-label">Today's Appointment</div>
                                {todayAppt ? (
                                    <>
                                        <div className="nfc-info-value">{todayAppt.treatmentType}</div>
                                        <div className="nfc-info-sub">{todayAppt.time} · {DOCTORS.find(d => d.id === todayAppt.doctorId)?.name}</div>
                                    </>
                                ) : (
                                    <div className="nfc-info-value" style={{ color: 'var(--text-2)' }}>No appointment today</div>
                                )}
                                {nextAppt && nextAppt.date !== today && (
                                    <div className="nfc-info-sub">Next: {nextAppt.date} — {nextAppt.treatmentType}</div>
                                )}
                            </div>
                        </div>

                        <div className="nfc-info-block">
                            <div className="nfc-info-icon" style={{ color: pendingAmt > 0 ? '#f59e0b' : '#22c55e' }}><CreditCard size={20} /></div>
                            <div>
                                <div className="nfc-info-label">Billing</div>
                                <div className="nfc-info-value" style={{ color: pendingAmt > 0 ? '#f59e0b' : '#22c55e' }}>
                                    {pendingAmt > 0 ? `₹${pendingAmt.toLocaleString('en-IN')} pending` : 'No dues'}
                                </div>
                                {lastBill && <div className="nfc-info-sub">Last bill: ₹{lastBill.total?.toLocaleString('en-IN')} on {lastBill.date}</div>}
                            </div>
                        </div>

                        <div className="nfc-info-block">
                            <div className="nfc-info-icon" style={{ color: '#22c55e' }}><Activity size={20} /></div>
                            <div>
                                <div className="nfc-info-label">Dental Status</div>
                                <div className="nfc-info-value">{Object.keys(patient.toothRecords || {}).length} teeth on record</div>
                                {lastAppt && <div className="nfc-info-sub">Last visit: {lastAppt.date} — {lastAppt.treatmentType}</div>}
                            </div>
                        </div>

                        <div className="nfc-info-block">
                            <div className="nfc-info-icon" style={{ color: '#8b5cf6' }}><User size={20} /></div>
                            <div>
                                <div className="nfc-info-label">Assigned Doctor</div>
                                <div className="nfc-info-value">{doctor?.name || '—'}</div>
                                <div className="nfc-info-sub">{doctor?.speciality}</div>
                            </div>
                        </div>
                    </div>

                    <div className="nfc-actions">
                        <button className="btn btn-primary" onClick={() => navigate(`/patients/${patient.id}`)}>
                            <User size={15} /> Full Profile
                        </button>
                        <button className="btn btn-secondary" onClick={() => navigate(`/dental-chart/${patient.id}`)}>
                            <Activity size={15} /> Dental Chart
                        </button>
                        <button className="btn btn-secondary" onClick={() => navigate(`/billing/new/${patient.id}`)}>
                            <CreditCard size={15} /> Create Bill
                        </button>
                        <button className="btn btn-ghost" onClick={() => navigate('/appointments')}>
                            <CalendarDays size={15} /> Schedule
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
