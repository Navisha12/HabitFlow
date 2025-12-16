import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    CheckSquare,
    Check,
    X,
    Trash2,
    Calendar,
    Flag,
    Sparkles,
    AlertTriangle
} from 'lucide-react';

export default function Tasks() {
    const { user } = useAuth();
    const {
        tasks,
        addTask,
        deleteTask,
        toggleTaskCompletion,
        getSortedTasks,
        getTaskStats,
        getPlanLimits
    } = useTasks();

    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
    });
    const [error, setError] = useState('');

    const stats = getTaskStats();
    const limits = getPlanLimits();
    const sortedTasks = getSortedTasks(filter);

    const handleAddTask = (e) => {
        e.preventDefault();
        setError('');

        if (!newTask.title.trim()) {
            setError('Please enter a task title');
            return;
        }

        try {
            addTask(newTask);
            setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
            setShowModal(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const formatDueDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date < today) return { text: 'Overdue', class: 'overdue' };
        if (date.toDateString() === today.toDateString()) return { text: 'Today', class: '' };
        if (date.toDateString() === tomorrow.toDateString()) return { text: 'Tomorrow', class: '' };
        return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), class: '' };
    };

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Tasks</h1>
                    <p className="page-subtitle">
                        Stay organized and get things done • {stats.active}/{limits.tasks === Infinity ? '∞' : limits.tasks} active
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Add Task
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <CheckSquare size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.active}</div>
                        <div className="stat-label">Active Tasks</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <Check size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>
                {stats.overdue > 0 && (
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div className="stat-value">{stats.overdue}</div>
                            <div className="stat-label">Overdue</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({tasks.length})
                </button>
                <button
                    className={`tab ${filter === 'active' ? 'active' : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Active ({stats.active})
                </button>
                <button
                    className={`tab ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Completed ({stats.completed})
                </button>
            </div>

            {/* Task List */}
            {sortedTasks.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <CheckSquare size={64} />
                        <h3>{filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}</h3>
                        <p>
                            {filter === 'all'
                                ? 'Add tasks to keep track of what needs to be done'
                                : filter === 'active'
                                    ? "You're all caught up! Great job!"
                                    : 'Complete some tasks to see them here'
                            }
                        </p>
                        {filter === 'all' && (
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                <Sparkles size={16} /> Create Your First Task
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="item-list">
                    {sortedTasks.map(task => {
                        const dueInfo = formatDueDate(task.dueDate);
                        return (
                            <div key={task.id} className="item-card slide-up">
                                <div
                                    className={`item-checkbox ${task.completed ? 'checked' : ''}`}
                                    onClick={() => toggleTaskCompletion(task.id)}
                                >
                                    {task.completed && <Check size={14} />}
                                </div>

                                <div className="item-content">
                                    <div className={`item-title ${task.completed ? 'completed' : ''}`}>
                                        {task.title}
                                    </div>
                                    <div className="item-meta">
                                        {limits.priorities && (
                                            <span className={`priority-badge priority-${task.priority}`}>
                                                <Flag size={10} /> {task.priority}
                                            </span>
                                        )}
                                        {dueInfo && (
                                            <span className={`due-date ${dueInfo.class}`}>
                                                <Calendar size={12} /> {dueInfo.text}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="item-actions">
                                    <button
                                        className="btn btn-icon btn-ghost"
                                        onClick={() => deleteTask(task.id)}
                                        title="Delete task"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Task Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Task</h2>
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

                        <form onSubmit={handleAddTask}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="taskTitle">Task Title</label>
                                <input
                                    type="text"
                                    id="taskTitle"
                                    className="form-input"
                                    placeholder="What needs to be done?"
                                    value={newTask.title}
                                    onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="taskDesc">Description (optional)</label>
                                <input
                                    type="text"
                                    id="taskDesc"
                                    className="form-input"
                                    placeholder="Add more details..."
                                    value={newTask.description}
                                    onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="taskPriority">Priority</label>
                                    <select
                                        id="taskPriority"
                                        className="form-select"
                                        value={newTask.priority}
                                        onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                                        disabled={!limits.priorities}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                    {!limits.priorities && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            Upgrade to Pro for priority tags
                                        </p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="taskDueDate">Due Date</label>
                                    <input
                                        type="date"
                                        id="taskDueDate"
                                        className="form-input"
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={16} /> Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
