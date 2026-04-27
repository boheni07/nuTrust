'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { useTicketAction } from '@/features/tickets/hooks/useTickets';
import { format } from 'date-fns';
import { Ticket, AlertTriangle, Clock, CheckCircle2, Inbox, Zap } from 'lucide-react';
import { useState } from 'react';

function SLACountdown({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return <span className="text-slate-400 text-xs">-</span>;
  const hoursLeft = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 0) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">초과</span>;
  if (hoursLeft < 24) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">{Math.floor(hoursLeft)}h</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{Math.floor(hoursLeft / 24)}d</span>;
}

export function AgentDashboard() {
  const qc = useQueryClient();

  // Dashboard summary
  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: async () => { const r = await fetch('/api/dashboard/agent'); if (!r.ok) throw new Error(); return r.json(); },
  });

  // Ticket list
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['agent-tickets-all'],
    queryFn: async () => { const r = await fetch('/api/tickets?limit=50&sortBy=createdAt&sortOrder=desc'); if (!r.ok) throw new Error(); return r.json(); },
  });

  const action = useTicketAction();
  const [acceptModal, setAcceptModal] = useState<any>(null);
  const [actionPlan, setActionPlan] = useState('');
  const [plannedDueDate, setPlannedDueDate] = useState('');

  const counts = dash?.data?.counts ?? {};
  const urgentTickets = dash?.data?.urgentTickets ?? [];
  const recentHistory = dash?.data?.recentHistory ?? [];
  const tickets = ticketsData?.data ?? [];

  const openAcceptModal = (ticket: any) => {
    setAcceptModal(ticket);
    setActionPlan('');
    setPlannedDueDate(ticket.requestedDueDate?.slice(0, 10) || '');
  };

  const handleAccept = () => {
    if (!actionPlan.trim() || !acceptModal) return;
    action.mutate(
      { ticketId: acceptModal.id, action: 'accept', body: { actionPlan, plannedDueDate: new Date(plannedDueDate).toISOString() } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: ['agent-dashboard'] }); qc.invalidateQueries({ queryKey: ['agent-tickets-all'] }); } }
    );
    setAcceptModal(null);
  };

  const handleComplete = (ticketId: string) => {
    action.mutate(
      { ticketId, action: 'complete' },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: ['agent-dashboard'] }); qc.invalidateQueries({ queryKey: ['agent-tickets-all'] }); } }
    );
  };

  const isLoading = dashLoading || ticketsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">담당자 대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><Inbox className="h-3.5 w-3.5" />접수 대기</div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{isLoading ? '-' : counts.registered}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><Ticket className="h-3.5 w-3.5" />배정 티켓</div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{isLoading ? '-' : counts.assigned}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" />처리중</div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{isLoading ? '-' : counts.inProgress}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-xs text-red-500"><AlertTriangle className="h-3.5 w-3.5" />지연</div>
          <p className="text-2xl font-bold text-red-600 mt-1">{isLoading ? '-' : counts.delayed}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><Zap className="h-3.5 w-3.5" />승인 대기</div>
          <p className="text-2xl font-bold text-violet-600 mt-1">{isLoading ? '-' : counts.completionReq}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><CheckCircle2 className="h-3.5 w-3.5" />오늘 완료</div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{isLoading ? '-' : counts.todayClosed}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-6">
        {/* Left: Ticket List */}
        <div className="space-y-4">
          {/* Urgent Tickets */}
          {urgentTickets.length > 0 && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-4">
              <h2 className="font-semibold text-red-900 mb-2 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />긴급/지연 티켓</h2>
              {urgentTickets.map((t: any) => (
                <Link key={t.id} href={`/agent-tickets/${t.id}`} className="flex items-center justify-between bg-white rounded-lg border border-red-200 px-3 py-2 mb-1.5 last:mb-0 hover:shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{t.ticketNumber}</span>
                    <span className="text-sm font-medium text-slate-900 truncate max-w-xs">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SLACountdown dueDate={t.plannedDueDate} />
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* All Tickets */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-700">내 티켓</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">티켓번호</th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">제목</th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">상태</th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">우선순위</th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">SLA</th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ticketsLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">로딩 중...</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">배정된 티켓이 없습니다.</td></tr>
                ) : tickets.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5"><Link href={`/agent-tickets/${t.id}`} className="font-mono text-blue-600 hover:underline text-xs">{t.ticketNumber}</Link></td>
                    <td className="px-3 py-2.5 text-slate-900 max-w-[200px] truncate">{t.title}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                    <td className="px-3 py-2.5"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-3 py-2.5"><SLACountdown dueDate={t.plannedDueDate ?? t.requestedDueDate} /></td>
                    <td className="px-3 py-2.5">
                      {t.status === 'REGISTERED' && <Button size="sm" onClick={() => openAcceptModal(t)}>접수</Button>}
                      {t.status === 'ACCEPTED' && <Button size="sm" onClick={() => openAcceptModal(t)}>접수</Button>}
                      {(t.status === 'IN_PROGRESS' || t.status === 'DELAYED') && <Button size="sm" variant="approve" onClick={() => handleComplete(t.id)}>완료요청</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 h-fit">
          <h2 className="font-semibold text-slate-900 mb-4">최근 활동</h2>
          <div className="space-y-3">
            {recentHistory.length === 0 && <p className="text-sm text-slate-400">활동 없음</p>}
            {recentHistory.map((h: any) => (
              <div key={h.id} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-slate-900">
                    <span className="font-mono text-xs text-slate-500">{h.ticket?.ticketNumber}</span>
                    {' '}<StatusBadge status={h.toStatus} />
                  </p>
                  <p className="text-xs text-slate-400">{format(new Date(h.createdAt), 'MM-dd HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      {acceptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-slate-900 mb-1">티켓 접수</h3>
            <p className="text-sm text-slate-500 mb-4">{acceptModal.ticketNumber} — {acceptModal.title}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">처리계획 *</label>
                <textarea value={actionPlan} onChange={(e) => setActionPlan(e.target.value)}
                  placeholder="어떻게 처리할 예정인지 입력해 주세요" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">완료예정일</label>
                <input type="date" value={plannedDueDate} onChange={(e) => setPlannedDueDate(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <p className="text-xs text-slate-400 mt-1">기본값: 고객 처리희망일</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="secondary" onClick={() => setAcceptModal(null)}>취소</Button>
              <Button onClick={handleAccept} disabled={!actionPlan.trim() || !plannedDueDate}>접수</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
