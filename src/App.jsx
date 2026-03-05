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

import Hospitals from './pages/SuperAdmin/Hospitals';
import SuperAdminPortal from './pages/SuperAdmin/SuperAdminPortal';
import UserManagement from './pages/Admin/UserManagement.jsx';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Separate Super Admin Portal */}
                    <Route path="/superadmin/*" element={
                        <ProtectedRoute roles={['superadmin']}>
                            <SuperAdminPortal />
                        </ProtectedRoute>
                    } />

                    {/* Clinic Application Routes */}
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/patients" element={<Patients />} />
                                    <Route path="/patients/new" element={<NewPatient />} />
                                    <Route path="/patients/:id" element={<PatientProfile />} />
                                    <Route path="/appointments" element={<Appointments />} />
                                    <Route path="/billing" element={
                                        <ProtectedRoute roles={['admin', 'doctor']}>
                                            <Billing />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/billing/new" element={
                                        <ProtectedRoute roles={['admin', 'doctor']}>
                                            <NewBill />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/billing/new/:patientId" element={
                                        <ProtectedRoute roles={['admin', 'doctor']}>
                                            <NewBill />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/dental-chart" element={<DentalChart />} />
                                    <Route path="/dental-chart/:patientId" element={<DentalChart />} />
                                    <Route path="/nfc" element={<NFCMode />} />
                                    <Route path="/doctor" element={<DoctorPanel />} />
                                    <Route path="/scans" element={<Scans />} />

                                    {/* Admin Routes (if any left in clinic) */}
                                    <Route path="/admin/users" element={
                                        <ProtectedRoute roles={['admin', 'superadmin']}>
                                            <UserManagement />
                                        </ProtectedRoute>
                                    } />
                                </Routes>
                            </Layout>
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AppProvider>
    );
}
