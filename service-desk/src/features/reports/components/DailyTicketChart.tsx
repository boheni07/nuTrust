// Design Ref: §4.4 — 일별 티켓 발생량 BarChart
// Plan SC: SC-2 (일별 티켓 트렌드 BarChart 렌더링)

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DailyTicket {
  date: string;
  created: number;
  closed: number;
}

interface DailyTicketChartProps {
  data: DailyTicket[];
  isLoading: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function DailyTicketChart({ data, isLoading }: DailyTicketChartProps) {
  // 60일 이상이면 주별 집계 (7일 단위로 합산)
  const chartData =
    data.length > 60
      ? data.filter((_, i) => i % 7 === 0).map((d, i) => {
          const week = data.slice(i * 7, i * 7 + 7);
          return {
            date: d.date,
            created: week.reduce((s, x) => s + x.created, 0),
            closed: week.reduce((s, x) => s + x.closed, 0),
          };
        })
      : data;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">일별 티켓 발생량</h3>
      {isLoading ? (
        <div className="h-60 flex items-center justify-center text-slate-400">로딩 중...</div>
      ) : data.length === 0 ? (
        <div className="h-60 flex items-center justify-center text-slate-400">데이터 없음</div>
      ) : (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval={Math.floor(chartData.length / 8)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(label) => formatDate(label as string)}
                formatter={(value, name) => [value, name === 'created' ? '신규' : '완료']}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend
                formatter={(value) => (value === 'created' ? '신규' : '완료')}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="created" fill="#3b82f6" name="created" radius={[2, 2, 0, 0]} />
              <Bar dataKey="closed" fill="#10b981" name="closed" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
