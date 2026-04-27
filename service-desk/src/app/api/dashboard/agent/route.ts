import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';

export async function GET() {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['AGENT']);
    if (error) return error;

    const userId = session!.user.id;

    // My project IDs
    const myProjects = await prisma.projectAssignment.findMany({
      where: { agentId: userId },
      select: { projectId: true },
    });
    const projectIds = myProjects.map(p => p.projectId);

    // Counts
    const [assigned, registered, inProgress, delayed, completionReq, todayClosed] = await Promise.all([
      prisma.ticket.count({ where: { assigneeId: userId, status: { notIn: ['CLOSED'] } } }),
      prisma.ticket.count({ where: { OR: [{ assigneeId: userId }, { assigneeId: null, projectId: { in: projectIds } }], status: 'REGISTERED' } }),
      prisma.ticket.count({ where: { assigneeId: userId, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { assigneeId: userId, status: 'DELAYED' } }),
      prisma.ticket.count({ where: { assigneeId: userId, status: 'COMPLETION_REQUESTED' } }),
      prisma.ticket.count({
        where: {
          assigneeId: userId,
          status: 'CLOSED',
          closedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    // Urgent tickets (SLA soon or overdue)
    const urgentTickets = await prisma.ticket.findMany({
      where: {
        assigneeId: userId,
        status: { in: ['IN_PROGRESS', 'DELAYED'] },
        plannedDueDate: { not: null },
      },
      select: {
        id: true, ticketNumber: true, title: true, status: true, priority: true,
        plannedDueDate: true, requestedDueDate: true,
        requester: { select: { name: true } },
      },
      orderBy: { plannedDueDate: 'asc' },
      take: 5,
    });

    // Recent activity
    const recentHistory = await prisma.ticketStatusHistory.findMany({
      where: { ticket: { assigneeId: userId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { ticket: { select: { ticketNumber: true, title: true } } },
    });

    return NextResponse.json({
      data: {
        counts: { assigned, registered, inProgress, delayed, completionReq, todayClosed },
        urgentTickets,
        recentHistory,
      },
    });
  });
}
