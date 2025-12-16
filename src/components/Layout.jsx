import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Target,
    CheckSquare,
    CreditCard,
    LogOut,
    Sparkles
} from 'lucide-react';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <Sparkles size={28} />
                    <span>HabitFlow</span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/habits"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Target size={20} />
                        Habits
                    </NavLink>

                    <NavLink
                        to="/tasks"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <CheckSquare size={20} />
                        Tasks
                    </NavLink>

                    <NavLink
                        to="/subscription"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <CreditCard size={20} />
                        Subscription
                    </NavLink>
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
