// Design Ref: §6 — 전체 분석 대시보드 레이아웃 + 필터 상태 관리
// Plan SC: SC-1~SC-6

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { FilterBar, type FilterState } from './FilterBar';
import { KPISummary } from './KPISummary';
import { DailyTicketChart } from './DailyTicketChart';
import { WeeklySLAChart } from './WeeklySLAChart';
import { CategoryDelayChart } from './CategoryDelayChart';

function buildAnalyticsUrl(filters: FilterState) {
  const params = new URLSearchParams();
  params.set('period', filters.period);
  if (filters.period === 'custom') {
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
  }
  if (filters.projectId) params.set('projectId', filters.projectId);
  return `/api/reports/analytics?${params.toString()}`;
}

export function ReportsDashboard() {
  const [filters, setFilters] = useState<FilterState>({
    period: '30',
    from: '',
    to: '',
    projectId: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reports-analytics', filters],
    queryFn: async () => {
      const r = await fetch(buildAnalyticsUrl(filters));
      if (!r.ok) throw new Error('리포트 데이터 로드 실패');
      return r.json();
    },
  });

  const analytics = data?.data;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        리포트
      </h1>

      {/* 필터 트레이 */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* KPI 카드 4개 */}
      <KPISummary summary={analytics?.summary} isLoading={isLoading} />

      {/* 일별 티켓 트렌드 (전체 너비) */}
      <DailyTicketChart
        data={analytics?.dailyTickets ?? []}
        isLoading={isLoading}
      />

      {/* SLA 주별 추이 + 카테고리별 지연 (2컬럼) */}
      <div className="grid grid-cols-2 gap-4">
        <WeeklySLAChart
          data={analytics?.weeklySLA ?? []}
          currentRate={analytics?.summary?.slaRate ?? 0}
          isLoading={isLoading}
        />
        <CategoryDelayChart
          data={analytics?.categoryDelay ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
