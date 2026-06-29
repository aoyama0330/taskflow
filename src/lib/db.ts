import { supabase } from './supabase';
import type { Task } from '../types/task';

const toTask = (row: Record<string, unknown>): Task => ({
  id: row.id as string,
  title: row.title as string,
  description: (row.description as string) || '',
  category: row.category as Task['category'],
  energyLevel: row.energy_level as Task['energyLevel'],
  estimatedMinutes: row.estimated_minutes as number,
  actualMinutes: row.actual_minutes as number | null,
  urgency: row.urgency as number,
  importance: row.importance as number,
  deadline: row.deadline as string | null,
  scheduledDate: row.scheduled_date as string | null,
  delegateTo: row.delegate_to as string | null,
  completed: row.completed as boolean,
  completedAt: row.completed_at as string | null,
  createdAt: row.created_at as string,
  tags: (row.tags as string[]) || [],
});

const toRow = (task: Task, userId: string) => ({
  id: task.id,
  user_id: userId,
  title: task.title,
  description: task.description,
  category: task.category,
  energy_level: task.energyLevel,
  estimated_minutes: task.estimatedMinutes,
  actual_minutes: task.actualMinutes ?? null,
  urgency: task.urgency,
  importance: task.importance,
  deadline: task.deadline ?? null,
  scheduled_date: task.scheduledDate ?? null,
  delegate_to: task.delegateTo ?? null,
  completed: task.completed,
  completed_at: task.completedAt ?? null,
  tags: task.tags,
});

export const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toTask);
};

export const insertTask = async (task: Task): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('tasks').insert(toRow(task, user.id));
  if (error) throw error;
};

export const updateTask = async (task: Task): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('tasks')
    .update(toRow(task, user.id))
    .eq('id', task.id);
  if (error) throw error;
};

export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
};
