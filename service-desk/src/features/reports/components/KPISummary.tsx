// Design Ref: §4.3 — KPI 카드 4개 (필터 연동)
// Plan SC: SC-5 (KPI 카드 필터 기간에 맞게 갱신)

'use client';

import { Ticket, CheckCircle2, Star, Clock } from 'lucide-react';

interface Summary {
  totalTickets: number;
  slaRate: number;
  csatAverage: number;
  avgResolutionHours: number;
}

interface KPISummaryProps {
  summary?: Summary;
  isLoading: boolean;
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className={`flex items-center gap-1.5 text-sm ${color} mb-1`}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className={`text-3xl font-bold mt-1 ${isLoading ? 'text-slate-300' : 'text-slate-900'}`}>
        {isLoading ? '-' : value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function KPISummary({ summary, isLoading }: KPISummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <KPICard
        icon={Ticket}
        label="총 티켓"
        value={summary?.totalTickets.toLocaleString() ?? '-'}
        color="text-slate-500"
        isLoading={isLoading}
      />
      <KPICard
        icon={CheckCircle2}
        label="SLA 준수율"
        value={`${summary?.slaRate ?? 0}%`}
        color={
          (summary?.slaRate ?? 0) >= 90
            ? 'text-emerald-600'
            : (summary?.slaRate ?? 0) >= 70
            ? 'text-amber-600'
            : 'text-red-600'
        }
        isLoading={isLoading}
      />
      <KPICard
        icon={Star}
        label="CSAT 평균"
        value={`${summary?.csatAverage?.toFixed(1) ?? '0.0'}`}
        sub="/ 5.0"
        color="text-blue-600"
        isLoading={isLoading}
      />
      <KPICard
        icon={Clock}
        label="평균 해결 시간"
        value={`${summary?.avgResolutionHours ?? 0}h`}
        color="text-violet-600"
        isLoading={isLoading}
      />
    </div>
  );
}
