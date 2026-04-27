'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { Ticket, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

export default function PortalDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-tickets'],
    queryFn: async () => {
      const res = await fetch('/api/tickets?limit=50');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const tickets = data?.data ?? [];
  const active = tickets.filter((t: any) => !['CLOSED', 'APPROVED'].includes(t.status));
  const needsAction = tickets.filter((t: any) => ['COMPLETION_REQUESTED', 'POSTPONEMENT_REQUESTED'].includes(t.status));
  const closed = tickets.filter((t: any) => t.status === 'CLOSED');
  const delayed = tickets.filter((t: any) => t.status === 'DELAYED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
        <Link href="/tickets/new"><Button><Plus className="h-4 w-4 mr-2" />새 티켓 등록</Button></Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Link href="/tickets" className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-sm text-slate-500"><Ticket className="h-4 w-4" />전체 티켓</div>
          <p className="text-3xl font-bold text-slate-900 mt-1">{isLoading ? '-' : tickets.length}</p>
        </Link>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500"><Clock className="h-4 w-4" />처리중</div>
          <p className="text-3xl font-bold text-blue-600 mt-1">{isLoading ? '-' : active.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-sm text-amber-500"><AlertCircle className="h-4 w-4" />승인 필요</div>
          <p className="text-3xl font-bold text-amber-600 mt-1">{isLoading ? '-' : needsAction.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="h-4 w-4" />완료</div>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{isLoading ? '-' : closed.length}</p>
        </div>
      </div>

      {/* Action Required */}
      {needsAction.length > 0 && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-5">
          <h2 className="font-semibold text-amber-900 mb-3">승인이 필요한 티켓</h2>
          <div className="space-y-2">
            {needsAction.map((t: any) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between bg-white rounded-lg border border-amber-200 px-4 py-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-500">{t.ticketNumber}</span>
                  <span className="font-medium text-slate-900">{t.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <Button size="sm" variant="approve">확인</Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">최근 티켓</h2>
          <Link href="/tickets" className="text-sm text-blue-600 hover:underline">전체 보기</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">티켓번호</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">제목</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">상태</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">우선순위</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">담당자</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">등록일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">로딩 중...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">등록된 티켓이 없습니다.</td></tr>
            ) : tickets.slice(0, 10).map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5"><Link href={`/tickets/${t.id}`} className="font-mono text-blue-600 hover:underline">{t.ticketNumber}</Link></td>
                <td className="px-4 py-2.5 text-slate-900 max-w-xs truncate">{t.title}</td>
                <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-2.5"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-2.5 text-slate-600">{t.assignee?.name ?? '-'}</td>
                <td className="px-4 py-2.5 text-slate-500">{format(new Date(t.createdAt), 'MM-dd HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
