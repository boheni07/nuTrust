// Design Ref: §4.5 — SLA 주별 준수율 LineChart + 목표 90% 점선
// Plan SC: SC-3 (SLA 주별 트렌드 + 목표선)

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface WeeklySLA {
  week: string;
  rate: number;
  compliant: number;
  total: number;
}

interface WeeklySLAChartProps {
  data: WeeklySLA[];
  currentRate: number;
  isLoading: boolean;
}

export function WeeklySLAChart({ data, currentRate, isLoading }: WeeklySLAChartProps) {
  const rateColor =
    currentRate >= 90 ? 'text-emerald-600' : currentRate >= 70 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">SLA 준수율 추이</h3>
        {!isLoading && (
          <div className="text-right">
            <span className={`text-2xl font-bold ${rateColor}`}>{currentRate}%</span>
            <p className="text-xs text-slate-400">전체 기간</p>
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="h-52 flex items-center justify-center text-slate-400">로딩 중...</div>
      ) : data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-slate-400">
          완료된 티켓 데이터 없음
        </div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'SLA 준수율']}
                contentStyle={{ fontSize: 12 }}
              />
              {/* 90% 목표선 */}
              <ReferenceLine
                y={90}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: '목표 90%', position: 'insideTopRight', fontSize: 11, fill: '#ef4444' }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
