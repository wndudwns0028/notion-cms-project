'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TechStackStat } from '@/types/job';

interface TechStackChartProps {
  data: TechStackStat[];
  /** 표시할 최대 항목 수 (기본값: 15) */
  limit?: number;
}

/** Recharts 커스텀 툴팁 타입 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

/** 커스텀 툴팁 컴포넌트 */
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{payload[0].value}개 공고</p>
    </div>
  );
}

/** 막대 색상 팔레트 */
const COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
];

/**
 * 기술스택별 공고 수 가로 막대 차트
 */
export function TechStackChart({ data, limit = 15 }: TechStackChartProps) {
  const chartData = data.slice(0, limit);
  const chartHeight = Math.max(300, chartData.length * 36);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
