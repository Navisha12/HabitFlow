import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'habitflow_auth';
const USERS_KEY = 'habitflow_users';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const savedAuth = localStorage.getItem(STORAGE_KEY);
        if (savedAuth) {
            try {
                const parsed = JSON.parse(savedAuth);
                setUser(parsed);
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setLoading(false);
    }, []);

    const getUsers = () => {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        } catch {
            return [];
        }
    };

    const saveUsers = (users) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    };

    const signup = async (name, email, password) => {
        const users = getUsers();

        // Check if email already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('An account with this email already exists');
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email: email.toLowerCase(),
            password, // In real app, this would be hashed
            plan: 'free',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        const authUser = { ...newUser };
        delete authUser.password;

        setUser(authUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

        return authUser;
    };

    const login = async (email, password) => {
        const users = getUsers();
        const foundUser = users.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (!foundUser) {
            throw new Error('Invalid email or password');
        }

        const authUser = { ...foundUser };
        delete authUser.password;

        setUser(authUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

        return authUser;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    const updatePlan = (plan) => {
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);

        if (userIndex !== -1) {
            users[userIndex].plan = plan;
            saveUsers(users);

            const updatedUser = { ...user, plan };
            setUser(updatedUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        }
    };

    const value = {
        user,
        loading,
        signup,
        login,
        logout,
        updatePlan,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
