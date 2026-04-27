// Gap Fix: M-4 (프로젝트 필터), M-5 (기간 필터), M-6 (SLA 카운트다운)

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTickets } from '../hooks/useTickets';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Search, Plus, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'REGISTERED', label: '등록' },
  { value: 'ACCEPTED', label: '접수' },
  { value: 'IN_PROGRESS', label: '처리중' },
  { value: 'DELAYED', label: '지연중' },
  { value: 'COMPLETION_REQUESTED', label: '완료요청' },
  { value: 'POSTPONEMENT_REQUESTED', label: '연기요청' },
  { value: 'APPROVED', label: '승인' },
  { value: 'CLOSED', label: '완료' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: '전체 우선순위' },
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
  { value: 'URGENT', label: '긴급' },
];

function SLABadge({ ticket }: { ticket: any }) {
  const dueDate = ticket.plannedDueDate ?? ticket.requestedDueDate;
  if (!dueDate) return <span className="text-slate-400 text-xs">-</span>;
  if (ticket.status === 'CLOSED') return <span className="text-emerald-500 text-xs">완료</span>;

  const hoursLeft = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 0) return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">초과</span>;
  if (hoursLeft < 24) return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">{Math.floor(hoursLeft)}h</span>;
  return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{Math.floor(hoursLeft / 24)}d</span>;
}

export function TicketList() {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    projectId: '',
    from: '',
    to: '',
    page: 1,
  });

  // M-4: 프로젝트 목록
  const { data: projectsData } = useQuery({
    queryKey: ['projects-filter'],
    queryFn: async () => { const r = await fetch('/api/projects?limit=100'); return r.json(); },
  });
  const projects = projectsData?.data ?? [];

  const { data, isLoading } = useTickets(filters);
  const tickets = data?.data ?? [];
  const pagination = data?.pagination;

  const hasFilters = filters.status || filters.priority || filters.search || filters.projectId || filters.from || filters.to;
  const resetFilters = () => setFilters({ status: '', priority: '', search: '', projectId: '', from: '', to: '', page: 1 });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">티켓</h1>
        <Link href="/tickets/new">
          <Button><Plus className="h-4 w-4 mr-2" />새 티켓 등록</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex gap-3 items-end">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="제목, 설명, 티켓번호 검색..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              className="pl-10 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value, page: 1 }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex gap-3 items-end">
          {/* M-4: 프로젝트 필터 */}
          <select value={filters.projectId} onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value, page: 1 }))} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">전체 프로젝트</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.client?.name} — {p.name}</option>)}
          </select>
          {/* M-5: 기간 필터 */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">등록일</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            <span className="text-slate-400 text-sm">~</span>
            <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 px-2 py-1.5 rounded hover:bg-blue-50">
              <RotateCcw className="h-3.5 w-3.5" />초기화
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">티켓번호</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">제목</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">상태</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">우선순위</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">담당자</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">SLA</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">등록일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">로딩 중...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">티켓이 없습니다.</td></tr>
            ) : (
              tickets.map((ticket: any) => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${ticket.id}`} className="font-mono text-blue-600 hover:underline">{ticket.ticketNumber}</Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">{ticket.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-4 py-3 text-slate-600">{ticket.assignee?.name ?? '-'}</td>
                  <td className="px-4 py-3"><SLABadge ticket={ticket} /></td>
                  <td className="px-4 py-3 text-slate-500">{format(new Date(ticket.createdAt), 'yyyy-MM-dd')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">총 {pagination.total}건 중 {(pagination.page - 1) * pagination.limit + 1}~{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
            <div className="flex gap-1">
              <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>이전</Button>
              <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>다음</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
