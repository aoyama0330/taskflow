import { useState } from 'react';
import type { Task } from '../types/task';
import { CATEGORY_META } from '../types/task';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const MILESTONES = [
  { n: 10, msg: '伝説の一日！', emoji: '🎉' },
  { n: 5,  msg: '最高の調子！', emoji: '🌟' },
  { n: 3,  msg: '順調です！',   emoji: '⚡' },
  { n: 1,  msg: 'いいスタート！', emoji: '👏' },
];
const BURST_EMOJIS = ['⭐', '✨', '🎊', '💫', '🌟', '🎯', '🎈'];

interface Props {
  tasks: Task[];
  onComplete: (t: Task) => void;
}

export default function DoneZone({ tasks, onComplete }: Props) {
  const today = todayStr();
  const [isDragOver, setIsDragOver] = useState(false);
  type Effect = { id: number; kind: 'p' | 'plus'; emoji?: string; x: number };
  const [effects, setEffects] = useState<Effect[]>([]);

  const completedToday = tasks.filter(t =>
    t.completed && t.completedAt && t.completedAt.startsWith(today)
  );
  const count = completedToday.length;
  const milestone = MILESTONES.find(m => count >= m.n);

  const burst = () => {
    const base = Date.now();
    const particles: Effect[] = Array.from({ length: 7 }, (_, i) => ({
      id: base + i, kind: 'p',
      emoji: BURST_EMOJIS[i % BURST_EMOJIS.length],
      x: (i - 3) * 24,
    }));
    const plus: Effect = { id: base + 100, kind: 'plus', x: 0 };
    setEffects(e => [...e, ...particles, plus]);
    setTimeout(() => setEffects(e => e.filter(x => x.id < base || x.id > base + 100)), 950);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId && !t.completed);
    if (task) { onComplete(task); burst(); }
    setIsDragOver(false);
  };

  return (
    <div
      className={`done-zone${isDragOver ? ' dz-active' : ''}`}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {isDragOver ? (
        <div className="dz-drop-hint">✓ ここへドロップして完了！</div>
      ) : (
        <div className="dz-content">
          <div className="dz-stat">
            <span className="dz-count">{count}</span>
            <span className="dz-sub">今日の達成</span>
          </div>
          {milestone
            ? <span className="dz-milestone">{milestone.emoji} {milestone.msg}</span>
            : <span className="dz-empty-hint">タスクをドロップして完了 →</span>
          }
          <div className="dz-dots">
            {completedToday.slice(0, 28).map(t => (
              <span
                key={t.id} className="dz-dot"
                style={{ background: CATEGORY_META[t.category].color }}
                title={t.title}
              />
            ))}
            {count > 28 && <span className="dz-dot-more">+{count - 28}</span>}
          </div>
        </div>
      )}
      <div className="dz-effects" aria-hidden>
        {effects.map(ef => ef.kind === 'p'
          ? <span key={ef.id} className="dz-particle" style={{ '--px': `${ef.x}px` } as React.CSSProperties}>{ef.emoji}</span>
          : <span key={ef.id} className="dz-plus">+1 達成！</span>
        )}
      </div>
    </div>
  );
}
