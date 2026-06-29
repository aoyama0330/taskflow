import type { Task } from '../types/task';

const DAILY_CAPACITY_MIN = 360; // 6時間

const toDateStr = (d: Date) => d.toLocaleDateString('sv-SE'); // YYYY-MM-DD

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

const nextWorkday = (d: Date): Date => {
  const next = new Date(d);
  do { next.setDate(next.getDate() + 1); } while (isWeekend(next));
  return next;
};

const daysUntil = (dateStr: string, from: Date): number => {
  const diff = new Date(dateStr).getTime() - from.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// 優先度スコア：緊急度×重要度 + 期日の近さボーナス
const priorityScore = (task: Task, today: Date): number => {
  const base = task.urgency * task.importance;
  if (!task.deadline) return base;
  const days = daysUntil(task.deadline, today);
  const deadlineBonus = days <= 0 ? 200 : days <= 1 ? 80 : days <= 3 ? 40 : days <= 7 ? 20 : 5;
  return base + deadlineBonus;
};

export interface ScheduleResult {
  scheduled: { task: Task; date: string }[];
  skipped: Task[]; // 委譲候補など
}

export const autoSchedule = (tasks: Task[], dailyCapacity = DAILY_CAPACITY_MIN): ScheduleResult => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 委譲候補は対象外
  const skipped = tasks.filter(t => !t.completed && t.category === 'delegatable' && !t.scheduledDate);

  // スケジュール対象：未完了・未スケジュール・委譲候補以外
  const targets = tasks
    .filter(t => !t.completed && t.category !== 'delegatable' && !t.scheduledDate)
    .sort((a, b) => priorityScore(b, today) - priorityScore(a, today));

  // 日別の残り容量
  const capacityMap = new Map<string, number>();
  const getCapacity = (d: string) => capacityMap.get(d) ?? dailyCapacity;
  const useCapacity = (d: string, min: number) => capacityMap.set(d, getCapacity(d) - min);

  // 開始日（今日が平日なら今日、週末なら次の月曜）
  let startDay = new Date(today);
  if (isWeekend(startDay)) startDay = nextWorkday(startDay);

  const scheduled: { task: Task; date: string }[] = [];

  for (const task of targets) {
    const deadlineDate = task.deadline ? (() => {
      const d = new Date(task.deadline);
      d.setHours(0, 0, 0, 0);
      return d;
    })() : null;

    // 期日を超えていたら今日に強制配置
    if (deadlineDate && deadlineDate < today) {
      scheduled.push({ task, date: toDateStr(today) });
      useCapacity(toDateStr(today), task.estimatedMinutes);
      continue;
    }

    // 空き時間のある日を探す（最大90日先まで）
    let day = new Date(startDay);
    let placed = false;

    for (let i = 0; i < 90; i++) {
      if (isWeekend(day)) { day = nextWorkday(day); continue; }

      // 期日を超えないか確認
      if (deadlineDate && day > deadlineDate) {
        // 期日前の最後の平日に強制配置
        const fallback = new Date(deadlineDate);
        while (isWeekend(fallback)) fallback.setDate(fallback.getDate() - 1);
        scheduled.push({ task, date: toDateStr(fallback) });
        useCapacity(toDateStr(fallback), task.estimatedMinutes);
        placed = true;
        break;
      }

      if (getCapacity(toDateStr(day)) >= task.estimatedMinutes) {
        scheduled.push({ task, date: toDateStr(day) });
        useCapacity(toDateStr(day), task.estimatedMinutes);
        placed = true;
        break;
      }

      day = nextWorkday(day);
    }

    // それでも配置できなければ翌平日に追加
    if (!placed) {
      scheduled.push({ task, date: toDateStr(startDay) });
    }
  }

  return { scheduled, skipped };
};
