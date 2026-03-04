import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, CalendarDays, CreditCard, Cpu,
    Stethoscope, Activity, Search, Bell, ChevronLeft, ChevronRight,
    LogOut, Settings, Wifi, FileText, Image, Menu, X, Hospital as HospitalIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/patients', icon: Users, label: 'Patients', badge: null, permissionKey: 'patients' },
    { to: '/appointments', icon: CalendarDays, label: 'Appointments', permissionKey: 'bookings' },
    { to: '/dental-chart', icon: Activity, label: 'Dental Chart', permissionKey: 'dentalChart' },
    { to: '/scans', icon: Image, label: 'Scans', permissionKey: 'scans' },
    { to: '/billing', icon: CreditCard, label: 'Billing', permissionKey: 'payments' },
    { to: '/nfc', icon: Wifi, label: 'NFC Mode' },
    { to: '/doctor', icon: Stethoscope, label: 'Doctor Panel' },
];

export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [searchQ, setSearchQ] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const { searchPatients, appointments, user, logout } = useApp();
    const navigate = useNavigate();
    const searchRef = useRef(null);

    // Today's appointment count
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled').length;

    useEffect(() => {
        if (searchQ.length > 0) {
            setSearchResults(searchPatients(searchQ));
        } else {
            setSearchResults([]);
        }
    }, [searchQ]);

    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchResults([]);
                setSearchQ('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleResultClick = (p) => {
        setSearchResults([]);
        setSearchQ('');
        navigate(`/patients/${p.id}`);
    };

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-logo">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <path d="M14 4C10 4 7 7.5 7 11.5c0 2.5 1 4.5 1 6.5 0 2 1 4 3 5 .5.2 1 .3 1.5.3.5 0 1-.1 1.5-.3V23c0 .6.4 1 1 1s1-.4 1-1v-.5c.5.2 1 .3 1.5.3.5 0 1-.1 1.5-.3 2-1 3-3 3-5 0-2 1-4 1-6.5C21 7.5 18 4 14 4z" fill="currentColor" opacity="0.8" />
                        <circle cx="11" cy="11" r="1.5" fill="white" />
                        <circle cx="17" cy="11" r="1.5" fill="white" />
                    </svg>
                    {!collapsed && (
                        <div>
                            <div className="logo-text">DentaFlow</div>
                            <div className="logo-sub">Clinic Management</div>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {!collapsed && <div className="sidebar-section-label">Main Menu</div>}
                    {NAV_ITEMS.filter(item => {
                        // Super Admin & Admin see everything
                        if (['superadmin', 'admin'].includes(user?.role)) return true;

                        // Check granular permissions for others
                        if (item.permissionKey && user?.permissions) {
                            return user.permissions[item.permissionKey]?.read;
                        }

                        return true;
                    }).map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon size={18} />
                            {!collapsed && <span className="nav-label">{item.label}</span>}
                            {!collapsed && item.to === '/appointments' && todayCount > 0 && (
                                <span className="nav-badge">{todayCount}</span>
                            )}
                        </NavLink>
                    ))}

                    {/* Administration sections moved to Central Portal as requested by Super Admin */}

                    {!collapsed && <div className="sidebar-section-label" style={{ marginTop: 8 }}>System</div>}

                    {['admin', 'superadmin'].includes(user?.role) && (
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            title={collapsed ? 'Staff Management' : undefined}
                        >
                            <Stethoscope size={18} />
                            {!collapsed && <span className="nav-label">Staff Management</span>}
                        </NavLink>
                    )}

                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                        title={collapsed ? 'Settings' : undefined}
                    >
                        <Settings size={18} />
                        {!collapsed && <span className="nav-label">Settings</span>}
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar">{user?.avatar || '??'}</div>
                        {!collapsed && (
                            <div className="user-info">
                                <div className="user-name">{user?.name || 'Guest'}</div>
                                <div className="user-role">{user?.role || 'Clinician'}</div>
                            </div>
                        )}
                        <button className="logout-btn-mini" onClick={logout} title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Header */}
                <header className="app-header">
                    <button className="header-toggle" onClick={() => setCollapsed(c => !c)}>
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    <div className="header-search" ref={searchRef}>
                        <Search size={15} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search patient by name, phone, NFC ID..."
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                        />
                        {searchResults.length > 0 && (
                            <div className="search-results-dropdown">
                                {searchResults.map(p => (
                                    <div key={p.id} className="search-result-item" onClick={() => handleResultClick(p)}>
                                        <div className={`result-avatar ${p.gender?.toLowerCase() || 'other'}`} style={{
                                            background: p.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#f9a8d4)' : 'linear-gradient(135deg,#3b82f6,#93c5fd)'
                                        }}>
                                            {p.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div className="search-result-info">
                                            <div className="result-name">{p.name}</div>
                                            <div className="result-sub">{p.phone} • {p.nfcId}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="header-actions">
                        <button className="header-btn" title="Notifications">
                            <Bell size={18} />
                            <span className="notif-dot" />
                        </button>
                        <button className="header-btn" title="New Patient" onClick={() => navigate('/patients/new')}>
                            <Users size={18} />
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1 }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
