import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

const STORAGE_KEY = 'habitflow_tasks';

export function TaskProvider({ children }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);

    // Load tasks when user changes
    useEffect(() => {
        if (user) {
            const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
            if (saved) {
                try {
                    setTasks(JSON.parse(saved));
                } catch {
                    setTasks([]);
                }
            } else {
                setTasks([]);
            }
        } else {
            setTasks([]);
        }
    }, [user]);

    // Save tasks when they change
    useEffect(() => {
        if (user) {
            localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(tasks));
        }
    }, [tasks, user]);

    const getPlanLimits = () => {
        switch (user?.plan) {
            case 'premium': return { tasks: Infinity, priorities: true };
            case 'pro': return { tasks: 50, priorities: true };
            default: return { tasks: 10, priorities: false };
        }
    };

    const addTask = (task) => {
        const limits = getPlanLimits();
        const activeTasks = tasks.filter(t => !t.completed).length;

        if (activeTasks >= limits.tasks) {
            throw new Error(`You've reached the limit of ${limits.tasks} active tasks. Upgrade your plan for more!`);
        }

        const newTask = {
            id: Date.now().toString(),
            title: task.title,
            description: task.description || '',
            priority: limits.priorities ? (task.priority || 'medium') : 'medium',
            dueDate: task.dueDate || null,
            completed: false,
            createdAt: new Date().toISOString()
        };

        setTasks(prev => [...prev, newTask]);
        return newTask;
    };

    const updateTask = (id, updates) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates } : t
        ));
    };

    const deleteTask = (id) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const toggleTaskCompletion = (id) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const getTaskStats = () => {
        const active = tasks.filter(t => !t.completed);
        const completed = tasks.filter(t => t.completed);
        const overdue = active.filter(t => {
            if (!t.dueDate) return false;
            return new Date(t.dueDate) < new Date(new Date().toISOString().split('T')[0]);
        });

        return {
            total: tasks.length,
            active: active.length,
            completed: completed.length,
            overdue: overdue.length
        };
    };

    const getSortedTasks = (filter = 'all') => {
        let filtered = [...tasks];

        // Apply filter
        switch (filter) {
            case 'active':
                filtered = filtered.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = filtered.filter(t => t.completed);
                break;
        }

        // Sort: incomplete first, then by priority, then by due date
        const priorityOrder = { high: 0, medium: 1, low: 2 };

        return filtered.sort((a, b) => {
            // Completed tasks go to the end
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // Sort by priority
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }

            // Sort by due date
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;

            return 0;
        });
    };

    const value = {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        getTaskStats,
        getSortedTasks,
        getPlanLimits
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
}
