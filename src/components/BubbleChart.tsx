import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { Task } from '../types/task';
import { CATEGORY_META } from '../types/task';

interface Props {
  tasks: Task[];
}

interface ChartPoint {
  x: number;
  y: number;
  z: number;
  task: Task;
}

const CustomDot = (props: { cx?: number; cy?: number; payload?: ChartPoint }) => {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;
  const meta = CATEGORY_META[payload.task.category];
  const r = Math.max(10, Math.min(36, payload.z / 4));
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={meta.color + '33'} stroke={meta.color} strokeWidth={1.5} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill={meta.color}>{meta.icon}</text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: ChartPoint }[] }) => {
  if (!active || !payload?.length) return null;
  const { task } = payload[0].payload;
  const meta = CATEGORY_META[task.category];
  return (
    <div className="bubble-tooltip">
      <div className="tooltip-title">{task.title}</div>
      <div className="tooltip-row"><span style={{ color: meta.color }}>{meta.icon} {meta.label}</span></div>
      <div className="tooltip-row">緊急度 {task.urgency} / 重要度 {task.importance}</div>
      <div className="tooltip-row">想定 {task.estimatedMinutes}分</div>
    </div>
  );
};

export default function BubbleChart({ tasks }: Props) {
  const activeTasks = tasks.filter(t => !t.completed);

  const data: ChartPoint[] = activeTasks.map(task => ({
    x: task.urgency,
    y: task.importance,
    z: task.estimatedMinutes,
    task,
  }));

  if (data.length === 0) {
    return (
      <div className="chart-panel">
        <div className="panel-header">ポジションマップ</div>
        <div className="empty-state">タスクを追加するとマップに表示されます</div>
      </div>
    );
  }

  return (
    <div className="chart-panel">
      <div className="panel-header">
        ポジションマップ
        <span className="panel-hint">● サイズ＝所要時間 ／ 色＝種別</span>
      </div>

      <div className="chart-labels">
        <span className="axis-label-y">↑ 重要度</span>
        <span className="axis-label-x">緊急度 →</span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <XAxis
            type="number" dataKey="x" domain={[0, 11]} tick={{ fill: '#666', fontSize: 11 }}
            label={{ value: '緊急度', position: 'insideBottom', offset: -4, fill: '#555', fontSize: 11 }}
          />
          <YAxis
            type="number" dataKey="y" domain={[0, 11]} tick={{ fill: '#666', fontSize: 11 }}
            label={{ value: '重要度', angle: -90, position: 'insideLeft', fill: '#555', fontSize: 11 }}
          />
          <ReferenceLine x={5.5} stroke="#2a2a2a" strokeDasharray="4 4" />
          <ReferenceLine y={5.5} stroke="#2a2a2a" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} shape={<CustomDot />}>
            {data.map((_, i) => <Cell key={i} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="quadrant-labels">
        <span className="ql ql-tl">重要・余裕あり<br/><small>計画して取り組む</small></span>
        <span className="ql ql-tr">重要・緊急<br/><small>今すぐやる</small></span>
        <span className="ql ql-bl">重要度低・余裕あり<br/><small>委譲 or 後回し</small></span>
        <span className="ql ql-br">重要度低・緊急<br/><small>素早く片付ける</small></span>
      </div>

      <div className="legend">
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <span key={key} className="legend-item">
            <span className="legend-dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
        ))}
      </div>
    </div>
  );
}
