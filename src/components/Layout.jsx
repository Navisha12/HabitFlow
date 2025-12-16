import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Target,
    CheckSquare,
    CreditCard,
    LogOut,
    Sparkles,
    Menu,
    X
} from 'lucide-react';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getPlanLabel = (plan) => {
        switch (plan) {
            case 'premium': return 'Premium';
            case 'pro': return 'Pro';
            default: return 'Free';
        }
    };

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/habits', icon: Target, label: 'Habits' },
        { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { to: '/subscription', icon: CreditCard, label: 'Subscription' },
    ];

    return (
        <div className="app-layout">
            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="mobile-header-content">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="mobile-logo">
                        <Sparkles size={22} />
                        <span>HabitFlow</span>
                    </div>
                    <div className="mobile-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar - Desktop always visible, Mobile slide-out */}
            <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header-mobile">
                    <div className="sidebar-logo">
                        <Sparkles size={28} />
                        <span>HabitFlow</span>
                    </div>
                    <button
                        className="mobile-close-btn"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user?.name}</div>
                            <div className="user-plan">{getPlanLabel(user?.plan)} Plan</div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost"
                        style={{ width: '100%', marginTop: '12px', justifyContent: 'flex-start' }}
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
