import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Stethoscope, Lock, User, AlertCircle, Sparkles, Activity, ShieldCheck } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(username, password);
            if (success) {
                // Get role from local storage to decide redirection
                const userData = JSON.parse(localStorage.getItem('dc_user'));
                if (userData?.role === 'superadmin') {
                    navigate('/superadmin/portal', { replace: true });
                } else {
                    navigate(from, { replace: true });
                }
            } else {
                setError('Invalid credentials. If you are an Admin, please use your dedicated ID.');
                setLoading(false);
            }
        } catch (err) {
            setError('Server connection failed');
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-decor">
                <div className="decor-blob blob-1"></div>
                <div className="decor-blob blob-2"></div>
                <div className="decor-icon icon-1"><Activity size={40} /></div>
                <div className="decor-icon icon-2"><Stethoscope size={40} /></div>
                <div className="decor-icon icon-3"><Sparkles size={40} /></div>
            </div>

            <div className="login-card fade-in">
                <div className="login-header">
                    <div className="login-logo">
                        <div className="logo-box">
                            <Stethoscope size={28} />
                        </div>
                        <div className="logo-text">
                            <span className="logo-brand">DentaFlow</span>
                            <span className="logo-tagline">Clinic Management</span>
                        </div>
                    </div>
                </div>

                <div className="login-body">
                    <h2>Welcome Back</h2>
                    <p className="login-intro">Please enter your credentials to access the clinic dashboard.</p>

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="login-error-alert">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Mail ID</label>
                            <div className="input-with-icon">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="e.g. hospital@email.com"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="login-helpers">
                            <label className="checkbox-container">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Remember me
                            </label>
                            <a href="#" className="forgot-pass">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary login-btn ${loading ? 'btn-loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <div className="login-footer">
                    <div className="security-badge">
                        <ShieldCheck size={14} />
                        <span>AES-256 Encrypted Session</span>
                    </div>
                </div>
            </div>

            <div className="login-test-info">
                <p>Clinic Login: <strong>admin</strong> / <strong>admin123</strong></p>
                <div className="mt-2 text-blue-500 font-bold flex items-center gap-2 justify-center cursor-pointer hover:underline" onClick={() => {
                    setUsername('superadmin'); setPassword('superadmin123');
                }}>
                    <ShieldCheck size={14} /> Global Admin Login (Portal Access)
                </div>
            </div>
        </div>
    );
}
