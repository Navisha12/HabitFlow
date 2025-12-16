import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const HabitContext = createContext(null);

const STORAGE_KEY = 'habitflow_habits';

export function HabitProvider({ children }) {
    const { user } = useAuth();
    const [habits, setHabits] = useState([]);

    // Load habits when user changes
    useEffect(() => {
        if (user) {
            const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
            if (saved) {
                try {
                    setHabits(JSON.parse(saved));
                } catch {
                    setHabits([]);
                }
            } else {
                setHabits([]);
            }
        } else {
            setHabits([]);
        }
    }, [user]);

    // Save habits when they change
    useEffect(() => {
        if (user) {
            localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(habits));
        }
    }, [habits, user]);

    const getPlanLimits = () => {
        switch (user?.plan) {
            case 'premium': return { habits: Infinity };
            case 'pro': return { habits: 20 };
            default: return { habits: 5 };
        }
    };

    const addHabit = (habit) => {
        const limits = getPlanLimits();
        if (habits.length >= limits.habits) {
            throw new Error(`You've reached the limit of ${limits.habits} habits. Upgrade your plan for more!`);
        }

        const newHabit = {
            id: Date.now().toString(),
            title: habit.title,
            description: habit.description || '',
            color: habit.color || '#6366f1',
            streak: 0,
            completedDates: [],
            createdAt: new Date().toISOString()
        };

        setHabits(prev => [...prev, newHabit]);
        return newHabit;
    };

    const updateHabit = (id, updates) => {
        setHabits(prev => prev.map(h =>
            h.id === id ? { ...h, ...updates } : h
        ));
    };

    const deleteHabit = (id) => {
        setHabits(prev => prev.filter(h => h.id !== id));
    };

    const toggleHabitCompletion = (habitId, date = new Date().toISOString().split('T')[0]) => {
        setHabits(prev => prev.map(habit => {
            if (habit.id !== habitId) return habit;

            const completedDates = [...(habit.completedDates || [])];
            const dateIndex = completedDates.indexOf(date);

            if (dateIndex > -1) {
                // Unmark as complete
                completedDates.splice(dateIndex, 1);
            } else {
                // Mark as complete
                completedDates.push(date);
            }

            // Calculate streak
            const streak = calculateStreak(completedDates);

            return { ...habit, completedDates, streak };
        }));
    };

    const calculateStreak = (completedDates) => {
        if (!completedDates.length) return 0;

        const sortedDates = [...completedDates].sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Check if completed today or yesterday
        if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
            return 0;
        }

        let streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const current = new Date(sortedDates[i - 1]);
            const prev = new Date(sortedDates[i]);
            const diffDays = (current - prev) / 86400000;

            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    };

    const isCompletedToday = (habitId) => {
        const today = new Date().toISOString().split('T')[0];
        const habit = habits.find(h => h.id === habitId);
        return habit?.completedDates?.includes(today) || false;
    };

    const getTodayProgress = () => {
        const completed = habits.filter(h => isCompletedToday(h.id)).length;
        return {
            completed,
            total: habits.length,
            percentage: habits.length ? Math.round((completed / habits.length) * 100) : 0
        };
    };

    const value = {
        habits,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitCompletion,
        isCompletedToday,
        getTodayProgress,
        getPlanLimits
    };

    return (
        <HabitContext.Provider value={value}>
            {children}
        </HabitContext.Provider>
    );
}

export function useHabits() {
    const context = useContext(HabitContext);
    if (!context) {
        throw new Error('useHabits must be used within a HabitProvider');
    }
    return context;
}
