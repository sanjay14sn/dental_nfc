import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Printer, Plus, X, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TREATMENTS, DOCTORS } from '../data/mockData';
import { format } from 'date-fns';

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Split'];
const GST_RATE = 0.18;

export default function NewBill() {
    const { patientId: prePatient } = useParams();
    const navigate = useNavigate();
    const { patients, addBill } = useApp();
    const [patientId, setPatientId] = useState(prePatient || '');
    const [items, setItems] = useState([{ treatment: '', tooth: '', price: 0, qty: 1 }]);
    const [discount, setDiscount] = useState(0);
    const [gst, setGst] = useState(false);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(null);
    const printRef = useRef();

    const patient = patients.find(p => p.id === patientId);
    const subtotal = items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1), 0);
    const gstAmt = gst ? (subtotal - discount) * GST_RATE : 0;
    const total = subtotal - discount + gstAmt;

    const setItem = (i, k, v) => {
        const updated = [...items];
        updated[i] = { ...updated[i], [k]: v };
        if (k === 'treatment') {
            const t = TREATMENTS.find(t => t.name === v);
            if (t) updated[i].price = t.price;
        }
        setItems(updated);
    };

    const addItem = () => setItems(i => [...i, { treatment: '', tooth: '', price: 0, qty: 1 }]);
    const removeItem = (i) => setItems(it => it.filter((_, idx) => idx !== i));

    const handleSave = async () => {
        if (!patientId || items.some(it => !it.treatment)) return;
        try {
            const bill = await addBill({
                patientId, items, discount: parseFloat(discount) || 0,
                gst, paymentMode, notes,
                total: Math.round(total), paid: Math.round(total),
                status: 'paid', date: format(new Date(), 'yyyy-MM-dd'),
            });
            setSaved(bill);
        } catch (err) {
            console.error('Failed to save bill:', err);
        }
    };

    const handlePrint = () => window.print();

    if (saved) {
        return (
            <div className="page">
                <div className="print-success">
                    <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                    <h2>Bill Saved!</h2>
                    <p>Invoice {saved.id.toUpperCase()} for {patient?.name}</p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
                        <button className="btn btn-secondary" onClick={handlePrint}><Printer size={15} /> Print Invoice</button>
                        <button className="btn btn-primary" onClick={() => navigate('/billing')}>Back to Billing</button>
                        <button className="btn btn-ghost" onClick={() => navigate(`/patients/${patientId}`)}>View Patient</button>
                    </div>
                </div>

                {/* Printable Invoice */}
                <div className="invoice-print" ref={printRef}>
                    <div className="invoice-header">
                        <div className="invoice-clinic">DentaFlow Dental Clinic</div>
                        <div className="invoice-sub">Tax Invoice</div>
                        <div className="invoice-id">#{saved.id.toUpperCase()}</div>
                        <div className="invoice-date">{format(new Date(), 'd MMMM yyyy')}</div>
                    </div>
                    <div className="invoice-patient">
                        <strong>Patient:</strong> {patient?.name}<br />
                        Phone: {patient?.phone}<br />
                        {patient?.address && <>Address: {patient?.address}</>}
                    </div>
                    <table className="invoice-table">
                        <thead><tr><th>#</th><th>Treatment</th><th>Tooth</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
                        <tbody>
                            {items.map((it, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{it.treatment}</td>
                                    <td>{it.tooth || '—'}</td>
                                    <td>{it.qty}</td>
                                    <td>₹{parseFloat(it.price).toLocaleString('en-IN')}</td>
                                    <td>₹{(parseFloat(it.price) * parseInt(it.qty)).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="invoice-totals">
                        <div className="inv-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                        {discount > 0 && <div className="inv-row"><span>Discount</span><span>-₹{parseFloat(discount).toLocaleString('en-IN')}</span></div>}
                        {gst && <div className="inv-row"><span>GST (18%)</span><span>₹{Math.round(gstAmt).toLocaleString('en-IN')}</span></div>}
                        <div className="inv-row total"><span>TOTAL</span><span>₹{Math.round(total).toLocaleString('en-IN')}</span></div>
                        <div className="inv-row"><span>Payment Mode</span><span>{paymentMode}</span></div>
                        <div className="inv-row"><span>Status</span><span style={{ color: '#22c55e', fontWeight: 600 }}>PAID</span></div>
                    </div>
                    {notes && <div className="invoice-notes"><strong>Notes:</strong> {notes}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
                    <div>
                        <h1 className="page-title">New Bill</h1>
                        <p className="page-subtitle">Create invoice for patient</p>
                    </div>
                </div>
            </div>

            <div className="bill-builder">
                <div className="bill-main">
                    {/* Patient Select */}
                    <div className="form-card">
                        <div className="form-section-title">Patient</div>
                        <div className="form-group">
                            <select value={patientId} onChange={e => setPatientId(e.target.value)}>
                                <option value="">Select patient…</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
                            </select>
                        </div>
                        {patient && (
                            <div className="selected-patient-info">
                                <span>{patient.gender} · {patient.bloodGroup}</span>
                                <span>NFC: {patient.nfcId}</span>
                                {patient.medicalHistory !== 'None' && <span style={{ color: '#f59e0b' }}>⚠ {patient.medicalHistory}</span>}
                            </div>
                        )}
                    </div>

                    {/* Line Items */}
                    <div className="form-card">
                        <div className="form-section-title">Treatment Items</div>
                        <div className="bill-items">
                            {items.map((it, i) => (
                                <div key={i} className="bill-item-row">
                                    <div className="form-group" style={{ flex: 3 }}>
                                        {i === 0 && <label>Treatment</label>}
                                        <input list={`tlist-${i}`} value={it.treatment} onChange={e => setItem(i, 'treatment', e.target.value)} placeholder="Treatment name" />
                                        <datalist id={`tlist-${i}`}>{TREATMENTS.map(t => <option key={t.id} value={t.name} />)}</datalist>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        {i === 0 && <label>Tooth #</label>}
                                        <input value={it.tooth} onChange={e => setItem(i, 'tooth', e.target.value)} placeholder="e.g. 26" />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        {i === 0 && <label>Qty</label>}
                                        <input type="number" min={1} value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1.5 }}>
                                        {i === 0 && <label>Rate (₹)</label>}
                                        <input type="number" value={it.price} onChange={e => setItem(i, 'price', e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1.5 }}>
                                        {i === 0 && <label>Amount</label>}
                                        <div className="line-total">₹{((parseFloat(it.price) || 0) * (parseInt(it.qty) || 1)).toLocaleString('en-IN')}</div>
                                    </div>
                                    <button className="btn btn-ghost btn-icon danger" style={{ marginTop: i === 0 ? 22 : 0 }} onClick={() => removeItem(i)} disabled={items.length === 1}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={14} /> Add Item</button>
                    </div>

                    {/* Notes */}
                    <div className="form-card">
                        <div className="form-group">
                            <label>Notes / Remarks</label>
                            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Balance due, next visit, etc." />
                        </div>
                    </div>
                </div>

                {/* Summary Panel */}
                <div className="bill-summary-panel">
                    <div className="form-card sticky-panel">
                        <div className="form-section-title">Payment Summary</div>
                        <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                        <div className="form-group">
                            <label>Discount (₹)</label>
                            <input type="number" value={discount} min={0} max={subtotal} onChange={e => setDiscount(e.target.value)} />
                        </div>
                        <label className="toggle-row">
                            <input type="checkbox" checked={gst} onChange={e => setGst(e.target.checked)} />
                            <span>Apply GST (18%)</span>
                            {gst && <span style={{ marginLeft: 'auto', color: '#3b82f6' }}>+₹{Math.round(gstAmt).toLocaleString('en-IN')}</span>}
                        </label>
                        {discount > 0 && <div className="summary-row"><span>Discount</span><span style={{ color: '#ef4444' }}>-₹{parseFloat(discount).toLocaleString('en-IN')}</span></div>}
                        <div className="summary-total"><span>Total</span><span>₹{Math.round(total).toLocaleString('en-IN')}</span></div>

                        <div className="form-section-title" style={{ marginTop: 16 }}>Payment Mode</div>
                        <div className="payment-modes">
                            {PAYMENT_MODES.map(m => (
                                <button key={m} className={`payment-btn ${paymentMode === m ? 'active' : ''}`} onClick={() => setPaymentMode(m)}>{m}</button>
                            ))}
                        </div>

                        <button className="btn btn-primary full-width" style={{ marginTop: 20 }} onClick={handleSave} disabled={!patientId}>
                            <Save size={16} /> Save &amp; Generate Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
