import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);
const API_BASE = 'http://localhost:5001/api';

const load = (key, fallback) => {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch {
        return fallback;
    }
};

export function AppProvider({ children }) {
    // --- State ---
    const [user, setUser] = useState(() => load('dc_user', null));
    const [patients, setPatients] = useState(() => load('dc_patients', []));
    const [appointments, setAppointments] = useState(() => load('dc_appointments', []));
    const [bills, setBills] = useState(() => load('dc_bills', []));
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);

    /* ===============================
       AUTH FETCH (Secure API Caller)
    =============================== */
    const authFetch = useCallback(async (url, options = {}) => {
        const token = user?.token;

        if (!token) {
            console.error('No auth token found');
            throw new Error('Not authenticated');
        }

        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...options.headers
            }
        });

        if (res.status === 401) {
            setUser(null);
            localStorage.clear();
            throw new Error('Session expired');
        }

        return res;
    }, [user]);

    /* ===============================
       INITIAL DATA LOAD
    =============================== */
    const refreshData = useCallback(async () => {
        if (!user?.token) return;

        setLoading(true);
        try {
            // We fetch all core data needed for Dashboard & Operations
            const [ptsRes, apptsRes, billsRes, docsRes] = await Promise.all([
                authFetch(`${API_BASE}/patients`),
                authFetch(`${API_BASE}/appointments`),
                authFetch(`${API_BASE}/bills`),
                authFetch(`${API_BASE}/users/doctors`) // Assuming you have an endpoint for doctor list
            ]);

            if (ptsRes.ok && apptsRes.ok && billsRes.ok) {
                const pts = await ptsRes.json();
                const appts = await apptsRes.json();
                const bls = await billsRes.json();

                // Handle doctors gracefully (if endpoint fails, use empty array)
                const docs = docsRes.ok ? await docsRes.json() : [];

                setPatients(pts);
                setAppointments(appts);
                setBills(bls);
                setDoctors(docs);

                // Cache for offline/reload speed
                localStorage.setItem('dc_patients', JSON.stringify(pts));
                localStorage.setItem('dc_appointments', JSON.stringify(appts));
                localStorage.setItem('dc_bills', JSON.stringify(bls));
            }
        } catch (err) {
            console.error('Initial API fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, [user, authFetch]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    /* ===============================
       AUTH ACTIONS
    =============================== */
    const login = async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) return false;

            const data = await res.json();
            if (!data.token) return false;

            // Generate a simple avatar initial if not provided
            const userData = {
                ...data,
                avatar: data.name ? data.name.split(' ').map(n => n[0]).join('') : 'U'
            };

            setUser(userData);
            localStorage.setItem('dc_user', JSON.stringify(userData));
            return true;
        } catch (err) {
            console.error('Login failed:', err);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        setPatients([]);
        setAppointments([]);
        setBills([]);
        localStorage.clear();
    };

    /* ===============================
       CRUD OPERATIONS
    =============================== */

    // --- Patients ---
    const addPatient = async (p) => {
        const res = await authFetch(`${API_BASE}/patients`, {
            method: 'POST',
            body: JSON.stringify(p)
        });
        const saved = await res.json();
        setPatients(prev => [...prev, saved]);
        return saved;
    };

    const updatePatient = async (id, updates) => {
        const res = await authFetch(`${API_BASE}/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        const saved = await res.json();
        setPatients(prev => prev.map(p => p._id === id ? saved : p));
        return saved;
    };

    // --- Appointments ---
    const addAppointment = async (a) => {
        const res = await authFetch(`${API_BASE}/appointments`, {
            method: 'POST',
            body: JSON.stringify(a)
        });
        const saved = await res.json();
        setAppointments(prev => [...prev, saved]);
        return saved;
    };

    const updateAppointment = async (id, updates) => {
        const res = await authFetch(`${API_BASE}/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        const saved = await res.json();
        setAppointments(prev => prev.map(a => a._id === id ? saved : a));
        return saved;
    };

    const deleteAppointment = async (id) => {
        await authFetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
        setAppointments(prev => prev.filter(a => a._id !== id));
    };

    // --- Bills ---
    const addBill = async (b) => {
        const res = await authFetch(`${API_BASE}/bills`, {
            method: 'POST',
            body: JSON.stringify(b)
        });
        const saved = await res.json();
        setBills(prev => [...prev, saved]);
        return saved;
    };

    const updateBill = async (id, updates) => {
        const res = await authFetch(`${API_BASE}/bills/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        const saved = await res.json();
        setBills(prev => prev.map(b => b._id === id ? saved : b));
        return saved;
    };

    return (
        <AppContext.Provider value={{
            // State
            user,
            patients,
            appointments,
            bills,
            doctors,
            loading,
            API_BASE, // Exporting this so other components can use it

            // Auth
            login,
            logout,
            authFetch, // Exporting this so UserManagement can use it

            // Actions
            refreshData,
            addPatient,
            updatePatient,
            addAppointment,
            updateAppointment,
            deleteAppointment,
            addBill,
            updateBill
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);