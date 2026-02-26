import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Printer, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';

const STATUS_CONFIG = {
    paid: { color: '#22c55e', label: 'Paid' },
    partial: { color: '#f59e0b', label: 'Partial' },
    pending: { color: '#ef4444', label: 'Pending' },
};

export default function Billing() {
    const { bills, patients, updateBill } = useApp();
    const navigate = useNavigate();
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = bills.filter(b => {
        const patient = patients.find(p => p.id === b.patientId);
        const matchQ = !q || patient?.name?.toLowerCase().includes(q.toLowerCase()) || b.id.includes(q);
        const matchS = statusFilter === 'all' || b.status === statusFilter;
        return matchQ && matchS;
    }).sort((a, b) => b.date.localeCompare(a.date));

    const totalRevenue = bills.filter(b => b.status === 'paid').reduce((s, b) => s + (b.paid || 0), 0);
    const totalPending = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + (b.total - b.paid), 0);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Billing</h1>
                    <p className="page-subtitle">{bills.length} invoices · ₹{totalRevenue.toLocaleString('en-IN')} collected</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/billing/new')}>
                    <Plus size={16} /> New Bill
                </button>
            </div>

            {/* Summary Row */}
            <div className="billing-summary">
                <div className="bill-stat-card" style={{ '--c': '#22c55e' }}>
                    <CheckCircle size={20} />
                    <div>
                        <div className="bill-stat-num">₹{totalRevenue.toLocaleString('en-IN')}</div>
                        <div className="bill-stat-lbl">Collected</div>
                    </div>
                </div>
                <div className="bill-stat-card" style={{ '--c': '#f59e0b' }}>
                    <AlertCircle size={20} />
                    <div>
                        <div className="bill-stat-num">₹{totalPending.toLocaleString('en-IN')}</div>
                        <div className="bill-stat-lbl">Pending Dues</div>
                    </div>
                </div>
                <div className="bill-stat-card" style={{ '--c': '#3b82f6' }}>
                    <CreditCard size={20} />
                    <div>
                        <div className="bill-stat-num">{bills.length}</div>
                        <div className="bill-stat-lbl">Total Invoices</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="toolbar">
                <div className="search-bar-inline">
                    <Search size={15} />
                    <input placeholder="Search by patient name or bill ID…" value={q} onChange={e => setQ(e.target.value)} />
                </div>
                <div className="filter-tabs">
                    {['all', 'paid', 'partial', 'pending'].map(s => (
                        <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bill Table */}
            <div className="table-card">
                <table className="data-table full-table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Patient</th>
                            <th>Date</th>
                            <th>Treatments</th>
                            <th>Mode</th>
                            <th>Total</th>
                            <th>Paid</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-2)' }}>No bills found</td></tr>
                        )}
                        {filtered.map(b => {
                            const patient = patients.find(p => p.id === b.patientId);
                            const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                            return (
                                <tr key={b.id}>
                                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{b.id.toUpperCase()}</td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{patient?.name || '—'}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{patient?.phone}</div>
                                    </td>
                                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{b.date ? format(parseISO(b.date), 'd MMM yyyy') : '—'}</td>
                                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                                        {b.items?.map((it, i) => <div key={i}>{it.treatment}{it.tooth ? ` #${it.tooth}` : ''}</div>)}
                                    </td>
                                    <td style={{ fontSize: 13 }}>{b.paymentMode}</td>
                                    <td style={{ fontWeight: 600 }}>₹{b.total?.toLocaleString('en-IN')}</td>
                                    <td style={{ fontWeight: 600, color: '#22c55e' }}>₹{b.paid?.toLocaleString('en-IN')}</td>
                                    <td>
                                        <span className="status-badge" style={{ '--s': cfg.color }}>{cfg.label}</span>
                                    </td>
                                    <td>
                                        {b.status !== 'paid' && (
                                            <button className="btn btn-ghost btn-xs" onClick={() => updateBill(b.id, { status: 'paid', paid: b.total })}>Mark Paid</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
