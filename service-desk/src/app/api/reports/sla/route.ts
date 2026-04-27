// Design Ref: §4.1 — SLA 준수율 리포트

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

    const where: Record<string, unknown> = { status: 'CLOSED', plannedDueDate: { not: null } };
    if (projectId) where.projectId = projectId;
    // Plan SC: SC-1 — 날짜 범위 필터
    if (from || to) {
      const closedAtFilter: Record<string, Date> = {};
      if (from) closedAtFilter.gte = new Date(from);
      if (to) closedAtFilter.lte = new Date(to);
      where.closedAt = closedAtFilter;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        priority: true,
        plannedDueDate: true,
        closedAt: true,
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { closedAt: 'desc' },
      take: 200,
    });

    const results = tickets.map((t) => {
      const compliant = t.closedAt && t.plannedDueDate && t.closedAt <= t.plannedDueDate;
      return { ...t, slaCompliant: !!compliant };
    });

    const total = results.length;
    const compliant = results.filter((r) => r.slaCompliant).length;

    return NextResponse.json({
      data: {
        summary: { total, compliant, violated: total - compliant, rate: total > 0 ? Math.round((compliant / total) * 100) : 0 },
        tickets: results,
      },
    });
  });
}
