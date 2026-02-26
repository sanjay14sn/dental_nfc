import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Clock, ShieldAlert, TrendingUp, X } from 'lucide-react';

export default function AISummary({ patient, appointments = [], bills = [], onClose }) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        // Simulate AI thinking time
        const timer = setTimeout(() => {
            const result = generateClinicalInsight(patient, appointments, bills);
            setSummary(result);
            setLoading(false);
        }, 1800);
        return () => clearTimeout(timer);
    }, [patient, appointments, bills]);

    const generateClinicalInsight = (p, appts, bills) => {
        const recentAppts = appts.filter(a => a.status === 'completed').slice(-3);
        const lastVisit = recentAppts[0]?.date || 'None';
        const pendingDues = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + (b.total - b.paid), 0);

        let narrative = `Based on clinical data, ${p.name?.split(' ')[0]} is an ${p.status} patient `;

        // Medical risks
        if (p.medicalHistory && p.medicalHistory !== 'None') {
            narrative += `with significant medical history involving ${p.medicalHistory}. `;
        } else {
            narrative += `with no recorded systemic health issues. `;
        }

        // Treatment pattern
        if (recentAppts.length > 0) {
            const treatments = [...new Set(recentAppts.map(a => a.treatmentType))];
            narrative += `Recent activity shows a focus on ${treatments.join(' and ')} treatments. `;
        }

        // Professional recommendation
        let recommendation = "";
        if (pendingDues > 2000) {
            recommendation = "Recommended: Clear pending dues before proceeding with major elective procedures.";
        } else if (p.medicalHistory?.toLowerCase().includes('diabetes')) {
            recommendation = "Clinical Note: Monitor gum health closely; higher risk of periodontal issues due to diabetic history.";
        } else if (recentAppts.length === 0) {
            recommendation = "Suggested Action: Schedule an initial comprehensive check-up and scaling.";
        } else {
            recommendation = "Suggested: Continue with bi-annual preventive maintenance.";
        }

        return {
            overview: narrative,
            recommendation: recommendation,
            riskLevel: (p.medicalHistory && p.medicalHistory !== 'None') || pendingDues > 5000 ? 'Moderate' : 'Low',
            lastReview: lastVisit
        };
    };

    return (
        <div className="ai-summary-overlay">
            <div className="ai-summary-panel">
                <div className="ai-header">
                    <div className="ai-title">
                        <Sparkles size={18} className="sparkle-icon" />
                        <span>DentaFlow AI Insights</span>
                    </div>
                    <button className="ai-close" onClick={onClose}><X size={18} /></button>
                </div>

                {loading ? (
                    <div className="ai-loading">
                        <div className="ai-brain-anim"><Brain size={40} /></div>
                        <p>Analyzing clinical history...</p>
                        <div className="ai-progress-bar"><div className="ai-progress-fill"></div></div>
                    </div>
                ) : (
                    <div className="ai-content fade-in">
                        <div className="ai-section">
                            <div className="ai-section-label"><Brain size={14} /> Clinical Synthesis</div>
                            <p className="ai-narrative">{summary.overview}</p>
                        </div>

                        <div className="ai-insight-grid">
                            <div className="ai-insight-card">
                                <ShieldAlert size={16} style={{ color: summary.riskLevel === 'Low' ? '#22c55e' : '#f59e0b' }} />
                                <div>
                                    <div className="ai-card-title">Risk Profile</div>
                                    <div className="ai-card-val">{summary.riskLevel}</div>
                                </div>
                            </div>
                            <div className="ai-insight-card">
                                <Clock size={16} />
                                <div>
                                    <div className="ai-card-title">Last Review</div>
                                    <div className="ai-card-val">{summary.lastReview}</div>
                                </div>
                            </div>
                        </div>

                        <div className="ai-recommendation">
                            <TrendingUp size={16} className="ai-trend-icon" />
                            <span>{summary.recommendation}</span>
                        </div>

                        <div className="ai-footer">
                            <small>AI-generated for reference only. Professional judgment required.</small>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
