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
    const [patients, setPatients] = useState(() => load('dc_patients', []));
    const [appointments, setAppointments] = useState(() => load('dc_appointments', []));
    const [bills, setBills] = useState(() => load('dc_bills', []));
    const [user, setUser] = useState(() => load('dc_user', null));
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);

    /* ===============================
       AUTH FETCH (STRICT VERSION)
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

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Request failed');
        }

        return res;
    }, [user]);

    /* ===============================
       INITIAL DATA LOAD
    =============================== */
    useEffect(() => {
        if (!user?.token) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [ptsRes, apptsRes, billsRes, docsRes] = await Promise.all([
                    authFetch(`${API_BASE}/patients`),
                    authFetch(`${API_BASE}/appointments`),
                    authFetch(`${API_BASE}/bills`),
                    authFetch(`${API_BASE}/users/doctors`)
                ]);

                const [pts, appts, bls, docs] = await Promise.all([
                    ptsRes.json(),
                    apptsRes.json(),
                    billsRes.json(),
                    docsRes.json()
                ]);

                console.log('Fetched appointments:', appts);
                setPatients(pts);
                setAppointments(appts);
                setBills(bls);
                setDoctors(docs);

                localStorage.setItem('dc_patients', JSON.stringify(pts));
                localStorage.setItem('dc_appointments', JSON.stringify(appts));
                localStorage.setItem('dc_bills', JSON.stringify(bls));
            } catch (err) {
                console.error('Initial API fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, authFetch]);

    /* ===============================
       LOGIN
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

            if (!data.token) {
                console.error('Login response missing token');
                return false;
            }

            const userData = {
                ...data,
                avatar: data.name?.split(' ').map(n => n[0]).join('')
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
        localStorage.clear();
    };

    /* ===============================
       PATIENTS
    =============================== */
    const addPatient = async (p) => {
        const res = await authFetch(`${API_BASE}/patients`, {
            method: 'POST',
            body: JSON.stringify(p)
        });

        const patient = await res.json();
        setPatients(prev => [...prev, patient]);
        return patient;
    };

    const updatePatient = async (id, updates) => {
        const res = await authFetch(`${API_BASE}/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        const updated = await res.json();
        setPatients(prev =>
            prev.map(p => p._id === id ? updated : p)
        );
    };

    /* ===============================
       APPOINTMENTS (FIXED _id ONLY)
    =============================== */
    const addAppointment = async (a) => {
        console.log('POST /appointments request data:', a);
        const res = await authFetch(`${API_BASE}/appointments`, {
            method: 'POST',
            body: JSON.stringify(a)
        });

        const appt = await res.json();
        console.log('Appointed created:', appt);
        setAppointments(prev => [...prev, appt]);
        return appt;
    };

    const updateAppointment = async (id, updates) => {
        const res = await authFetch(`${API_BASE}/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        const updated = await res.json();
        setAppointments(prev =>
            prev.map(a => a._id === id ? updated : a)
        );
    };

    const deleteAppointment = async (id) => {
        await authFetch(`${API_BASE}/appointments/${id}`, {
            method: 'DELETE'
        });

        setAppointments(prev =>
            prev.filter(a => a._id !== id)
        );
    };

    /* ===============================
       BILLS
    =============================== */
    const addBill = async (b) => {
        const res = await authFetch(`${API_BASE}/bills`, {
            method: 'POST',
            body: JSON.stringify(b)
        });

        const bill = await res.json();
        setBills(prev => [...prev, bill]);
        return bill;
    };

    const updateBill = async (id, updates) => {
        const res = await authFetch(`${API_BASE}/bills/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        const updated = await res.json();
        setBills(prev =>
            prev.map(b => b._id === id ? updated : b)
        );
    };

    return (
        <AppContext.Provider value={{
            patients,
            appointments,
            bills,
            doctors,
            loading,
            addPatient,
            updatePatient,
            addAppointment,
            updateAppointment,
            deleteAppointment,
            addBill,
            updateBill,
            user,
            login,
            logout
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);