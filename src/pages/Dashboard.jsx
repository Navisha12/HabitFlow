import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import {
    Target,
    CheckSquare,
    Flame,
    Trophy,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const { habits, getTodayProgress } = useHabits();
    const { getTaskStats } = useTasks();

    const habitProgress = getTodayProgress();
    const taskStats = getTaskStats();
    const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">
                    Welcome back, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="page-subtitle">
                    Here's your productivity overview for today
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card slide-up">
                    <div className="stat-icon purple">
                        <Target size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{habits.length}</div>
                        <div className="stat-label">Active Habits</div>
                    </div>
                </div>

                <div className="stat-card slide-up" style={{ animationDelay: '50ms' }}>
                    <div className="stat-icon green">
                        <CheckSquare size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{taskStats.active}</div>
                        <div className="stat-label">Pending Tasks</div>
                    </div>
                </div>

                <div className="stat-card slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="stat-icon orange">
                        <Flame size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{totalStreak}</div>
                        <div className="stat-label">Total Streak Days</div>
                    </div>
                </div>

                <div className="stat-card slide-up" style={{ animationDelay: '150ms' }}>
                    <div className="stat-icon blue">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{taskStats.completed}</div>
                        <div className="stat-label">Tasks Completed</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {/* Today's Habits */}
                <div className="card slide-up" style={{ animationDelay: '200ms' }}>
                    <div className="card-header">
                        <h3 className="card-title">Today's Habits</h3>
                        <Link to="/habits" className="btn btn-ghost" style={{ fontSize: '14px' }}>
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                            <span style={{ fontWeight: '600' }}>{habitProgress.completed}/{habitProgress.total}</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${habitProgress.percentage}%` }}
                            />
                        </div>
                    </div>

                    {habits.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 0' }}>
                            <Target size={40} style={{ opacity: 0.5 }} />
                            <h3 style={{ marginTop: '12px' }}>No habits yet</h3>
                            <p>Start building better routines</p>
                            <Link to="/habits" className="btn btn-primary" style={{ marginTop: '16px' }}>
                                <Sparkles size={16} /> Add Your First Habit
                            </Link>
                        </div>
                    ) : (
                        <div className="item-list">
                            {habits.slice(0, 3).map(habit => (
                                <div key={habit.id} className="item-card" style={{ padding: '12px 16px' }}>
                                    <div
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: habit.color,
                                            flexShrink: 0
                                        }}
                                    />
                                    <div className="item-content">
                                        <div className="item-title">{habit.title}</div>
                                    </div>
                                    {habit.streak > 0 && (
                                        <span className="streak-badge">
                                            <Flame size={12} /> {habit.streak}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Tasks */}
                <div className="card slide-up" style={{ animationDelay: '250ms' }}>
                    <div className="card-header">
                        <h3 className="card-title">Pending Tasks</h3>
                        <Link to="/tasks" className="btn btn-ghost" style={{ fontSize: '14px' }}>
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>

                    {taskStats.overdue > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 14px',
                            background: 'var(--error-bg)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--error)',
                            fontSize: '14px',
                            marginBottom: '16px'
                        }}>
                            <CheckSquare size={16} />
                            {taskStats.overdue} overdue task{taskStats.overdue > 1 ? 's' : ''}
                        </div>
                    )}

                    {taskStats.active === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 0' }}>
                            <CheckSquare size={40} style={{ opacity: 0.5 }} />
                            <h3 style={{ marginTop: '12px' }}>All caught up!</h3>
                            <p>No pending tasks at the moment</p>
                            <Link to="/tasks" className="btn btn-primary" style={{ marginTop: '16px' }}>
                                <Sparkles size={16} /> Add a Task
                            </Link>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            color: 'var(--text-secondary)',
                            fontSize: '14px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Active tasks</span>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{taskStats.active}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Completed</span>
                                <span style={{ fontWeight: '600', color: 'var(--success)' }}>{taskStats.completed}</span>
                            </div>
                            <Link
                                to="/tasks"
                                className="btn btn-secondary"
                                style={{ marginTop: '8px', justifyContent: 'center' }}
                            >
                                Manage Tasks
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
