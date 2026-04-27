// Design Ref: §4.1 — CSAT 통계 (프로젝트별/기간별)
// Plan FR-51

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['MANAGER', 'SYSTEM_ADMIN']);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Record<string, unknown> = {};
    if (projectId) where.ticket = { projectId };
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [ratings, aggregate] = await Promise.all([
      prisma.cSATRating.findMany({
        where,
        include: {
          ticket: {
            select: { ticketNumber: true, title: true, projectId: true, assigneeId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.cSATRating.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
        _min: { rating: true },
        _max: { rating: true },
      }),
    ]);

    // Distribution
    const distribution = [1, 2, 3, 4, 5].map((score) => ({
      score,
      count: ratings.filter((r) => r.rating === score).length,
    }));

    return NextResponse.json({
      data: {
        summary: {
          average: aggregate._avg.rating ?? 0,
          total: aggregate._count.rating,
          min: aggregate._min.rating,
          max: aggregate._max.rating,
          distribution,
        },
        ratings,
      },
    });
  });
}
