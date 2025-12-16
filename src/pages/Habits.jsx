import { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import {
    Plus,
    Target,
    Flame,
    Check,
    X,
    Trash2,
    Sparkles
} from 'lucide-react';

const COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
    '#ef4444', '#f59e0b', '#10b981', '#06b6d4'
];

export default function Habits() {
    const {
        habits,
        addHabit,
        deleteHabit,
        toggleHabitCompletion,
        isCompletedToday,
        getTodayProgress,
        getPlanLimits
    } = useHabits();

    const [showModal, setShowModal] = useState(false);
    const [newHabit, setNewHabit] = useState({ title: '', description: '', color: COLORS[0] });
    const [error, setError] = useState('');

    const progress = getTodayProgress();
    const limits = getPlanLimits();

    const handleAddHabit = (e) => {
        e.preventDefault();
        setError('');

        if (!newHabit.title.trim()) {
            setError('Please enter a habit name');
            return;
        }

        try {
            addHabit(newHabit);
            setNewHabit({ title: '', description: '', color: COLORS[0] });
            setShowModal(false);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Habits</h1>
                    <p className="page-subtitle">
                        Build consistency with daily habits • {habits.length}/{limits.habits === Infinity ? '∞' : limits.habits} habits
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Add Habit
                </button>
            </div>

            {/* Progress Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600' }}>Today's Progress</span>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>{progress.percentage}%</span>
                </div>
                <div className="progress-bar" style={{ height: '10px' }}>
                    <div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
                </div>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {progress.completed} of {progress.total} habits completed today
                </p>
            </div>

            {/* Habits List */}
            {habits.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Target size={64} />
                        <h3>No habits yet</h3>
                        <p>Start building better routines by adding your first habit</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Sparkles size={16} /> Create Your First Habit
                        </button>
                    </div>
                </div>
            ) : (
                <div className="item-list">
                    {habits.map(habit => {
                        const completed = isCompletedToday(habit.id);
                        return (
                            <div key={habit.id} className="item-card slide-up">
                                <div
                                    className={`item-checkbox ${completed ? 'checked' : ''}`}
                                    onClick={() => toggleHabitCompletion(habit.id)}
                                    style={{ borderColor: completed ? 'transparent' : habit.color }}
                                >
                                    {completed && <Check size={14} />}
                                </div>

                                <div
                                    style={{
                                        width: '4px',
                                        height: '40px',
                                        background: habit.color,
                                        borderRadius: '2px',
                                        flexShrink: 0
                                    }}
                                />

                                <div className="item-content">
                                    <div className={`item-title ${completed ? 'completed' : ''}`}>
                                        {habit.title}
                                    </div>
                                    {habit.description && (
                                        <div className="item-meta">{habit.description}</div>
                                    )}
                                </div>

                                {habit.streak > 0 && (
                                    <span className="streak-badge">
                                        <Flame size={12} /> {habit.streak} day{habit.streak > 1 ? 's' : ''}
                                    </span>
                                )}

                                <div className="item-actions">
                                    <button
                                        className="btn btn-icon btn-ghost"
                                        onClick={() => deleteHabit(habit.id)}
                                        title="Delete habit"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Habit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Habit</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                padding: '12px',
                                background: 'var(--error-bg)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--error)',
                                marginBottom: '20px',
                                fontSize: '14px'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddHabit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="habitTitle">Habit Name</label>
                                <input
                                    type="text"
                                    id="habitTitle"
                                    className="form-input"
                                    placeholder="e.g., Drink 8 glasses of water"
                                    value={newHabit.title}
                                    onChange={e => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="habitDesc">Description (optional)</label>
                                <input
                                    type="text"
                                    id="habitDesc"
                                    className="form-input"
                                    placeholder="Add more details..."
                                    value={newHabit.description}
                                    onChange={e => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Color</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewHabit(prev => ({ ...prev, color }))}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: color,
                                                border: newHabit.color === color ? '3px solid white' : '3px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'transform 0.15s'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={16} /> Add Habit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
