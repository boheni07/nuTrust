// Design Ref: §3.1 — 신규 분석 집계 API
// Plan SC: SC-1 (날짜 필터), SC-2 (일별 트렌드), SC-3 (SLA 추이), SC-4 (카테고리 지연), SC-5 (KPI)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';
import {
  getDateRange,
  aggregateByDay,
  aggregateWeeklySLA,
  aggregateCategoryDelay,
  type TicketRaw,
} from '@/lib/utils/dateAggregation';

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['MANAGER', 'SYSTEM_ADMIN']);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? '30';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const projectId = searchParams.get('projectId');

    const { from, to } = getDateRange(period, fromParam, toParam);

    const where: Record<string, unknown> = {
      createdAt: { gte: from, lte: to },
    };
    if (projectId) where.projectId = projectId;

    // 기간 내 생성 티켓 전체 조회 (집계용)
    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        createdAt: true,
        closedAt: true,
        status: true,
        category: true,
        plannedDueDate: true,
      },
      take: 2000, // 성능 상한
    });

    const rawTickets: TicketRaw[] = tickets.map((t) => ({
      createdAt: t.createdAt,
      closedAt: t.closedAt,
      status: t.status,
      category: t.category,
      plannedDueDate: t.plannedDueDate,
    }));

    // 집계
    const dailyTickets = aggregateByDay(rawTickets, from, to);
    const weeklySLA = aggregateWeeklySLA(rawTickets);
    const categoryDelay = aggregateCategoryDelay(rawTickets);

    // KPI Summary
    const totalTickets = tickets.length;
    const closedTickets = tickets.filter((t) => t.closedAt && t.plannedDueDate);
    const compliantCount = closedTickets.filter(
      (t) => t.closedAt! <= t.plannedDueDate!
    ).length;
    const slaRate =
      closedTickets.length > 0
        ? Math.round((compliantCount / closedTickets.length) * 100)
        : 0;

    // 평균 해결 시간 (시간 단위)
    const resolvedTickets = tickets.filter((t) => t.closedAt);
    const avgResolutionHours =
      resolvedTickets.length > 0
        ? Math.round(
            resolvedTickets.reduce((sum, t) => {
              const hours =
                (t.closedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }, 0) / resolvedTickets.length
          )
        : 0;

    // CSAT 평균 (기간 내)
    const csatWhere: Record<string, unknown> = {
      createdAt: { gte: from, lte: to },
    };
    if (projectId) csatWhere.ticket = { projectId };
    const csatAgg = await prisma.cSATRating.aggregate({
      where: csatWhere,
      _avg: { rating: true },
    });
    const csatAverage = parseFloat(
      (csatAgg._avg.rating ?? 0).toFixed(1)
    );

    return NextResponse.json({
      data: {
        dailyTickets,
        weeklySLA,
        categoryDelay,
        summary: {
          totalTickets,
          slaRate,
          csatAverage,
          avgResolutionHours,
        },
      },
    });
  });
}
