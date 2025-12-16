import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HabitProvider } from './context/HabitContext';
import { TaskProvider } from './context/TaskContext';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Tasks from './pages/Tasks';
import Subscription from './pages/Subscription';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--accent-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Preserve the return URL so user can come back after login
        const returnUrl = location.pathname + location.search;
        return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
    }

    return children;
}

function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return null;
    }

    if (isAuthenticated) {
        // Check for return URL from protected route redirect
        const params = new URLSearchParams(location.search);
        const returnUrl = params.get('returnUrl');
        if (returnUrl) {
            return <Navigate to={returnUrl} replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />
            <Route path="/signup" element={
                <PublicRoute>
                    <Signup />
                </PublicRoute>
            } />

            {/* Protected routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <HabitProvider>
                        <TaskProvider>
                            <Layout />
                        </TaskProvider>
                    </HabitProvider>
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="habits" element={<Habits />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="subscription" element={<Subscription />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <InstallPrompt />
            </AuthProvider>
        </BrowserRouter>
    );
}

