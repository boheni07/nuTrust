// Design Anchor: Ticket Status Colors — §1 Colors

import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<string, string> = {
  REGISTERED: 'text-slate-500 bg-slate-100',
  ACCEPTED: 'text-blue-600 bg-blue-100',
  IN_PROGRESS: 'text-blue-600 bg-blue-50',
  DELAYED: 'text-red-600 bg-red-100',
  COMPLETION_REQUESTED: 'text-violet-600 bg-violet-100',
  POSTPONEMENT_REQUESTED: 'text-amber-600 bg-amber-100',
  APPROVED: 'text-emerald-600 bg-emerald-100',
  REJECTED: 'text-red-600 bg-red-100',
  CLOSED: 'text-emerald-600 bg-emerald-50',
};

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: '등록',
  ACCEPTED: '접수',
  IN_PROGRESS: '처리중',
  DELAYED: '지연중',
  COMPLETION_REQUESTED: '완료요청',
  POSTPONEMENT_REQUESTED: '연기요청',
  APPROVED: '승인',
  REJECTED: '반려',
  CLOSED: '완료',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'text-slate-500 bg-slate-100',
  MEDIUM: 'text-blue-600 bg-blue-100',
  HIGH: 'text-amber-600 bg-amber-100',
  URGENT: 'text-red-600 bg-red-100',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[status] ?? 'text-gray-500 bg-gray-100')}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', PRIORITY_STYLES[priority] ?? 'text-gray-500 bg-gray-100')}>
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}
