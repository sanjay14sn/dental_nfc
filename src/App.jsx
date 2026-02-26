import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import NewPatient from './pages/NewPatient';
import PatientProfile from './pages/PatientProfile';
import Appointments from './pages/Appointments';
import Billing from './pages/Billing';
import NewBill from './pages/NewBill';
import DentalChart from './pages/DentalChart';
import NFCMode from './pages/NFCMode';
import DoctorPanel from './pages/DoctorPanel';
import Scans from './pages/Scans';

import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/*" element={
                        <ProtectedRoute>
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/patients" element={<Patients />} />
                                    <Route path="/patients/new" element={<NewPatient />} />
                                    <Route path="/patients/:id" element={<PatientProfile />} />
                                    <Route path="/appointments" element={<Appointments />} />
                                    <Route path="/billing" element={<Billing />} />
                                    <Route path="/billing/new" element={<NewBill />} />
                                    <Route path="/billing/new/:patientId" element={<NewBill />} />
                                    <Route path="/dental-chart" element={<DentalChart />} />
                                    <Route path="/dental-chart/:patientId" element={<DentalChart />} />
                                    <Route path="/nfc" element={<NFCMode />} />
                                    <Route path="/doctor" element={<DoctorPanel />} />
                                    <Route path="/scans" element={<Scans />} />
                                </Routes>
                            </Layout>
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AppProvider>
    );
}
