import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, CalendarDays, CreditCard, TrendingUp, AlertCircle, Clock, CheckCircle2, Activity, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { REVENUE_DATA, MONTHLY_DATA, TREATMENT_DIST, DOCTORS } from '../data/mockData';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b', '#06b6d4', '#f97316'];

export default function Dashboard() {
    const { patients, appointments, bills, user, loading } = useApp();
    const navigate = useNavigate();

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppts = appointments.filter(a => a.date === today);
    const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'partial');
    const totalRevenue = bills.filter(b => b.status === 'paid').reduce((s, b) => s + (b.paid || 0), 0);
    const todayRevenue = bills.filter(b => b.date === today).reduce((s, b) => s + (b.paid || 0), 0);

    const statusColor = { scheduled: '#3b82f6', waiting: '#f59e0b', 'in-treatment': '#8b5cf6', completed: '#22c55e', cancelled: '#ef4444' };
    const statusLabel = { scheduled: 'Scheduled', waiting: 'Waiting', 'in-treatment': 'In Treatment', completed: 'Done', cancelled: 'Cancelled' };

    const kpis = [
        { label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#22c55e', sub: 'From bills today', restricted: true },
        { label: 'Total Patients', value: patients.length, icon: Users, color: '#3b82f6', sub: `${patients.filter(p => p.status === 'active').length} active` },
        { label: "Today's Appointments", value: todayAppts.length, icon: CalendarDays, color: '#8b5cf6', sub: `${todayAppts.filter(a => a.status === 'completed').length} completed` },
        { label: 'Pending Dues', value: `₹${pendingBills.reduce((s, b) => s + (b.total - b.paid), 0).toLocaleString('en-IN')}`, icon: AlertCircle, color: '#f59e0b', sub: `${pendingBills.length} invoices`, restricted: true },
    ].filter(k => user?.role !== 'nurse' || !k.restricted);

    // --- Smart Recall Engine Logic ---
    const getRecallsDue = () => {
        const recalls = [];
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        patients.forEach(p => {
            const lastScaling = appointments
                .filter(a => a.patientId === p.id && a.treatmentType?.toLowerCase().includes('scaling'))
                .sort((a, b) => b.date.localeCompare(a.date))[0];

            if (lastScaling && new Date(lastScaling.date) < sixMonthsAgo) {
                recalls.push({ patient: p, type: 'Scaling & Polishing', reason: 'Due since ' + format(new Date(lastScaling.date), 'MMM yyyy') });
            }

            const lastRC = appointments
                .filter(a => a.patientId === p.id && a.treatmentType?.toLowerCase().includes('root canal'))
                .sort((a, b) => b.date.localeCompare(a.date))[0];

            if (lastRC && lastRC.status === 'completed' && recalls.length < 5) { // Limiting for demo
                const rcDate = new Date(lastRC.date);
                if (rcDate < new Date(Date.now() - 30 * 86400000)) {
                    recalls.push({ patient: p, type: 'RC Follow-up', reason: 'Treatment complete' });
                }
            }
        });
        return recalls.slice(0, 4); // Show top 4
    };

    const recallsDue = getRecallsDue();

    const handleRecallWhatsApp = (recall) => {
        const text = `*DentaFlow Clinic Reminder*\n\n` +
            `Hello ${recall.patient.name},\n` +
            `This is a friendly reminder for your *${recall.type}*. It has been over 6 months since your last visit. Regular checkups prevent expensive treatments later!\n\n` +
            `Click to book: [Clinic Link]`;
        window.open(`https://wa.me/${recall.patient.phone}?text=${encodeURIComponent(text)}`, '_blank');
    };
    // ---------------------------------

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">{format(new Date(), 'EEEE, d MMMM yyyy')} · DentaFlow Admin</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div className="revenue-pill">
                        <TrendingUp size={14} /> ₹3.2L Projected
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/patients/new')}>
                        <Users size={16} /> New Patient
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                {kpis.map((k, i) => (
                    <div key={i} className="kpi-card">
                        <div className="kpi-icon" style={{ background: k.color + '22', color: k.color }}>
                            <k.icon size={22} />
                        </div>
                        <div className="kpi-body">
                            <div className="kpi-value">{k.value}</div>
                            <div className="kpi-label">{k.label}</div>
                            <div className="kpi-sub">{k.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Engine / Recalls (New Section) */}
            {user?.role !== 'nurse' && (
                <div className="recall-section">
                    <div className="section-header">
                        <div className="section-title"><Clock size={16} color="#8b5cf6" /> Revenue Engine: Smart Recalls</div>
                        <span className="badge-purple">{recallsDue.length} Due Today</span>
                    </div>
                    <div className="recall-grid">
                        {recallsDue.map((r, i) => (
                            <div key={i} className="recall-card">
                                <div className="recall-p-info">
                                    <div className="recall-name">{r.patient.name}</div>
                                    <div className="recall-type">{r.type}</div>
                                    <div className="recall-reason">{r.reason}</div>
                                </div>
                                <button className="btn-whatsapp" onClick={() => handleRecallWhatsApp(r)}>
                                    <Phone size={12} /> Send Reminder
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="charts-grid">
                <div className="chart-card" style={{ display: user?.permissions?.payments?.read ? 'block' : 'none' }}>
                    <div className="chart-title">Weekly Revenue</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={REVENUE_DATA} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Monthly Patient Trend</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={MONTHLY_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                            <Line type="monotone" dataKey="patients" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <div className="chart-title">Treatment Distribution</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={TREATMENT_DIST} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                                {TREATMENT_DIST.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Today's Appointments + Doctor Table */}
            <div className="bottom-grid">
                <div className="section-card">
                    <div className="section-header">
                        <div className="section-title"><CalendarDays size={16} /> Today's Queue</div>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/appointments')}>View All</button>
                    </div>
                    <div className="appt-list">
                        {todayAppts.length === 0 && <div className="empty-state">No appointments today</div>}
                        {todayAppts.map(a => {
                            const patient = patients.find(p => p.id === a.patientId);
                            const doctor = DOCTORS.find(d => d.id === a.doctorId);
                            return (
                                <div key={a.id} className="appt-row" onClick={() => navigate(`/patients/${a.patientId}`)}>
                                    <div className="appt-time">{a.time}</div>
                                    <div className="appt-avatar" style={{ background: patient?.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : 'linear-gradient(135deg,#3b82f6,#93c5fd)' }}>
                                        {patient?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="appt-info">
                                        <div className="appt-name">{patient?.name}</div>
                                        <div className="appt-treat">{a.treatmentType} · {doctor?.name}</div>
                                    </div>
                                    <span className="status-badge" style={{ '--s': statusColor[a.status] || '#888' }}>
                                        {statusLabel[a.status] || a.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="section-card">
                    <div className="section-header">
                        <div className="section-title"><Activity size={16} /> Doctor Performance</div>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr><th>Doctor</th><th>Speciality</th><th>Today</th><th>Total</th></tr>
                        </thead>
                        <tbody>
                            {DOCTORS.map(d => {
                                const mine = appointments.filter(a => a.doctorId === d.id);
                                const todayMine = mine.filter(a => a.date === today);
                                return (
                                    <tr key={d.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                                                {d.name}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{d.speciality}</td>
                                        <td>{todayMine.length}</td>
                                        <td>{mine.length}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
