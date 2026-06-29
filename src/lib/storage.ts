import type { Task } from '../types/task';

const TASKS_KEY = 'taskflow_tasks';
const APIKEY_KEY = 'taskflow_apikey';

export const loadTasks = (): Task[] => {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const loadApiKey = (): string => {
  return localStorage.getItem(APIKEY_KEY) || '';
};

export const saveApiKey = (key: string): void => {
  localStorage.setItem(APIKEY_KEY, key);
};
