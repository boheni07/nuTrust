// Design Ref: §8.3 — 자동화 규칙 (자동 접수 4근무시간, 지연 자동 전환)
// Plan SC: SC-2 (자동 접수), FR-22, FR-31

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { transitionTicket } from '@/lib/services/ticket-transition';
import { isAcceptanceSLAExpired } from '@/domain/sla';

export async function GET(request: Request) {
  // Simple auth via header for cron security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { autoAccepted: 0, autoDelayed: 0, errors: [] as string[] };

  // 1. Auto-accept: REGISTERED tickets past 4 business hours
  const registeredTickets = await prisma.ticket.findMany({
    where: { status: 'REGISTERED' },
    select: { id: true, createdAt: true, requestedDueDate: true },
  });

  for (const ticket of registeredTickets) {
    if (isAcceptanceSLAExpired(ticket.createdAt)) {
      const result = await transitionTicket(ticket.id, 'AUTO_ACCEPT', 'SYSTEM', {
        plannedDueDate: ticket.requestedDueDate,
      });
      if (result.success) {
        // Also start processing
        await transitionTicket(ticket.id, 'START', 'SYSTEM');
        results.autoAccepted++;
      } else {
        results.errors.push(`Auto-accept failed for ${ticket.id}: ${result.error?.message}`);
      }
    }
  }

  // 2. Auto-delay: IN_PROGRESS tickets past planned due date
  const inProgressTickets = await prisma.ticket.findMany({
    where: {
      status: 'IN_PROGRESS',
      plannedDueDate: { not: null, lt: new Date() },
    },
    select: { id: true },
  });

  for (const ticket of inProgressTickets) {
    const result = await transitionTicket(ticket.id, 'DELAY', 'SYSTEM');
    if (result.success) {
      results.autoDelayed++;
    } else {
      results.errors.push(`Auto-delay failed for ${ticket.id}: ${result.error?.message}`);
    }
  }

  return NextResponse.json({ data: results });
}
