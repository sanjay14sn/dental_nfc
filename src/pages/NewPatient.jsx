import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Wifi, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BLOOD_GROUPS, DOCTORS } from '../data/mockData';
import { differenceInYears, parseISO } from 'date-fns';

const EMPTY = {
    name: '', phone: '', altPhone: '', dob: '', gender: 'Male',
    bloodGroup: 'O+', address: '', email: '', medicalHistory: '',
    allergies: '', conditions: '', emergencyContact: '', notes: '',
    nfcId: '', firstDoctor: 'd1',
};

export default function NewPatient() {
    const { addPatient } = useApp();
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});

    const age = form.dob ? differenceInYears(new Date(), parseISO(form.dob)) : null;

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.phone.match(/^[6-9]\d{9}$/)) e.phone = 'Valid 10-digit mobile required';
        if (!form.dob) e.dob = 'Date of birth required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            const patient = await addPatient(form);
            navigate(`/patients/${patient._id}`);
        } catch (err) {
            setErrors({ submit: 'Failed to register patient. Please try again.' });
        }
    };

    const simulateNfc = () => {
        const id = 'NFC' + Math.floor(Math.random() * 9000 + 1000);
        set('nfcId', id);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
                    <div>
                        <h1 className="page-title">Register New Patient</h1>
                        <p className="page-subtitle">Fill in the patient's details below</p>
                    </div>
                </div>
            </div>

            <form className="form-card" onSubmit={handleSubmit}>
                <div className="form-section-title">Personal Information</div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input className={errors.name ? 'error' : ''} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Arjun Kapoor" />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                        <label>Gender</label>
                        <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                            {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Date of Birth *</label>
                        <input type="date" className={errors.dob ? 'error' : ''} value={form.dob} onChange={e => set('dob', e.target.value)} />
                        {age !== null && <span className="form-hint">Age: {age} years</span>}
                        {errors.dob && <span className="form-error">{errors.dob}</span>}
                    </div>
                    <div className="form-group">
                        <label>Blood Group</label>
                        <select value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                            {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-section-title">Contact Details</div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Contact Number *</label>
                        <input type="tel" className={errors.phone ? 'error' : ''} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" />
                        {errors.phone && <span className="form-error">{errors.phone}</span>}
                    </div>
                    <div className="form-group">
                        <label>Alternate Phone</label>
                        <input type="tel" value={form.altPhone} onChange={e => set('altPhone', e.target.value)} placeholder="Optional" />
                    </div>
                    <div className="form-group">
                        <label>Mail ID</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="patient@email.com" />
                    </div>
                    <div className="form-group">
                        <label>Emergency Contact</label>
                        <input value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} placeholder="Name – Phone" />
                    </div>
                    <div className="form-group form-group-full">
                        <label>Address</label>
                        <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, City" />
                    </div>
                </div>

                <div className="form-section-title">Medical History</div>
                <div className="form-grid">
                    <div className="form-group form-group-full">
                        <label>Medical History / Existing Conditions</label>
                        <textarea rows={2} value={form.medicalHistory} onChange={e => set('medicalHistory', e.target.value)} placeholder="Diabetes, hypertension, heart conditions, etc." />
                    </div>
                    <div className="form-group">
                        <label>Known Allergies</label>
                        <input value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Penicillin, latex, etc." />
                    </div>
                    <div className="form-group">
                        <label>Current Medications</label>
                        <input value={form.conditions} onChange={e => set('conditions', e.target.value)} placeholder="Metformin, aspirin, etc." />
                    </div>
                    <div className="form-group form-group-full">
                        <label>Additional Notes</label>
                        <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any other relevant information" />
                    </div>
                </div>

                <div className="form-section-title">Clinic Assignment</div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Assigned Doctor</label>
                        <select value={form.firstDoctor} onChange={e => set('firstDoctor', e.target.value)}>
                            {DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>NFC Card ID</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input value={form.nfcId} onChange={e => set('nfcId', e.target.value)} placeholder="Auto-assigned if blank" style={{ flex: 1 }} />
                            <button type="button" className="btn btn-secondary" onClick={simulateNfc} style={{ whiteSpace: 'nowrap' }}>
                                <Wifi size={14} /> Simulate
                            </button>
                        </div>
                        {form.nfcId && <span className="form-hint nfc-badge">NFC: {form.nfcId}</span>}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">
                        <UserPlus size={16} /> Register Patient
                    </button>
                </div>
            </form>
        </div>
    );
}
