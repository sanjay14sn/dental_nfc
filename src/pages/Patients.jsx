import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Filter, Phone, Calendar, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, differenceInYears, parseISO } from 'date-fns';

const statusColor = { active: '#22c55e', inactive: '#94a3b8' };

export default function Patients() {
    const { patients, loading } = useApp();
    const navigate = useNavigate();
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState('all');

    const filtered = patients.filter(p => {
        const matchQ = !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.phone?.includes(q) || p.nfcId?.toLowerCase().includes(q.toLowerCase());
        const matchF = filter === 'all' || p.status === filter;
        return matchQ && matchF;
    });

    const getAge = (dob) => {
        try { return differenceInYears(new Date(), parseISO(dob)); } catch { return '—'; }
    };

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??';

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Patients</h1>
                    <p className="page-subtitle">{patients.length} total registered patients</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/patients/new')}>
                    <UserPlus size={16} /> New Patient
                </button>
            </div>

            {/* Filters */}
            <div className="toolbar">
                <div className="search-bar-inline">
                    <Search size={15} />
                    <input
                        placeholder="Search by name, phone, NFC ID…"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                    />
                </div>
                <div className="filter-tabs">
                    {['all', 'active', 'inactive'].map(f => (
                        <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Patient Grid */}
            <div className="patient-grid">
                {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}>No patients found</div>}
                {filtered.map(p => (
                    <div key={p.id} className="patient-card" onClick={() => navigate(`/patients/${p.id}`)}>
                        <div className="patient-card-header">
                            <div className="patient-avatar-lg" style={{
                                background: p.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : 'linear-gradient(135deg,#3b82f6,#93c5fd)'
                            }}>
                                {getInitials(p.name)}
                            </div>
                            <div>
                                <div className="patient-name">{p.name}</div>
                                <div className="patient-meta">{p.gender} · {getAge(p.dob)} yrs · {p.bloodGroup}</div>
                            </div>
                            <span className="status-dot" style={{ background: statusColor[p.status] || '#999' }} />
                        </div>
                        <div className="patient-card-body">
                            <div className="patient-detail"><Phone size={13} />{p.phone}</div>
                            <div className="patient-detail"><Activity size={13} />NFC: {p.nfcId}</div>
                            {p.medicalHistory && p.medicalHistory !== 'None' && (
                                <div className="patient-tag">{p.medicalHistory}</div>
                            )}
                        </div>
                        <div className="patient-card-footer">
                            <span>Since {p.registrationDate ? format(parseISO(p.registrationDate), 'd MMM yyyy') : '—'}</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                {Object.keys(p.toothRecords || {}).length} teeth noted
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
