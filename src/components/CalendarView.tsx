import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays, List, Clock, AlertCircle, Wand2, GripVertical, X } from 'lucide-react';
import type { Task, TimeSlot } from '../types/task';
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

const DAY_LABELS = ['月', '火', '水', '木', '金'];
const taskDisplayDate = (t: Task) => t.scheduledDate || t.deadline;

const sortByOrder = (arr: Task[], orderedIds: string[]): Task[] =>
  [...arr].sort((a, b) => {
    const ai = orderedIds.indexOf(a.id);
    const bi = orderedIds.indexOf(b.id);
    if (ai === -1 && bi === -1) return b.urgency - a.urgency;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

// ── Chip Edit Popup ───────────────────────────────────────────
function ChipEditPopup({ task, anchor, onUpdate, onClose }: {
  task: Task;
  anchor: DOMRect;
  onUpdate: (t: Task) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const meta = CATEGORY_META[task.category];
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [memo, setMemo] = useState(task.description || '');

  const W = 300;
  let left = anchor.right + 10;
  if (left + W > window.innerWidth - 8) left = anchor.left - W - 10;
  left = Math.max(8, left);
  const top = Math.min(anchor.top, window.innerHeight - 300);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSave = () => {
    onUpdate({ ...task, deadline: deadline || null, description: memo });
    onClose();
  };

  return createPortal(
    <div
      ref={ref}
      className="chip-edit-popup"
      style={{ position: 'fixed', top, left, width: W }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="cep-header">
        <span className="cep-category-badge" style={{ background: meta.color }}>
          {meta.icon} {meta.label}
        </span>
        <button className="cep-close-btn" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="cep-title">{task.title}</div>
      <div className="cep-meta-row">
        <span><Clock size={11} /> {task.estimatedMinutes}分</span>
        <span>🔥 緊急 {task.urgency}/10</span>
        <span>⭐ 重要 {task.importance}/10</span>
      </div>
      <div className="cep-field">
        <label className="cep-label">📅 期日</label>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="cep-date-input"
        />
      </div>
      <div className="cep-field">
        <label className="cep-label">📝 メモ</label>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          className="cep-memo"
          rows={3}
          placeholder="メモを入力..."
        />
      </div>
      <div className="cep-actions">
        <button className="cep-cancel-btn" onClick={onClose}>キャンセル</button>
        <button className="cep-save-btn" onClick={handleSave}>保存</button>
      </div>
    </div>,
    document.body
  );
}

// ── Mini Calendar (portal, position: fixed) ───────────────────
function MiniCalendar({ anchor, value, onChange, onClose }: {
  anchor: { top: number; right: number };
  value: string | null;
  onChange: (date: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(todayDate);

  const [viewMonth, setViewMonth] = useState(() => {
    const base = value ? new Date(value + 'T00:00:00') : todayDate;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const year = viewMonth.getFullYear();
  const mon = viewMonth.getMonth();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const firstDow = (new Date(year, mon, 1).getDay() + 6) % 7;

  const ds = (d: number) =>
    `${year}-${String(mon + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return createPortal(
    <div
      ref={ref}
      className="mini-cal-popup"
      style={{ position: 'fixed', top: anchor.top, right: anchor.right, zIndex: 1100 }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="mini-cal-quick">
        <button className="mini-cal-quick-btn" onMouseDown={e => { e.stopPropagation(); onChange(todayStr); }}>今日</button>
        <button className="mini-cal-quick-btn" onMouseDown={e => { e.stopPropagation(); onChange(toDateStr(addDays(todayDate, 1))); }}>明日</button>
        <button className="mini-cal-quick-btn" onMouseDown={e => { e.stopPropagation(); onChange(toDateStr(addDays(todayDate, 2))); }}>明後日</button>
      </div>
      <div className="mini-cal-nav">
        <button className="mini-cal-nav-btn" onMouseDown={e => { e.stopPropagation(); setViewMonth(new Date(year, mon - 1, 1)); }}>
          <ChevronLeft size={13} />
        </button>
        <span className="mini-cal-month">{year}年{mon + 1}月</span>
        <button className="mini-cal-nav-btn" onMouseDown={e => { e.stopPropagation(); setViewMonth(new Date(year, mon + 1, 1)); }}>
          <ChevronRight size={13} />
        </button>
      </div>
      <div className="mini-cal-grid">
        {['月', '火', '水', '木', '金', '土', '日'].map(d => (
          <div key={d} className="mini-cal-dow">{d}</div>
        ))}
        {cells.map((day, i) => day === null
          ? <div key={`e${i}`} />
          : <button
              key={ds(day)}
              className={`mini-cal-day${ds(day) === todayStr ? ' is-today' : ''}${ds(day) === value ? ' is-selected' : ''}`}
              onMouseDown={e => { e.stopPropagation(); onChange(ds(day)); }}
            >{day}</button>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Task Chip ─────────────────────────────────────────────────
interface ChipProps {
  task: Task;
  onUpdate: (t: Task) => void;
  showDate?: boolean;
  isDraggable?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}

function TaskChip({ task, onUpdate, showDate = false, isDraggable = false, isDragOver = false,
  onDragStart, onDragOver, onDragEnd, onDrop }: ChipProps) {
  const meta = CATEGORY_META[task.category];
  const [calAnchor, setCalAnchor] = useState<{ top: number; right: number } | null>(null);
  const [editAnchor, setEditAnchor] = useState<DOMRect | null>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggleCal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (calAnchor) { setCalAnchor(null); return; }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCalAnchor({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
  };

  const handleChipClick = () => {
    if (calAnchor) return;
    if (chipRef.current) setEditAnchor(chipRef.current.getBoundingClientRect());
  };

  return (
    <>
      <div
        ref={chipRef}
        className={`cal-task-chip${isDragOver ? ' drag-over' : ''}`}
        style={{ background: meta.color }}
        draggable={isDraggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
        onClick={handleChipClick}
      >
        <div className="cal-chip-top">
          {isDraggable && <GripVertical size={11} className="drag-handle" />}
          <span className="cal-chip-icon">{meta.icon}</span>
          <span className="cal-chip-title">{task.title}</span>
        </div>
        <div className="cal-chip-meta">
          <span><Clock size={10} /> {task.estimatedMinutes}分</span>
          {showDate && taskDisplayDate(task) && (
            <span className="cal-chip-date">{taskDisplayDate(task)}</span>
          )}
          <button ref={btnRef} className="cal-schedule-btn" onClick={toggleCal} title="日付を変更">📅</button>
          {calAnchor && (
            <MiniCalendar
              anchor={calAnchor}
              value={task.scheduledDate}
              onChange={val => { onUpdate({ ...task, scheduledDate: val }); setCalAnchor(null); }}
              onClose={() => setCalAnchor(null)}
            />
          )}
        </div>
      </div>
      {editAnchor && (
        <ChipEditPopup
          task={task}
          anchor={editAnchor}
          onUpdate={onUpdate}
          onClose={() => setEditAnchor(null)}
        />
      )}
    </>
  );
}

// ── Today View ────────────────────────────────────────────────
function TodayView({ tasks, onUpdate, orderedIds, setOrderedIds }: Props & {
  orderedIds: string[];
  setOrderedIds: (ids: string[]) => void;
}) {
  const todayStr = today();
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const overdue = sortByOrder(
    tasks.filter(t => !t.completed && taskDisplayDate(t) && taskDisplayDate(t)! < todayStr),
    orderedIds
  );
  const todayTasks = sortByOrder(
    tasks.filter(t => !t.completed && taskDisplayDate(t) === todayStr),
    orderedIds
  );
  const unscheduled = sortByOrder(
    tasks.filter(t => !t.completed && !taskDisplayDate(t) && t.urgency >= 7),
    orderedIds
  ).slice(0, 5);
  const completed = tasks.filter(t =>
    t.completed && t.completedAt && t.completedAt.startsWith(todayStr)
  );

  const reorder = (sourceId: string, targetId: string) => {
    const allActive = tasks.filter(t => !t.completed).map(t => t.id);
    const current = [
      ...orderedIds.filter(id => allActive.includes(id)),
      ...allActive.filter(id => !orderedIds.includes(id)),
    ];
    const from = current.indexOf(sourceId);
    const to = current.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const next = [...current];
    next.splice(from, 1);
    next.splice(to, 0, sourceId);
    setOrderedIds(next);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('taskId');
    if (sourceId && sourceId !== targetId) reorder(sourceId, targetId);
    setDragOverId(null);
  };

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
        {todayTasks.map(t => (
          <TaskChip
            key={t.id} task={t} onUpdate={onUpdate}
            isDraggable
            isDragOver={dragOverId === t.id}
            onDragStart={e => handleDragStart(e, t.id)}
            onDragOver={e => handleDragOver(e, t.id)}
            onDrop={e => handleDrop(e, t.id)}
            onDragEnd={() => setDragOverId(null)}
          />
        ))}
      </section>

      {unscheduled.length > 0 && (
        <section className="cal-section">
          <div className="cal-section-header urgent-hint">
            ⚡ 今日やるべき未スケジュール（緊急度 7+）
          </div>
          {unscheduled.map(t => <TaskChip key={t.id} task={t} onUpdate={onUpdate} />)}
        </section>
      )}

      {completed.length > 0 && (
        <section className="cal-section">
          <div className="cal-section-header done-header">✓ 今日の完了 ({completed.length})</div>
          {completed.map(t => (
            <div key={t.id} className="cal-task-chip cal-chip-done">
              <span className="cal-chip-title" style={{ textDecoration: 'line-through' }}>
                {t.title}
              </span>
              {t.actualMinutes && <span style={{ fontSize: 11 }}>{t.actualMinutes}分</span>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// ── Week View (Mon–Fri) ───────────────────────────────────────
function WeekView({ tasks, onUpdate, onBulkUpdate, orderedIds }: Props & {
  orderedIds: string[];
}) {
  const [offset, setOffset] = useState(0);
  const [scheduling, setScheduling] = useState(false);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const monday = getMonday(offset);
  const days = Array.from({ length: 5 }, (_, i) => addDays(monday, i)); // Mon–Fri only
  const todayStr = today();

  const rangeLabel = `${monday.getMonth() + 1}/${monday.getDate()} 〜 ${addDays(monday, 4).getMonth() + 1}/${addDays(monday, 4).getDate()}`;

  const handleAutoSchedule = async () => {
    if (!onBulkUpdate) return;
    setScheduling(true);
    const { scheduled } = autoSchedule(tasks);
    const updated = scheduled.map(({ task, date }) => ({ ...task, scheduledDate: date }));
    await onBulkUpdate(updated);
    setScheduling(false);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnSlot = (e: React.DragEvent, dateStr: string, slot: TimeSlot) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task) onUpdate({ ...task, scheduledDate: dateStr, timeSlot: slot });
    setDragOverSlot(null);
  };

  return (
    <div className="week-view">
      <div className="week-nav">
        <button className="week-nav-btn" onClick={() => setOffset(o => o - 1)}><ChevronLeft size={16} /></button>
        <span className="week-range">{rangeLabel}</span>
        <button className="week-nav-btn" onClick={() => setOffset(o => o + 1)}><ChevronRight size={16} /></button>
        {offset !== 0 && <button className="week-today-btn" onClick={() => setOffset(0)}>今週</button>}
      </div>

      <div className="week-grid">
        {days.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const allDayTasks = sortByOrder(
            tasks.filter(t => !t.completed && taskDisplayDate(t) === dateStr),
            orderedIds
          );
          const amTasks = allDayTasks.filter(t => t.timeSlot !== 'pm');
          const pmTasks = allDayTasks.filter(t => t.timeSlot === 'pm');
          const totalMin = allDayTasks.reduce((s, t) => s + t.estimatedMinutes, 0);

          return (
            <div
              key={dateStr}
              className={`week-col${isToday ? ' today-col' : ''}${isPast ? ' past-col' : ''}`}
            >
              <div className="week-col-header">
                <span className="week-day-label">{DAY_LABELS[i]}</span>
                <span className={`week-date-num${isToday ? ' today-num' : ''}`}>{day.getDate()}</span>
                {totalMin > 0 && <span className="week-total-min">{Math.round(totalMin / 60 * 10) / 10}h</span>}
              </div>

              {/* 午前 */}
              <div
                className={`week-slot${dragOverSlot === `${dateStr}-am` ? ' drop-target' : ''}`}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverSlot(`${dateStr}-am`); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSlot(null); }}
                onDrop={e => handleDropOnSlot(e, dateStr, 'am')}
              >
                <div className="week-slot-label">午前</div>
                <div className="week-slot-tasks">
                  {amTasks.map(t => (
                    <TaskChip key={t.id} task={t} onUpdate={onUpdate}
                      isDraggable onDragStart={e => handleDragStart(e, t.id)} />
                  ))}
                  {amTasks.length === 0 && <div className="week-slot-empty" />}
                </div>
              </div>

              <div className="week-slot-divider" />

              {/* 午後 */}
              <div
                className={`week-slot${dragOverSlot === `${dateStr}-pm` ? ' drop-target' : ''}`}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverSlot(`${dateStr}-pm`); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSlot(null); }}
                onDrop={e => handleDropOnSlot(e, dateStr, 'pm')}
              >
                <div className="week-slot-label">午後</div>
                <div className="week-slot-tasks">
                  {pmTasks.map(t => (
                    <TaskChip key={t.id} task={t} onUpdate={onUpdate}
                      isDraggable onDragStart={e => handleDragStart(e, t.id)} />
                  ))}
                  {pmTasks.length === 0 && <div className="week-slot-empty" />}
                </div>
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
            <button className="schedule-all-btn" onClick={handleAutoSchedule} disabled={scheduling}>
              <Wand2 size={12} />
              {scheduling ? 'スケジューリング中…' : '一括スケジューリング'}
            </button>
          )}
        </div>
        <div className="unscheduled-chips">
          {sortByOrder(tasks.filter(t => !t.completed && !taskDisplayDate(t)), orderedIds)
            .map(t => (
              <TaskChip key={t.id} task={t} onUpdate={onUpdate}
                isDraggable onDragStart={e => handleDragStart(e, t.id)} />
            ))
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

  const [orderedIds, setOrderedIdsState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('taskflow-task-order');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const setOrderedIds = (ids: string[]) => {
    setOrderedIdsState(ids);
    localStorage.setItem('taskflow-task-order', JSON.stringify(ids));
  };

  useEffect(() => {
    const allIds = tasks.filter(t => !t.completed).map(t => t.id);
    setOrderedIdsState(prev => {
      const valid = prev.filter(id => allIds.includes(id));
      const newIds = allIds.filter(id => !prev.includes(id));
      if (valid.length === prev.length && newIds.length === 0) return prev;
      const merged = [...valid, ...newIds];
      localStorage.setItem('taskflow-task-order', JSON.stringify(merged));
      return merged;
    });
  }, [tasks]);

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
        ? <TodayView tasks={tasks} onUpdate={onUpdate} orderedIds={orderedIds} setOrderedIds={setOrderedIds} />
        : <WeekView tasks={tasks} onUpdate={onUpdate} onBulkUpdate={onBulkUpdate} orderedIds={orderedIds} />
      }
    </div>
  );
}
