'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { BarChart3, AlertTriangle, CheckCircle2, Star, Users, Ticket, FolderKanban } from 'lucide-react';

const STATUS_KO: Record<string, string> = {
  REGISTERED: '등록', ACCEPTED: '접수', IN_PROGRESS: '처리중', DELAYED: '지연중',
  COMPLETION_REQUESTED: '완료요청', POSTPONEMENT_REQUESTED: '연기요청', APPROVED: '승인', CLOSED: '완료',
};

export function ManagerDashboard() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['manager-dashboard'],
    queryFn: async () => { const r = await fetch('/api/dashboard/manager'); if (!r.ok) throw new Error(); return r.json(); },
  });

  const { data: csatData } = useQuery({
    queryKey: ['csat-dashboard'],
    queryFn: async () => { const r = await fetch('/api/csat'); if (!r.ok) throw new Error(); return r.json(); },
  });

  const { data: slaData } = useQuery({
    queryKey: ['sla-dashboard'],
    queryFn: async () => { const r = await fetch('/api/reports/sla'); if (!r.ok) throw new Error(); return r.json(); },
  });

  const d = dash?.data;
  const csat = csatData?.data?.summary;
  const sla = slaData?.data?.summary;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">관리자 대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-1.5 text-sm text-slate-500"><Ticket className="h-4 w-4" />활성 티켓</div>
          <p className="text-3xl font-bold text-slate-900 mt-1">{isLoading ? '-' : d?.totalActive}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-1.5 text-sm text-red-500"><AlertTriangle className="h-4 w-4" />지연</div>
          <p className="text-3xl font-bold text-red-600 mt-1">{isLoading ? '-' : d?.delayed}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-1.5 text-sm text-slate-500"><CheckCircle2 className="h-4 w-4" />SLA 준수율</div>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{isLoading ? '-' : `${sla?.rate ?? d?.slaRate ?? 0}%`}</p>
          <p className="text-xs text-slate-400 mt-0.5">{sla?.compliant ?? 0}/{sla?.total ?? 0}건</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-1.5 text-sm text-slate-500"><Star className="h-4 w-4" />CSAT 평균</div>
          <p className="text-3xl font-bold text-blue-600 mt-1">{csat?.average?.toFixed(1) ?? '0.0'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{csat?.total ?? 0}건 평가</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-1.5 text-sm text-slate-500"><CheckCircle2 className="h-4 w-4" />승인율</div>
          <p className="text-3xl font-bold text-violet-600 mt-1">{isLoading ? '-' : `${d?.approvalRate ?? 0}%`}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" />상태별 티켓</h3>
          {isLoading ? <p className="text-slate-400">로딩 중...</p> : (
            <div className="space-y-2.5">
              {d?.statusDistribution?.map((s: any) => {
                const maxCount = Math.max(...(d?.statusDistribution?.map((x: any) => x._count) || [1]));
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-20 text-right">{STATUS_KO[s.status] ?? s.status}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.max(4, (s._count / maxCount) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-8 text-right">{s._count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CSAT Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Star className="h-4 w-4" />CSAT 분포</h3>
          {!csat ? <p className="text-slate-400">로딩 중...</p> : (
            <div>
              <div className="text-center mb-4">
                <p className="text-5xl font-bold text-blue-600">{csat.average?.toFixed(1) ?? '0.0'}</p>
                <p className="text-sm text-slate-400 mt-1">/ 5.0 ({csat.total}건)</p>
              </div>
              <div className="flex items-end justify-center gap-3 h-24">
                {(csat.distribution || []).map((d: any) => {
                  const maxC = Math.max(...(csat.distribution?.map((x: any) => x.count) || [1]), 1);
                  return (
                    <div key={d.score} className="flex flex-col items-center gap-1">
                      <div className="w-10 bg-blue-200 rounded-t transition-all" style={{ height: `${Math.max(4, (d.count / maxC) * 80)}px` }}>
                        {d.count > 0 && <span className="block text-center text-xs font-medium text-blue-700 -mt-4">{d.count}</span>}
                      </div>
                      <span className="text-xs text-slate-500">{d.score}점</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Users className="h-4 w-4" />담당자별 현황</h3>
        {isLoading ? <p className="text-slate-400">로딩 중...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-medium text-slate-600">담당자</th>
                <th className="text-right py-2 font-medium text-slate-600">배정 티켓</th>
              </tr>
            </thead>
            <tbody>
              {d?.agentPerformance?.filter((a: any) => a.assignedCount > 0).map((a: any) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="py-2.5 text-slate-900">{a.name}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, a.assignedCount * 10)}%` }} />
                      </div>
                      <span className="font-semibold w-6 text-right">{a.assignedCount}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {d?.agentPerformance?.filter((a: any) => a.assignedCount > 0).length === 0 && (
                <tr><td colSpan={2} className="py-4 text-center text-slate-400">배정된 담당자 없음</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* M-7: Project Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><FolderKanban className="h-4 w-4" />프로젝트별 현황</h3>
        {isLoading ? <p className="text-slate-400">로딩 중...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-medium text-slate-600">프로젝트</th>
                <th className="text-left py-2 font-medium text-slate-600">고객사</th>
                <th className="text-right py-2 font-medium text-slate-600">전체</th>
                <th className="text-right py-2 font-medium text-slate-600">활성</th>
                <th className="text-right py-2 font-medium text-slate-600">지연</th>
              </tr>
            </thead>
            <tbody>
              {(d?.projectStats ?? []).map((p: any) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-2.5 font-medium text-slate-900">{p.name}</td>
                  <td className="py-2.5 text-slate-600">{p.clientName}</td>
                  <td className="py-2.5 text-right">{p.totalTickets}</td>
                  <td className="py-2.5 text-right text-blue-600 font-medium">{p.activeTickets}</td>
                  <td className="py-2.5 text-right">{p.delayed > 0 ? <span className="text-red-600 font-medium">{p.delayed}</span> : <span className="text-slate-400">0</span>}</td>
                </tr>
              ))}
              {(d?.projectStats ?? []).length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-slate-400">활성 프로젝트 없음</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/admin-clients" className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow text-center">
          <p className="text-sm font-medium text-slate-900">고객사 관리</p>
          <p className="text-xs text-slate-400 mt-1">고객사, 부서, 담당자</p>
        </Link>
        <Link href="/admin-projects" className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow text-center">
          <p className="text-sm font-medium text-slate-900">프로젝트 관리</p>
          <p className="text-xs text-slate-400 mt-1">프로젝트, 배정</p>
        </Link>
        <Link href="/admin-reports" className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow text-center">
          <p className="text-sm font-medium text-slate-900">리포트</p>
          <p className="text-xs text-slate-400 mt-1">SLA, CSAT 상세</p>
        </Link>
      </div>
    </div>
  );
}
