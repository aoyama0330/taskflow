import Anthropic from '@anthropic-ai/sdk';
import type { Task, TaskCategory, EnergyLevel } from '../types/task';

interface ExtractedTask {
  title: string;
  description: string;
  category: TaskCategory;
  energyLevel: EnergyLevel;
  estimatedMinutes: number;
  urgency: number;
  importance: number;
  deadline: string | null;
  delegateTo: string | null;
}

const makeSystemPrompt = (today: string) =>
  `あなたはタスク管理アシスタントです。入力テキストからタスクを抽出し、JSON配列として返してください。

今日の日付: ${today}
「明日」「来週」「今週中」などの相対表現はこの日付を基準に解釈してください。

各タスクのフィールド:
- title: 短いタイトル（50文字以内）
- description: 簡潔な説明
- category: "quick"（5分以内）/ "urgent"（期日迫り）/ "deep"（集中思考）/ "execution"（作業系）/ "delegatable"（委譲可能）
- energyLevel: "high"（集中必要）/ "low"（疲れていてもOK）
- estimatedMinutes: 想定所要時間（分）
- urgency: 1〜10（緊急度。10が最高）
- importance: 1〜10（重要度。10が最高）
- deadline: 期日（YYYY-MM-DD形式）またはnull
- delegateTo: 担当者名またはnull

JSONのみを返し、説明文は不要です。`;

export const extractTasks = async (text: string, apiKey: string): Promise<Task[]> => {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: makeSystemPrompt(today),
    messages: [{ role: 'user', content: text }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('タスクの抽出に失敗しました');

  const extracted: ExtractedTask[] = JSON.parse(jsonMatch[0]);
  return extracted.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
    actualMinutes: null,
    scheduledDate: null,
    completedAt: null,
    completed: false,
    createdAt: new Date().toISOString(),
    tags: [],
  }));
};

export const generateMentorAdvice = async (tasks: Task[], apiKey: string): Promise<string> => {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const summary = tasks.map(t =>
    `・${t.title}（${t.category}、緊急度${t.urgency}、重要度${t.importance}、${t.estimatedMinutes}分）`
  ).join('\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `以下のタスクリストを見て、仕事の傾向・優先アドバイス・一言励ましを150文字以内で返してください。\n\n${summary}`,
    }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
};
