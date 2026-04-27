// Design Ref: §4.1 — 관리자 대시보드 데이터

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';

export async function GET() {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['MANAGER', 'SYSTEM_ADMIN']);
    if (error) return error;

    const [
      totalActive,
      delayed,
      byStatus,
      recentCSAT,
      agentPerformance,
    ] = await Promise.all([
      prisma.ticket.count({ where: { status: { notIn: ['CLOSED'] } } }),
      prisma.ticket.count({ where: { status: 'DELAYED' } }),
      prisma.ticket.groupBy({ by: ['status'], _count: true }),
      prisma.cSATRating.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
      prisma.user.findMany({
        where: { role: 'AGENT', isActive: true },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              assignedTickets: true,
            },
          },
        },
      }),
    ]);

    // SLA compliance (tickets with plannedDueDate that closed within deadline)
    const closedTickets = await prisma.ticket.findMany({
      where: { status: 'CLOSED', plannedDueDate: { not: null } },
      select: { plannedDueDate: true, closedAt: true },
    });

    const slaCompliant = closedTickets.filter(
      (t) => t.closedAt && t.plannedDueDate && t.closedAt <= t.plannedDueDate
    ).length;
    const slaRate = closedTickets.length > 0 ? Math.round((slaCompliant / closedTickets.length) * 100) : 0;

    // Approval rate
    const approvedFirst = await prisma.ticket.count({ where: { status: 'CLOSED' } });
    const rejected = await prisma.ticketStatusHistory.count({ where: { toStatus: 'REJECTED' } });
    const approvalRate = approvedFirst + rejected > 0
      ? Math.round((approvedFirst / (approvedFirst + rejected)) * 100)
      : 0;

    // M-7: 프로젝트별 요약
    const projectSummary = await prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, name: true,
        client: { select: { name: true } },
        _count: { select: { tickets: true } },
        tickets: {
          where: { status: { notIn: ['CLOSED'] } },
          select: { status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const projectStats = projectSummary.map((p) => ({
      id: p.id,
      name: p.name,
      clientName: p.client.name,
      totalTickets: p._count.tickets,
      activeTickets: p.tickets.length,
      delayed: p.tickets.filter((t) => t.status === 'DELAYED').length,
    }));

    return NextResponse.json({
      data: {
        totalActive,
        delayed,
        slaRate,
        approvalRate,
        csatAverage: recentCSAT._avg.rating ?? 0,
        csatCount: recentCSAT._count.rating,
        statusDistribution: byStatus.map((s) => ({ status: s.status, count: s._count })),
        projectStats,
        agentPerformance: agentPerformance.map((a) => ({
          id: a.id,
          name: a.name,
          assignedCount: a._count.assignedTickets,
        })),
      },
    });
  });
}
