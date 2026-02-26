import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_PATIENTS, MOCK_APPOINTMENTS, MOCK_BILLS } from '../data/mockData';

const AppContext = createContext(null);
const API_BASE = 'http://localhost:5001/api';

const load = (key, fallback) => {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
};

export function AppProvider({ children }) {
    const [patients, setPatients] = useState(() => load('dc_patients', MOCK_PATIENTS));
    const [appointments, setAppointments] = useState(() => load('dc_appointments', MOCK_APPOINTMENTS));
    const [bills, setBills] = useState(() => load('dc_bills', MOCK_BILLS));
    const [user, setUser] = useState(() => load('dc_user', null));
    const [loading, setLoading] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [pts, appts, bls] = await Promise.all([
                    fetch(`${API_BASE}/patients`).then(r => r.json()),
                    fetch(`${API_BASE}/appointments`).then(r => r.json()),
                    fetch(`${API_BASE}/bills`).then(r => r.json())
                ]);
                setPatients(pts);
                setAppointments(appts);
                setBills(bls);
                localStorage.setItem('dc_patients', JSON.stringify(pts));
                localStorage.setItem('dc_appointments', JSON.stringify(appts));
                localStorage.setItem('dc_bills', JSON.stringify(bls));
            } catch (err) {
                console.error('API Fetch failed, using local storage:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const login = async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                const userData = { ...data.user, avatar: data.user.name.split(' ').map(n => n[0]).join('') };
                setUser(userData);
                localStorage.setItem('dc_user', JSON.stringify(userData));
                return true;
            }
        } catch (err) {
            // Fallback for demo
            if (username === 'admin' && password === 'admin123') {
                const userData = { id: 'u1', name: 'Dr. Sanjay Naveen', role: 'Medical Director', avatar: 'DN' };
                setUser(userData);
                localStorage.setItem('dc_user', JSON.stringify(userData));
                return true;
            }
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('dc_user');
    };

    // Patients
    const addPatient = async (p) => {
        try {
            const res = await fetch(`${API_BASE}/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(p)
            });
            const patient = await res.json();
            setPatients(prev => [...prev, patient]);
            return patient;
        } catch (err) {
            const patient = { ...p, id: 'p' + Date.now(), registrationDate: new Date().toISOString().split('T')[0] };
            setPatients(prev => [...prev, patient]);
            return patient;
        }
    };

    const updatePatient = async (id, updates) => {
        try {
            const res = await fetch(`${API_BASE}/patients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const updated = await res.json();
            setPatients(prev => prev.map(p => p.id === id ? updated : p));
        } catch (err) {
            setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        }
    };

    const getPatient = (id) => patients.find(p => p.id === id);
    const getPatientByNfc = (nfcId) => patients.find(p => p.nfcId?.toLowerCase() === nfcId?.toLowerCase());

    const updateToothRecord = (patientId, toothNum, record) => {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            const newRecords = { ...patient.toothRecords, [toothNum]: { ...patient.toothRecords[toothNum], ...record } };
            updatePatient(patientId, { toothRecords: newRecords });
        }
    };

    const addScan = (patientId, scan) => {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            const newScans = [...(patient.scans || []), { ...scan, id: 's' + Date.now(), timestamp: new Date().toISOString() }];
            updatePatient(patientId, { scans: newScans });
        }
    };

    // Appointments
    const addAppointment = async (a) => {
        try {
            const res = await fetch(`${API_BASE}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(a)
            });
            const appt = await res.json();
            setAppointments(prev => [...prev, appt]);
            return appt;
        } catch (err) {
            const appt = { ...a, id: 'a' + Date.now() };
            setAppointments(prev => [...prev, appt]);
            return appt;
        }
    };

    const updateAppointment = async (id, updates) => {
        try {
            const res = await fetch(`${API_BASE}/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const updated = await res.json();
            setAppointments(prev => prev.map(a => a.id === id ? updated : a));
        } catch (err) {
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        }
    };

    const deleteAppointment = async (id) => {
        try {
            await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
            setAppointments(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            setAppointments(prev => prev.filter(a => a.id !== id));
        }
    };

    // Bills
    const addBill = async (b) => {
        try {
            const res = await fetch(`${API_BASE}/bills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(b)
            });
            const bill = await res.json();
            setBills(prev => [...prev, bill]);
            return bill;
        } catch (err) {
            const bill = { ...b, id: 'b' + Date.now() };
            setBills(prev => [...prev, bill]);
            return bill;
        }
    };

    const updateBill = async (id, updates) => {
        try {
            const res = await fetch(`${API_BASE}/bills/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const updated = await res.json();
            setBills(prev => prev.map(b => b.id === id ? updated : b));
        } catch (err) {
            setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        }
    };

    // Search
    const searchPatients = useCallback((query) => {
        if (!query || query.length < 1) return [];
        const q = query.toLowerCase();
        return patients.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.phone?.includes(q) ||
            p.nfcId?.toLowerCase().includes(q) ||
            p.id?.toLowerCase().includes(q)
        ).slice(0, 8);
    }, [patients]);

    return (
        <AppContext.Provider value={{
            patients, appointments, bills, loading,
            addPatient, updatePatient, getPatient, getPatientByNfc,
            updateToothRecord, addScan,
            addAppointment, updateAppointment, deleteAppointment,
            addBill, updateBill,
            searchPatients,
            user, login, logout
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);

