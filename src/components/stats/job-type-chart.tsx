'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { JobTypeStat } from '@/types/job';

interface JobTypeChartProps {
  data: JobTypeStat[];
}

/** Recharts 커스텀 툴팁 타입 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

/** 커스텀 툴팁 컴포넌트 */
function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value}개 공고</p>
    </div>
  );
}

/** 직무 유형별 색상 매핑 */
const COLOR_MAP: Record<string, string> = {
  SRE: '#6366f1',
  Cloud: '#3b82f6',
  MLOps: '#8b5cf6',
  Platform: '#22c55e',
  DevOps: '#f97316',
  Infrastructure: '#f43f5e',
  System: '#eab308',
};

const DEFAULT_COLOR = '#94a3b8';

/**
 * 직무 유형별 비율 파이 차트
 */
export function JobTypeChart({ data }: JobTypeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLOR_MAP[entry.name] ?? DEFAULT_COLOR} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
}
