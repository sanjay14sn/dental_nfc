import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Check, Clock, AlertCircle, Stethoscope, FileText, Upload, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DOCTORS, TREATMENTS } from '../data/mockData';
import { format } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');
const STATUS_COLOR = { scheduled: '#3b82f6', waiting: '#f59e0b', 'in-treatment': '#8b5cf6', completed: '#22c55e', cancelled: '#ef4444' };
const STATUS_LABEL = { scheduled: 'Scheduled', waiting: 'Waiting', 'in-treatment': 'In Treatment', completed: 'Completed', cancelled: 'Cancelled' };

export default function DoctorPanel() {
    const { patients, appointments, updateAppointment, addScan } = useApp();
    const navigate = useNavigate();
    const [selectedDoctor, setSelectedDoctor] = useState('d1');
    const [activeAppt, setActiveAppt] = useState(null);
    const [notes, setNotes] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const queue = appointments
        .filter(a => a.doctorId === selectedDoctor && a.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));

    const activePatient = activeAppt ? patients.find(p => p.id === activeAppt.patientId) : null;
    const toothIssues = activePatient
        ? Object.entries(activePatient.toothRecords || {}).filter(([, r]) => r.status === 'issue' || r.status === 'treatment')
        : [];

    const startVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Voice not supported in this browser. Try Chrome.'); return; }
        const rec = new SpeechRecognition();
        rec.lang = 'en-IN';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (e) => {
            const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
            setNotes(transcript);
        };
        rec.onend = () => setIsListening(false);
        rec.start();
        recognitionRef.current = rec;
        setIsListening(true);
    };

    const stopVoice = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    const markStatus = (apptId, status) => {
        updateAppointment(apptId, { status, notes: notes || undefined });
        if (status === 'completed') { setActiveAppt(null); setNotes(''); }
    };

    const handleScanUpload = (e) => {
        if (!activePatient) return;
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            addScan(activePatient.id, {
                imageData: ev.target.result,
                filename: file.name,
                doctorId: selectedDoctor,
                toothNum: '',
                comment: notes || 'Scan uploaded by doctor',
                type: 'intraoral',
            });
            alert('Scan uploaded successfully!');
        };
        reader.readAsDataURL(file);
    };

    const selectAppt = (a) => {
        setActiveAppt(a);
        setNotes(a.notes || '');
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Doctor Panel</h1>
                    <p className="page-subtitle">Today's patient queue — {format(new Date(), 'd MMMM yyyy')}</p>
                </div>
                <div>
                    <select
                        value={selectedDoctor}
                        onChange={e => { setSelectedDoctor(e.target.value); setActiveAppt(null); }}
                        className="doctor-select"
                    >
                        {DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name} ({d.speciality})</option>)}
                    </select>
                </div>
            </div>

            <div className="doctor-layout">
                {/* Queue */}
                <div className="doctor-queue">
                    <div className="section-header">
                        <div className="section-title"><Clock size={15} /> Queue ({queue.length})</div>
                    </div>
                    {queue.length === 0 && <div className="empty-state">No appointments today for selected doctor</div>}
                    {queue.map(a => {
                        const p = patients.find(pt => pt.id === a.patientId);
                        const isActive = activeAppt?.id === a.id;
                        return (
                            <div
                                key={a.id}
                                className={`queue-item ${isActive ? 'queue-item-active' : ''}`}
                                onClick={() => selectAppt(a)}
                            >
                                <div className="queue-time" style={{ color: STATUS_COLOR[a.status] }}>
                                    {a.time}
                                </div>
                                <div className="queue-patient">
                                    <div
                                        className="appt-avatar-sm"
                                        style={{ background: p?.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : 'linear-gradient(135deg,#3b82f6,#93c5fd)' }}
                                    >
                                        {p?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                    </div>
                                    <div>
                                        <div className="queue-name">{p?.name || '—'}</div>
                                        <div className="queue-treat">{a.treatmentType}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className="status-badge" style={{ '--s': STATUS_COLOR[a.status] || '#888' }}>
                                        {STATUS_LABEL[a.status] || a.status}
                                    </span>
                                    <ChevronRight size={14} style={{ color: 'var(--text-2)' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Treatment Panel */}
                <div className="doctor-treatment-panel">
                    {!activeAppt ? (
                        <div className="empty-state" style={{ marginTop: 60 }}>
                            <Stethoscope size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <div>Select a patient from the queue</div>
                        </div>
                    ) : (
                        <>
                            {/* Patient Header */}
                            <div className="doctor-patient-header">
                                <div
                                    className="profile-avatar"
                                    style={{ width: 56, height: 56, fontSize: 20, background: activePatient?.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : 'linear-gradient(135deg,#3b82f6,#93c5fd)' }}
                                >
                                    {activePatient?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 18 }}>{activePatient?.name}</div>
                                    <div style={{ color: 'var(--text-2)', fontSize: 13 }}>
                                        {activePatient?.phone} · NFC: {activePatient?.nfcId}
                                    </div>
                                    {activePatient?.medicalHistory && activePatient.medicalHistory !== 'None' && (
                                        <div className="profile-tag warning" style={{ display: 'inline-flex', marginTop: 4 }}>
                                            <span>⚠</span> {activePatient.medicalHistory}
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={() => navigate(`/patients/${activeAppt.patientId}`)}
                                >
                                    Full Profile
                                </button>
                            </div>

                            {/* Appointment Info */}
                            <div className="doctor-appt-info">
                                <span><strong>Treatment:</strong> {activeAppt.treatmentType}</span>
                                <span><strong>Time:</strong> {activeAppt.time}</span>
                                <span className="status-badge" style={{ '--s': STATUS_COLOR[activeAppt.status] }}>
                                    {STATUS_LABEL[activeAppt.status]}
                                </span>
                            </div>

                            {/* Tooth Issues */}
                            {toothIssues.length > 0 && (
                                <div className="doctor-tooth-issues">
                                    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                                        <AlertCircle size={14} style={{ verticalAlign: 'middle', color: '#f59e0b' }} /> Active Tooth Issues
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {toothIssues.map(([tooth, rec]) => (
                                            <div key={tooth} className="teeth-chip" style={{ '--c': '#f59e0b' }}>
                                                #{tooth} — {rec.condition}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Treatment Notes + Voice */}
                            <div className="form-card" style={{ marginTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div className="form-section-title" style={{ margin: 0 }}>
                                        <FileText size={14} style={{ verticalAlign: 'middle' }} /> Treatment Notes
                                    </div>
                                    <button
                                        className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                                        onClick={isListening ? stopVoice : startVoice}
                                        title={isListening ? 'Stop recording' : 'Start voice-to-text'}
                                    >
                                        {isListening ? <><MicOff size={14} /> Stop</> : <><Mic size={14} /> Voice</>}
                                    </button>
                                </div>
                                {isListening && (
                                    <div className="voice-indicator">
                                        <span className="voice-dot" />
                                        <span>Listening… speak your notes</span>
                                    </div>
                                )}
                                <textarea
                                    rows={5}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Type or dictate treatment notes, observations, prescription…"
                                />
                            </div>

                            {/* Scan Upload */}
                            <div className="form-card" style={{ marginTop: 12 }}>
                                <div className="form-section-title"><Upload size={14} style={{ verticalAlign: 'middle' }} /> Upload Scan</div>
                                <label className="scan-upload-label">
                                    <Upload size={20} />
                                    <span>Click to upload intraoral scan or X-ray</span>
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleScanUpload} />
                                </label>
                            </div>

                            {/* Status Actions */}
                            <div className="doctor-actions">
                                {activeAppt.status !== 'in-treatment' && activeAppt.status !== 'completed' && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => markStatus(activeAppt.id, 'in-treatment')}
                                    >
                                        <AlertCircle size={15} /> Start Treatment
                                    </button>
                                )}
                                {activeAppt.status !== 'completed' && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => markStatus(activeAppt.id, 'completed')}
                                    >
                                        <Check size={15} /> Mark Complete
                                    </button>
                                )}
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate(`/billing/new/${activeAppt.patientId}`)}
                                >
                                    Create Bill
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
