import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CONDITIONS } from '../data/mockData';

// FDI Notation: Upper jaw: 11-18 (right) + 21-28 (left), Lower jaw: 31-38 (left) + 41-48 (right)
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

const STATUS_COLORS = {
    healthy: '#22c55e',
    issue: '#ef4444',
    treatment: '#f59e0b',
    completed: '#3b82f6',
    missing: '#94a3b8',
};

function Tooth({ num, record, onClick }) {
    const status = record?.status || 'healthy';
    const color = STATUS_COLORS[status];
    return (
        <div
            className="tooth-cell"
            onClick={() => onClick(num)}
            title={`Tooth #${num}${record?.condition ? ': ' + record.condition : ''}`}
            style={{ cursor: 'pointer' }}
        >
            <div className="tooth-icon" style={{ background: color + '33', border: `2px solid ${color}`, color }}>
                <span className="tooth-num">{num}</span>
            </div>
            {record?.condition && <div className="tooth-label" style={{ color }}>{record.condition.slice(0, 4)}</div>}
        </div>
    );
}

function ToothModal({ tooth, record, onSave, onClose }) {
    const [status, setStatus] = useState(record?.status || 'healthy');
    const [condition, setCondition] = useState(record?.condition || 'Healthy');
    const [notes, setNotes] = useState(record?.notes || '');

    const handleSave = () => {
        onSave(tooth, { status, condition, notes });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Tooth #{tooth}</h3>
                    <button className="btn-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-form">
                    <div className="form-group">
                        <label>Status</label>
                        <div className="status-selector">
                            {Object.entries(STATUS_COLORS).map(([s, c]) => (
                                <button
                                    key={s}
                                    className={`status-btn ${status === s ? 'active' : ''}`}
                                    style={{ '--c': c }}
                                    onClick={() => setStatus(s)}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Condition</label>
                        <select value={condition} onChange={e => setCondition(e.target.value)}>
                            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Clinical Notes</label>
                        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations, treatment plan..." />
                    </div>
                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave}>Save Record</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DentalChart() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { patients, getPatient, updateToothRecord } = useApp();
    const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
    const [activeTooth, setActiveTooth] = useState(null);

    const patient = selectedPatientId ? getPatient(selectedPatientId) : null;
    const records = patient?.toothRecords || {};

    const handleSave = (tooth, record) => {
        if (!selectedPatientId) return;
        updateToothRecord(selectedPatientId, String(tooth), record);
    };

    const activeRecord = activeTooth ? records[String(activeTooth)] : null;

    const renderRow = (teeth, label) => (
        <div className="jaw-row">
            <div className="jaw-label">{label}</div>
            <div className="teeth-row">
                {teeth.map(n => (
                    <Tooth key={n} num={n} record={records[String(n)]} onClick={setActiveTooth} />
                ))}
            </div>
        </div>
    );

    const legendItems = Object.entries(STATUS_COLORS);
    const issueTeeth = Object.entries(records).filter(([, r]) => r.status === 'issue' || r.status === 'treatment');

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {patientId && <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>}
                    <div>
                        <h1 className="page-title">Dental Chart</h1>
                        <p className="page-subtitle">FDI 32-tooth notation · Click any tooth to record status</p>
                    </div>
                </div>
            </div>

            {/* Patient Selector */}
            {!patientId && (
                <div className="form-card" style={{ marginBottom: 20 }}>
                    <div className="form-group">
                        <label>Select Patient</label>
                        <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
                            <option value="">Choose patient to view/edit chart…</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {patient && (
                <div className="patient-badge-bar">
                    <div className="patient-badge-avatar" style={{ background: patient.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : 'linear-gradient(135deg,#3b82f6,#93c5fd)' }}>
                        {patient.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{patient.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{patient.phone} · NFC: {patient.nfcId}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/billing/new/${patient.id}`)}>New Bill</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/patients/${patient.id}`)}>Profile</button>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="chart-legend">
                {legendItems.map(([s, c]) => (
                    <div key={s} className="legend-item">
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
                        <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                    </div>
                ))}
            </div>

            {/* Tooth Chart */}
            <div className="dental-chart-container">
                <div className="jaw-section upper">
                    <div className="jaw-title">Upper Jaw (Maxilla)</div>
                    <div className="jaw-divider">
                        {renderRow(UPPER_RIGHT, 'UR')}
                        <div className="midline" />
                        {renderRow(UPPER_LEFT, 'UL')}
                    </div>
                </div>
                <div className="chart-center-line" />
                <div className="jaw-section lower">
                    <div className="jaw-title">Lower Jaw (Mandible)</div>
                    <div className="jaw-divider">
                        {renderRow(LOWER_LEFT, 'LL')}
                        <div className="midline" />
                        {renderRow(LOWER_RIGHT, 'LR')}
                    </div>
                </div>
            </div>

            {/* Issues Summary */}
            {patient && issueTeeth.length > 0 && (
                <div className="form-card" style={{ marginTop: 20 }}>
                    <div className="form-section-title">⚠ Attention Required ({issueTeeth.length} teeth)</div>
                    <div className="teeth-chips">
                        {issueTeeth.map(([tooth, rec]) => (
                            <div key={tooth} className="teeth-chip" style={{ '--c': STATUS_COLORS[rec.status] }} onClick={() => setActiveTooth(Number(tooth))}>
                                #{tooth} — {rec.condition}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!patient && !selectedPatientId && (
                <div className="empty-state" style={{ marginTop: 40 }}>
                    Select a patient above to view and edit their dental chart
                </div>
            )}

            {/* Modal */}
            {activeTooth && selectedPatientId && (
                <ToothModal
                    tooth={activeTooth}
                    record={activeRecord}
                    onSave={handleSave}
                    onClose={() => setActiveTooth(null)}
                />
            )}
        </div>
    );
}
