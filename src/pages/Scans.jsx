import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image, X, ZoomIn, Search, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DOCTORS } from '../data/mockData';
import { format, parseISO } from 'date-fns';

export default function Scans() {
    const { patients, addScan } = useApp();
    const navigate = useNavigate();
    const [selectedPatient, setSelectedPatient] = useState('');
    const [scanType, setScanType] = useState('intraoral');
    const [toothNum, setToothNum] = useState('');
    const [comment, setComment] = useState('');
    const [lightbox, setLightbox] = useState(null);
    const [q, setQ] = useState('');
    const fileRef = useRef();

    const patient = patients.find(p => p.id === selectedPatient);
    const allScans = patients
        .filter(p => !q || p.name?.toLowerCase().includes(q.toLowerCase()))
        .flatMap(p => (p.scans || []).map(s => ({ ...s, patientName: p.name, patientId: p.id })))
        .sort((a, b) => b.timestamp?.localeCompare(a.timestamp || '') || 0);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !selectedPatient) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            addScan(selectedPatient, {
                imageData: ev.target.result,
                filename: file.name,
                type: scanType,
                toothNum,
                comment,
            });
            setComment('');
            setToothNum('');
            e.target.value = '';
            alert(`Scan uploaded for ${patient?.name}!`);
        };
        reader.readAsDataURL(file);
    };

    const SCAN_TYPES = ['intraoral', 'panoramic', 'xray', 'cbct', 'photo'];

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Scan Management</h1>
                    <p className="page-subtitle">Upload and view patient dental scans & X-rays</p>
                </div>
            </div>

            {/* Upload Section */}
            <div className="form-card" style={{ marginBottom: 24 }}>
                <div className="form-section-title"><Upload size={14} style={{ verticalAlign: 'middle' }} /> Upload New Scan</div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Patient</label>
                        <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                            <option value="">Select patient…</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Scan Type</label>
                        <select value={scanType} onChange={e => setScanType(e.target.value)}>
                            {SCAN_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Tooth Number (optional)</label>
                        <input value={toothNum} onChange={e => setToothNum(e.target.value)} placeholder="e.g. 26" />
                    </div>
                    <div className="form-group">
                        <label>Doctor's Comment</label>
                        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Brief observation or note" />
                    </div>
                </div>
                <label
                    className={`scan-upload-label ${!selectedPatient ? 'disabled' : ''}`}
                    style={{ cursor: selectedPatient ? 'pointer' : 'not-allowed', opacity: selectedPatient ? 1 : 0.5 }}
                >
                    <Upload size={24} />
                    <span>Click to browse or drag & drop scan image</span>
                    <small>Supports JPG, PNG, DICOM preview</small>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={!selectedPatient}
                        onChange={handleUpload}
                    />
                </label>
            </div>

            {/* Scan Gallery */}
            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="search-bar-inline">
                    <Search size={15} />
                    <input placeholder="Filter by patient name…" value={q} onChange={e => setQ(e.target.value)} />
                </div>
            </div>

            {allScans.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 40 }}>
                    <Image size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <div>No scans uploaded yet.</div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Upload a scan above to get started.</div>
                </div>
            ) : (
                <div className="scans-grid">
                    {allScans.map(scan => (
                        <div key={scan.id} className="scan-card">
                            <div className="scan-img-wrapper" onClick={() => setLightbox(scan)}>
                                {scan.imageData ? (
                                    <img src={scan.imageData} alt={scan.filename} className="scan-img" />
                                ) : (
                                    <div className="scan-placeholder"><Image size={32} /></div>
                                )}
                                <div className="scan-zoom"><ZoomIn size={20} /></div>
                            </div>
                            <div className="scan-info">
                                <div className="scan-patient-name" onClick={() => navigate(`/patients/${scan.patientId}`)}>
                                    {scan.patientName}
                                </div>
                                <div className="scan-meta">
                                    <span className="scan-type-tag">{scan.type}</span>
                                    {scan.toothNum && <span>Tooth #{scan.toothNum}</span>}
                                </div>
                                {scan.comment && <div className="scan-comment">"{scan.comment}"</div>}
                                <div className="scan-time">
                                    {scan.timestamp ? format(parseISO(scan.timestamp), 'd MMM yyyy, h:mm a') : '—'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div className="modal-overlay" onClick={() => setLightbox(null)}>
                    <div className="lightbox-box" onClick={e => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setLightbox(null)}><X size={22} /></button>
                        {lightbox.imageData && <img src={lightbox.imageData} alt={lightbox.filename} className="lightbox-img" />}
                        <div className="lightbox-info">
                            <strong>{lightbox.patientName}</strong> · {lightbox.type}
                            {lightbox.toothNum && ` · Tooth #${lightbox.toothNum}`}
                            {lightbox.comment && ` · "${lightbox.comment}"`}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
