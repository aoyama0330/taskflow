export type TaskCategory = 'quick' | 'urgent' | 'deep' | 'execution' | 'delegatable';
export type EnergyLevel = 'high' | 'low';
export type TimeSlot = 'am' | 'pm';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  energyLevel: EnergyLevel;
  estimatedMinutes: number;
  actualMinutes: number | null;
  urgency: number;
  importance: number;
  deadline: string | null;
  scheduledDate: string | null;
  timeSlot: TimeSlot | null;
  delegateTo: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  tags: string[];
}

export const CATEGORY_META: Record<TaskCategory, { label: string; color: string; icon: string }> = {
  quick:       { label: 'クイック',   color: '#4caf50', icon: '⚡' },
  urgent:      { label: '期限優先',   color: '#f44336', icon: '🔥' },
  deep:        { label: '集中思考',   color: '#5c6bc0', icon: '🧠' },
  execution:   { label: '作業実行',   color: '#ff9800', icon: '🔧' },
  delegatable: { label: '委譲候補',   color: '#ab47bc', icon: '🤝' },
};
