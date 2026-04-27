// Design Ref: §5 — 날짜/주별/카테고리별 집계 유틸
// Plan SC: SC-1 (날짜 필터 연동), SC-4 (카테고리별 지연 분석)

import { startOfWeek, format, eachDayOfInterval, parseISO } from 'date-fns';

export const CATEGORY_KO: Record<string, string> = {
  ACCESS_REQUEST: '접근 권한',
  INCIDENT: '장애/오류',
  SERVICE_REQUEST: '서비스 요청',
  INQUIRY: '문의',
  CHANGE_REQUEST: '변경 요청',
  OTHER: '기타',
};

export interface TicketRaw {
  createdAt: Date;
  closedAt: Date | null;
  status: string;
  category: string;
  plannedDueDate: Date | null;
}

export interface DailyTicket {
  date: string;    // "YYYY-MM-DD"
  created: number;
  closed: number;
}

export interface WeeklySLA {
  week: string;    // "M/d" (주 시작일)
  rate: number;    // 0~100 정수
  compliant: number;
  total: number;
}

export interface CategoryDelay {
  category: string;
  categoryKo: string;
  total: number;
  delayed: number;
  delayRate: number; // 소수점 1자리
}

/** 일별 티켓 생성/완료 집계 */
export function aggregateByDay(tickets: TicketRaw[], from: Date, to: Date): DailyTicket[] {
  const days = eachDayOfInterval({ start: from, end: to });
  const map = new Map<string, { created: number; closed: number }>();
  for (const day of days) {
    map.set(format(day, 'yyyy-MM-dd'), { created: 0, closed: 0 });
  }

  for (const t of tickets) {
    const createdKey = format(t.createdAt, 'yyyy-MM-dd');
    if (map.has(createdKey)) map.get(createdKey)!.created++;
    if (t.closedAt) {
      const closedKey = format(t.closedAt, 'yyyy-MM-dd');
      if (map.has(closedKey)) map.get(closedKey)!.closed++;
    }
  }

  return Array.from(map.entries()).map(([date, counts]) => ({ date, ...counts }));
}

/** 주별 SLA 준수율 집계 (완료 티켓 기준) */
export function aggregateWeeklySLA(tickets: TicketRaw[]): WeeklySLA[] {
  const closedWithDue = tickets.filter((t) => t.closedAt && t.plannedDueDate);
  const weekMap = new Map<string, { compliant: number; total: number }>();

  for (const t of closedWithDue) {
    const weekStart = startOfWeek(t.closedAt!, { weekStartsOn: 1 });
    const weekKey = format(weekStart, 'M/d');
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, { compliant: 0, total: 0 });
    const entry = weekMap.get(weekKey)!;
    entry.total++;
    if (t.closedAt! <= t.plannedDueDate!) entry.compliant++;
  }

  return Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, { compliant, total }]) => ({
      week,
      rate: total > 0 ? Math.round((compliant / total) * 100) : 0,
      compliant,
      total,
    }));
}

/** 카테고리별 지연 분석 집계 */
export function aggregateCategoryDelay(tickets: TicketRaw[]): CategoryDelay[] {
  const catMap = new Map<string, { total: number; delayed: number }>();

  for (const t of tickets) {
    const cat = t.category || 'OTHER';
    if (!catMap.has(cat)) catMap.set(cat, { total: 0, delayed: 0 });
    const entry = catMap.get(cat)!;
    entry.total++;

    const isDelayed =
      t.status === 'DELAYED' ||
      (t.closedAt && t.plannedDueDate && t.closedAt > t.plannedDueDate);
    if (isDelayed) entry.delayed++;
  }

  return Array.from(catMap.entries())
    .map(([category, { total, delayed }]) => ({
      category,
      categoryKo: CATEGORY_KO[category] ?? category,
      total,
      delayed,
      delayRate: total > 0 ? parseFloat(((delayed / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.delayRate - a.delayRate);
}

/** period 파라미터 → 실제 날짜 범위 변환 */
export function getDateRange(
  period: string,
  from?: string | null,
  to?: string | null
): { from: Date; to: Date } {
  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);

  if (period === 'custom' && from && to) {
    const fromDate = parseISO(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate2 = parseISO(to);
    toDate2.setHours(23, 59, 59, 999);
    return { from: fromDate, to: toDate2 };
  }

  const days = parseInt(period) || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  fromDate.setHours(0, 0, 0, 0);
  return { from: fromDate, to: toDate };
}
