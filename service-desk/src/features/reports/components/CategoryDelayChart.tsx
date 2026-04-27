// Design Ref: §4.6 — 카테고리별 지연 분석 가로 BarChart (색상 코딩)
// Plan SC: SC-4 (카테고리별 지연률 시각화)

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface CategoryDelay {
  category: string;
  categoryKo: string;
  total: number;
  delayed: number;
  delayRate: number;
}

interface CategoryDelayChartProps {
  data: CategoryDelay[];
  isLoading: boolean;
}

function getBarColor(rate: number) {
  if (rate >= 50) return '#ef4444'; // red
  if (rate >= 30) return '#f59e0b'; // amber
  return '#10b981';                  // emerald
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: CategoryDelay = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3 text-sm">
      <p className="font-medium text-slate-900">{d.categoryKo}</p>
      <p className="text-slate-600">지연률: <span className="font-semibold">{d.delayRate}%</span></p>
      <p className="text-slate-500 text-xs">지연 {d.delayed}건 / 전체 {d.total}건</p>
    </div>
  );
}

export function CategoryDelayChart({ data, isLoading }: CategoryDelayChartProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-1">카테고리별 지연 분석</h3>
      <p className="text-xs text-slate-400 mb-4">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />30% 미만
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mx-1 ml-2" />30~50%
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mx-1 ml-2" />50% 이상
      </p>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-slate-400">로딩 중...</div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400">데이터 없음</div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                type="category"
                dataKey="categoryKo"
                width={72}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="delayRate" radius={[0, 3, 3, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.category} fill={getBarColor(entry.delayRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
