import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, Trash2, Hospital as HospitalIcon, Check, X } from 'lucide-react';

export default function Hospitals() {
    const { user } = useApp();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '', doctorName: '', address: '', contact: '', email: '', password: ''
    });

    const API_BASE = 'http://localhost:5001/api';

    const fetchHospitals = async () => {
        try {
            const res = await fetch(`${API_BASE}/hospitals`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            setHospitals(data);
        } catch (err) {
            console.error('Failed to fetch hospitals', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editing ? 'PUT' : 'POST';
        const url = editing ? `${API_BASE}/hospitals/${editing}` : `${API_BASE}/hospitals`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.message || 'Failed to save hospital');
                return;
            }

            setFormData({
                name: '', doctorName: '', address: '', contact: '', email: '', password: ''
            });
            setEditing(null);
            fetchHospitals();
        } catch (err) {
            console.error('Failed to save hospital', err);
        }
    };

    const deleteHospital = async (id) => {
        if (!window.confirm('Are you sure you want to delete this hospital?')) return;
        try {
            await fetch(`${API_BASE}/hospitals/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            fetchHospitals();
        } catch (err) {
            console.error('Failed to delete hospital', err);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Hospital Management</h1>
                    <p className="text-slate-500">Super Admin Dashboard</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                    <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Hospital' : 'Register New Hospital'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. City Dental Clinic"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.doctorName}
                                    onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Lead doctor name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mail ID (Login Username)</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="hospital@email.com"
                                />
                            </div>
                            {!editing && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.contact}
                                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="+91..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea
                                    required
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24"
                                    placeholder="Full address..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                            >
                                {editing ? 'Update Hospital' : 'Register Hospital'}
                            </button>
                            {editing && (
                                <button
                                    type="button"
                                    onClick={() => { setEditing(null); setFormData({ name: '', doctorName: '', address: '', contact: '', email: '', password: '' }); }}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {hospitals.map(hospital => (
                        <div key={hospital._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                    <HospitalIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-lg">{hospital.name}</h3>
                                    <p className="text-blue-600 text-sm font-medium">Dr. {hospital.doctorName}</p>
                                    <p className="text-slate-500 text-sm">{hospital.email} • {hospital.contact}</p>
                                    <p className="text-slate-400 text-xs mt-1">{hospital.address}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setEditing(hospital._id); setFormData(hospital); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => deleteHospital(hospital._id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {hospitals.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <HospitalIcon size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">No hospitals registered yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
