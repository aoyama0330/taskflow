import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import ApiKeySetup from './components/ApiKeySetup';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import BubbleChart from './components/BubbleChart';
import MentorPanel from './components/MentorPanel';
import { loadTasks, saveTasks, loadApiKey, saveApiKey } from './lib/storage';
import type { Task } from './types/task';
import './index.css';

export default function App() {
  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => { saveTasks(tasks); }, [tasks]);

  const handleTasksAdded = (newTasks: Task[]) => {
    setTasks(prev => [...newTasks, ...prev]);
  };

  const handleToggle = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    setShowKeyInput(false);
  };

  if (!apiKey) {
    return <ApiKeySetup onSave={handleApiKeySave} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">⬡ Taskflow</span>
          <span className="tagline">タスクを立体的に把握する</span>
        </div>
        <button className="icon-btn" onClick={() => setShowKeyInput(v => !v)} title="API設定">
          <Settings size={16} />
        </button>
      </header>

      {showKeyInput && (
        <div className="key-bar">
          <input
            type="password"
            defaultValue={apiKey}
            className="text-input"
            placeholder="sk-ant-..."
            onBlur={e => { saveApiKey(e.target.value); setApiKey(e.target.value); setShowKeyInput(false); }}
          />
        </div>
      )}

      <main className="app-body">
        <div className="left-col">
          <TaskInput apiKey={apiKey} onTasksAdded={handleTasksAdded} />
          <TaskList tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
        </div>
        <div className="right-col">
          <BubbleChart tasks={tasks} />
          <MentorPanel tasks={tasks} apiKey={apiKey} />
        </div>
      </main>
    </div>
  );
}
