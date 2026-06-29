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

export const CATEGORY_META: Record<TaskCategory, { label: string; color: string; icon: string; textColor: string }> = {
  quick:       { label: 'クイック',   color: '#B8E4B8', icon: '⚡', textColor: '#1C5C1C' },
  urgent:      { label: '期限優先',   color: '#F5B0B8', icon: '🔥', textColor: '#8A2028' },
  deep:        { label: '集中思考',   color: '#AABCE8', icon: '🧠', textColor: '#1C3080' },
  execution:   { label: '作業実行',   color: '#F8D090', icon: '🔧', textColor: '#6A4000' },
  delegatable: { label: '委譲候補',   color: '#D4A8E0', icon: '🤝', textColor: '#501870' },
};
