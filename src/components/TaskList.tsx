import { useState } from 'react';
import { Check, Trash2, Clock, ChevronDown, ChevronUp, Timer } from 'lucide-react';
import type { Task, TaskCategory } from '../types/task';
import { CATEGORY_META } from '../types/task';

interface Props {
  tasks: Task[];
  onToggle: (id: string, actualMinutes?: number) => void;
  onDelete: (id: string) => void;
}

const FILTERS: { key: 'all' | TaskCategory; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'urgent', label: '🔥 期限優先' },
  { key: 'deep', label: '🧠 集中思考' },
  { key: 'quick', label: '⚡ クイック' },
  { key: 'execution', label: '🔧 作業実行' },
  { key: 'delegatable', label: '🤝 委譲候補' },
];

export default function TaskList({ tasks, onToggle, onDelete }: Props) {
  const [filter, setFilter] = useState<'all' | TaskCategory>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const filtered = tasks
    .filter(t => filter === 'all' || t.category === filter)
    .filter(t => showCompleted || !t.completed);

  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (b.urgency + b.importance) - (a.urgency + a.importance);
  });

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="task-list-panel">
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">タスクがありません</div>
      ) : (
        <div className="task-items">
          {sorted.map(task => (
            <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      )}

      {completedCount > 0 && (
        <button className="show-completed-btn" onClick={() => setShowCompleted(v => !v)}>
          {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          完了済み {completedCount} 件
        </button>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }: {
  task: Task;
  onToggle: (id: string, actualMinutes?: number) => void;
  onDelete: (id: string) => void;
}) {
  const meta = CATEGORY_META[task.category];
  const [showActual, setShowActual] = useState(false);
  const [actualInput, setActualInput] = useState(String(task.estimatedMinutes));

  const handleCheck = () => {
    if (!task.completed) {
      setShowActual(true);
    } else {
      onToggle(task.id);
    }
  };

  const handleActualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(actualInput, 10);
    onToggle(task.id, isNaN(mins) ? undefined : mins);
    setShowActual(false);
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`} style={{ borderLeftColor: meta.color }}>
      <button className={`check-btn ${task.completed ? 'checked' : ''}`} onClick={handleCheck}>
        {task.completed && <Check size={12} />}
      </button>

      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {task.description && <div className="task-desc">{task.description}</div>}

        {/* 実績時間入力フォーム */}
        {showActual && (
          <form onSubmit={handleActualSubmit} className="actual-form">
            <Timer size={12} style={{ color: '#ff9800' }} />
            <span className="actual-label">実際にかかった時間：</span>
            <input
              type="number" min="1" value={actualInput}
              onChange={e => setActualInput(e.target.value)}
              className="actual-input"
              autoFocus
            />
            <span className="actual-label">分</span>
            <button type="submit" className="actual-btn">完了</button>
            <button type="button" className="actual-btn-skip" onClick={() => { onToggle(task.id); setShowActual(false); }}>
              スキップ
            </button>
          </form>
        )}

        <div className="task-meta-row">
          <span className="category-badge" style={{ color: meta.color, borderColor: meta.color }}>
            {meta.icon} {meta.label}
          </span>
          <span className="time-badge">
            <Clock size={11} /> 見積 {task.estimatedMinutes}分
          </span>
          {task.completed && task.actualMinutes && (
            <span className="time-badge" style={{ color: '#ff9800' }}>
              <Timer size={11} /> 実績 {task.actualMinutes}分
            </span>
          )}
          <span className="score-badge">緊急{task.urgency} 重要{task.importance}</span>
          {task.deadline && (
            <span className="deadline-badge">
              📅 {new Date(task.deadline).toLocaleDateString('ja-JP')}
            </span>
          )}
          {task.delegateTo && (
            <span className="delegate-badge">→ {task.delegateTo}</span>
          )}
          {task.completed && task.completedAt && (
            <span className="completed-at-badge">
              ✓ {new Date(task.completedAt).toLocaleDateString('ja-JP')}
            </span>
          )}
        </div>
      </div>

      <button className="delete-btn" onClick={() => onDelete(task.id)}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}
