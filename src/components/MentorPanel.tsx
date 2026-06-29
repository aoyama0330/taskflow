import { useState } from 'react';
import { Bot, RefreshCw, Loader2 } from 'lucide-react';
import { generateMentorAdvice } from '../lib/claude';
import type { Task } from '../types/task';
import { CATEGORY_META } from '../types/task';

interface Props {
  tasks: Task[];
  apiKey: string;
}

export default function MentorPanel({ tasks, apiKey }: Props) {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const categoryCount = Object.fromEntries(
    Object.keys(CATEGORY_META).map(k => [k, activeTasks.filter(t => t.category === k).length])
  );

  const totalMinutes = activeTasks.reduce((s, t) => s + t.estimatedMinutes, 0);

  const handleGenerate = async () => {
    if (activeTasks.length === 0) return;
    setLoading(true);
    try {
      const result = await generateMentorAdvice(activeTasks, apiKey);
      setAdvice(result);
    } catch {
      setAdvice('アドバイスの生成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mentor-panel">
      <div className="panel-header">
        <Bot size={15} /> AIメンター
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{activeTasks.length}</div>
          <div className="stat-label">未完了</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedTasks.length}</div>
          <div className="stat-label">完了</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(totalMinutes / 60 * 10) / 10}h</div>
          <div className="stat-label">残作業時間</div>
        </div>
      </div>

      <div className="category-bars">
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const count = categoryCount[key] || 0;
          const pct = activeTasks.length ? (count / activeTasks.length) * 100 : 0;
          return (
            <div key={key} className="cat-bar-row">
              <span className="cat-bar-label">{meta.icon} {meta.label}</span>
              <div className="cat-bar-track">
                <div className="cat-bar-fill" style={{ width: `${pct}%`, background: meta.color }} />
              </div>
              <span className="cat-bar-count">{count}</span>
            </div>
          );
        })}
      </div>

      {advice && (
        <div className="advice-box">
          <p>{advice}</p>
        </div>
      )}

      <button
        className="btn-secondary"
        onClick={handleGenerate}
        disabled={loading || activeTasks.length === 0}
      >
        {loading
          ? <><Loader2 size={13} className="spin" /> 生成中...</>
          : <><RefreshCw size={13} /> AIアドバイスを生成</>
        }
      </button>
    </div>
  );
}
