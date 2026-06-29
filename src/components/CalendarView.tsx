import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, List, Clock, AlertCircle, Wand2 } from 'lucide-react';
import type { Task } from '../types/task';
import { CATEGORY_META } from '../types/task';
import { autoSchedule } from '../lib/scheduler';

interface Props {
  tasks: Task[];
  onUpdate: (task: Task) => void;
  onBulkUpdate?: (tasks: Task[]) => void;
}

// ── Date helpers ──────────────────────────────────────────────
const toDateStr = (d: Date) => d.toISOString().split('T')[0];
const today = () => toDateStr(new Date());

const getMonday = (offset: number): Date => {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1 + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

const taskDisplayDate = (t: Task) => t.scheduledDate || t.deadline;

// ── Sub-components ────────────────────────────────────────────
function TaskChip({ task, onUpdate, showDate = false }: { task: Task; onUpdate: (t: Task) => void; showDate?: boolean }) {
  const meta = CATEGORY_META[task.category];
  const [editing, setEditing] = useState(false);

  const handleDateChange = (val: string) => {
    onUpdate({ ...task, scheduledDate: val || null });
    setEditing(false);
  };

  return (
    <div className="cal-task-chip" style={{ borderLeftColor: meta.color }}>
      <div className="cal-chip-top">
        <span className="cal-chip-icon">{meta.icon}</span>
        <span className="cal-chip-title">{task.title}</span>
      </div>
      <div className="cal-chip-meta">
        <span><Clock size={10} /> {task.estimatedMinutes}分</span>
        {showDate && taskDisplayDate(task) && (
          <span className="cal-chip-date">{taskDisplayDate(task)}</span>
        )}
        {editing ? (
          <input
            type="date"
            className="cal-date-input"
            defaultValue={task.scheduledDate || ''}
            autoFocus
            onChange={e => handleDateChange(e.target.value)}
            onBlur={() => setEditing(false)}
          />
        ) : (
          <button className="cal-schedule-btn" onClick={() => setEditing(true)} title="日付を変更">
            📅
          </button>
        )}
      </div>
    </div>
  );
}

// ── Today view ────────────────────────────────────────────────
function TodayView({ tasks, onUpdate }: Props) {
  const todayStr = today();

  const overdue = tasks.filter(t =>
    !t.completed && taskDisplayDate(t) && taskDisplayDate(t)! < todayStr
  ).sort((a, b) => (taskDisplayDate(a) || '').localeCompare(taskDisplayDate(b) || ''));

  const todayTasks = tasks.filter(t =>
    !t.completed && taskDisplayDate(t) === todayStr
  ).sort((a, b) => b.urgency - a.urgency);

  const unscheduled = tasks.filter(t =>
    !t.completed && !taskDisplayDate(t) && t.urgency >= 7
  ).sort((a, b) => (b.urgency + b.importance) - (a.urgency + a.importance));

  const completed = tasks.filter(t =>
    t.completed && t.completedAt && t.completedAt.startsWith(todayStr)
  );

  return (
    <div className="today-view">
      {overdue.length > 0 && (
        <section className="cal-section">
          <div className="cal-section-header overdue">
            <AlertCircle size={14} /> 期限超過 ({overdue.length})
          </div>
          {overdue.map(t => <TaskChip key={t.id} task={t} onUpdate={onUpdate} showDate />)}
        </section>
      )}

      <section className="cal-section">
        <div className="cal-section-header today-header">
          今日の予定
          {todayTasks.length === 0 && <span className="cal-empty-hint">スケジュールされたタスクなし</span>}
        </div>
        {todayTasks.map(t => <TaskChip key={t.id} task={t} onUpdate={onUpdate} />)}
      </section>

      {unscheduled.length > 0 && (
        <section className="cal-section">
          <div className="cal-section-header urgent-hint">
            ⚡ 今日やるべき未スケジュール（緊急度 7+）
          </div>
          {unscheduled.slice(0, 5).map(t => <TaskChip key={t.id} task={t} onUpdate={onUpdate} />)}
        </section>
      )}

      {completed.length > 0 && (
        <section className="cal-section">
          <div className="cal-section-header done-header">✓ 今日の完了 ({completed.length})</div>
          {completed.map(t => (
            <div key={t.id} className="cal-task-chip done">
              <span className="cal-chip-title" style={{ textDecoration: 'line-through', color: 'var(--text-faint)' }}>
                {t.title}
              </span>
              {t.actualMinutes && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{t.actualMinutes}分</span>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────
function WeekView({ tasks, onUpdate, onBulkUpdate }: Props) {
  const [offset, setOffset] = useState(0);
  const [scheduling, setScheduling] = useState(false);

  const handleAutoSchedule = async () => {
    if (!onBulkUpdate) return;
    setScheduling(true);
    const { scheduled } = autoSchedule(tasks);
    const updated = scheduled.map(({ task, date }) => ({ ...task, scheduledDate: date }));
    await onBulkUpdate(updated);
    setScheduling(false);
  };
  const monday = getMonday(offset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const todayStr = today();

  const rangeLabel = `${monday.getMonth() + 1}/${monday.getDate()} 〜 ${addDays(monday, 6).getMonth() + 1}/${addDays(monday, 6).getDate()}`;

  return (
    <div className="week-view">
      <div className="week-nav">
        <button className="week-nav-btn" onClick={() => setOffset(o => o - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="week-range">{rangeLabel}</span>
        <button className="week-nav-btn" onClick={() => setOffset(o => o + 1)}>
          <ChevronRight size={16} />
        </button>
        {offset !== 0 && (
          <button className="week-today-btn" onClick={() => setOffset(0)}>今週</button>
        )}
      </div>

      <div className="week-grid">
        {days.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const dayTasks = tasks.filter(t => !t.completed && taskDisplayDate(t) === dateStr);
          const totalMin = dayTasks.reduce((s, t) => s + t.estimatedMinutes, 0);

          return (
            <div key={dateStr} className={`week-col ${isToday ? 'today-col' : ''} ${isPast ? 'past-col' : ''}`}>
              <div className="week-col-header">
                <span className="week-day-label">{DAY_LABELS[i]}</span>
                <span className={`week-date-num ${isToday ? 'today-num' : ''}`}>{day.getDate()}</span>
                {totalMin > 0 && (
                  <span className="week-total-min">{Math.round(totalMin / 60 * 10) / 10}h</span>
                )}
              </div>
              <div className="week-col-tasks">
                {dayTasks.sort((a, b) => b.urgency - a.urgency).map(t => (
                  <TaskChip key={t.id} task={t} onUpdate={onUpdate} />
                ))}
                {dayTasks.length === 0 && (
                  <div className="week-col-empty">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="unscheduled-bar">
        <div className="cal-section-header" style={{ marginBottom: 8 }}>
          未スケジュール ({tasks.filter(t => !t.completed && !taskDisplayDate(t)).length}件)
          <span className="panel-hint">📅 ボタンで日付を設定</span>
          {onBulkUpdate && tasks.filter(t => !t.completed && !taskDisplayDate(t) && t.category !== 'delegatable').length > 0 && (
            <button
              className="schedule-all-btn"
              onClick={handleAutoSchedule}
              disabled={scheduling}
            >
              <Wand2 size={12} />
              {scheduling ? 'スケジューリング中…' : '一括スケジューリング'}
            </button>
          )}
        </div>
        <div className="unscheduled-chips">
          {tasks
            .filter(t => !t.completed && !taskDisplayDate(t))
            .sort((a, b) => (b.urgency + b.importance) - (a.urgency + a.importance))
            .map(t => <TaskChip key={t.id} task={t} onUpdate={onUpdate} />)
          }
          {tasks.filter(t => !t.completed && !taskDisplayDate(t)).length === 0 && (
            <span className="cal-empty-hint">すべてのタスクがスケジュール済みです</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CalendarView ─────────────────────────────────────────
export default function CalendarView({ tasks, onUpdate, onBulkUpdate }: Props) {
  const [view, setView] = useState<'today' | 'week'>('today');

  const todayOverdueCount = tasks.filter(t => {
    const d = taskDisplayDate(t);
    return !t.completed && d && d <= today();
  }).length;

  return (
    <div className="calendar-panel">
      <div className="cal-tabs">
        <button className={`cal-tab ${view === 'today' ? 'active' : ''}`} onClick={() => setView('today')}>
          <List size={14} /> 今日
          {todayOverdueCount > 0 && <span className="cal-badge">{todayOverdueCount}</span>}
        </button>
        <button className={`cal-tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>
          <CalendarDays size={14} /> 今週
        </button>
      </div>

      {view === 'today'
        ? <TodayView tasks={tasks} onUpdate={onUpdate} />
        : <WeekView tasks={tasks} onUpdate={onUpdate} onBulkUpdate={onBulkUpdate} />
      }
    </div>
  );
}
