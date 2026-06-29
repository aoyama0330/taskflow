import { useState, useEffect } from 'react';
import { Settings, LogOut, Loader2, LayoutDashboard, CalendarDays, List } from 'lucide-react';
import Auth from './components/Auth';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import BubbleChart from './components/BubbleChart';
import MentorPanel from './components/MentorPanel';
import CalendarView from './components/CalendarView';
import DoneZone from './components/DoneZone';
import { loadApiKey, saveApiKey } from './lib/storage';
import { fetchTasks, insertTask, updateTask, deleteTask } from './lib/db';
import { supabase } from './lib/supabase';
import type { Task } from './types/task';
import './index.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthUser = any;

type AppView = 'week' | 'today' | 'analysis';

export default function App() {
  const [user, setUser] = useState<AuthUser>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [view, setView] = useState<AppView>('week');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setTasks([]); return; }
    setTasksLoading(true);
    fetchTasks()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setTasksLoading(false));
  }, [user]);

  const handleTasksAdded = async (newTasks: Task[]) => {
    for (const task of newTasks) await insertTask(task);
    setTasks(prev => [...newTasks, ...prev]);
  };

  const handleToggle = async (id: string, actualMinutes?: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated: Task = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
      actualMinutes: !task.completed ? (actualMinutes ?? task.actualMinutes) : null,
    };
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    await updateTask(updated);
  };

  const handleUpdate = async (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    await updateTask(updated);
  };

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTask(id);
  };

  const handleBulkUpdate = async (updated: Task[]) => {
    setTasks(prev => prev.map(t => {
      const u = updated.find(u => u.id === t.id);
      return u ?? t;
    }));
    await Promise.all(updated.map(updateTask));
  };

  const handleSignOut = () => supabase.auth.signOut();

  if (authLoading) {
    return (
      <div className="setup-screen">
        <Loader2 size={28} className="spin" style={{ color: 'var(--text-dim)' }} />
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">⬡ Taskflow</span>
          <span className="tagline">タスクを立体的に把握する</span>
        </div>

        <nav className="app-nav">
          <button className={`nav-tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>
            <CalendarDays size={14} /> カレンダー（週）
          </button>
          <button className={`nav-tab ${view === 'today' ? 'active' : ''}`} onClick={() => setView('today')} style={{ position: 'relative' }}>
            <List size={14} /> カレンダー（日）
            {(() => {
              const d = new Date().toISOString().split('T')[0];
              const n = tasks.filter(t => !t.completed && (t.scheduledDate || t.deadline) && (t.scheduledDate || t.deadline)! <= d).length;
              return n > 0 ? <span className="cal-badge">{n}</span> : null;
            })()}
          </button>
          <button className={`nav-tab ${view === 'analysis' ? 'active' : ''}`} onClick={() => setView('analysis')}>
            <LayoutDashboard size={14} /> タスク分析
          </button>
        </nav>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={() => setShowKeyInput(v => !v)} title="Claude API設定">
            <Settings size={15} />
          </button>
          <button className="icon-btn" onClick={handleSignOut} title="ログアウト">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {showKeyInput && (
        <div className="key-bar">
          <span style={{ fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>Claude API Key:</span>
          <input
            type="password" defaultValue={apiKey} className="text-input"
            placeholder="sk-ant-..."
            onBlur={e => { saveApiKey(e.target.value); setApiKey(e.target.value); setShowKeyInput(false); }}
          />
        </div>
      )}

      {view === 'analysis' ? (
        <main className="app-body">
          <div className="left-col">
            <TaskInput apiKey={apiKey} onTasksAdded={handleTasksAdded} />
            {tasksLoading
              ? <div className="empty-state"><Loader2 size={20} className="spin" /></div>
              : <TaskList tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
            }
          </div>
          <div className="right-col">
            <BubbleChart tasks={tasks} />
            <MentorPanel tasks={tasks} apiKey={apiKey} />
          </div>
        </main>
      ) : (
        <main className="calendar-body">
          <div className="calendar-main-col">
            <CalendarView tasks={tasks} onUpdate={handleUpdate} onBulkUpdate={handleBulkUpdate} view={view} />
          </div>
          <div className="calendar-side-col">
            <TaskInput apiKey={apiKey} onTasksAdded={handleTasksAdded} />
            <DoneZone tasks={tasks} onComplete={task => handleUpdate({ ...task, completed: true, completedAt: new Date().toISOString() })} />
            <MentorPanel tasks={tasks} apiKey={apiKey} />
          </div>
        </main>
      )}
    </div>
  );
}
