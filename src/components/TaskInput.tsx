import { useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { extractTasks } from '../lib/claude';
import type { Task } from '../types/task';

interface Props {
  apiKey: string;
  onTasksAdded: (tasks: Task[]) => void;
}

export default function TaskInput({ apiKey, onTasksAdded }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  // Manual single task fields
  const [title, setTitle] = useState('');

  const handleAiExtract = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const tasks = await extractTasks(text, apiKey);
      onTasksAdded(tasks);
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = () => {
    if (!title.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: '',
      category: 'execution',
      energyLevel: 'high',
      estimatedMinutes: 30,
      urgency: 5,
      importance: 5,
      deadline: null,
      scheduledDate: null,
      delegateTo: null,
      actualMinutes: null,
      completedAt: null,
      completed: false,
      createdAt: new Date().toISOString(),
      tags: [],
    };
    onTasksAdded([task]);
    setTitle('');
  };

  return (
    <div className="input-panel">
      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'ai' ? 'active' : ''}`}
          onClick={() => setMode('ai')}
        >
          <Sparkles size={14} /> AIで抽出
        </button>
        <button
          className={`mode-tab ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
        >
          <Plus size={14} /> 手動で追加
        </button>
      </div>

      {mode === 'ai' ? (
        <div className="ai-input">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="メール・チャットのテキストをここに貼り付けてください。AIがタスクを自動抽出します。"
            rows={6}
            className="text-area"
          />
          {error && <p className="error-text">{error}</p>}
          <button
            className="btn-primary"
            onClick={handleAiExtract}
            disabled={loading || !text.trim()}
          >
            {loading ? <><Loader2 size={14} className="spin" /> 抽出中...</> : <><Sparkles size={14} /> タスクを抽出</>}
          </button>
        </div>
      ) : (
        <div className="manual-input">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="タスク名を入力..."
            className="text-input"
            onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
          />
          <button className="btn-primary" onClick={handleManualAdd} disabled={!title.trim()}>
            <Plus size={14} /> 追加
          </button>
        </div>
      )}
    </div>
  );
}
