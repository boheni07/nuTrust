// Design Ref: §8 Ticket State Machine — server-side transition orchestrator
// Plan SC: SC-1 (상태 머신 전체 흐름), SC-3 (연기 3중 가드)

import { prisma } from '@/lib/db';
import { validateTransition } from '@/domain/ticket-machine';
import type { TicketStatus } from '@prisma/client';

interface TransitionResult {
  success: boolean;
  error?: { code: string; message: string; details?: unknown };
}

/**
 * Execute a ticket state transition with validation, history recording, and side effects.
 */
export async function transitionTicket(
  ticketId: string,
  event: string,
  changedBy: string,
  options?: {
    reason?: string;
    actionPlan?: string;
    plannedDueDate?: Date;
    newDueDate?: Date;
  }
): Promise<TransitionResult> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      status: true,
      postponementCount: true,
      plannedDueDate: true,
      requestedDueDate: true,
      assigneeId: true,
      createdAt: true,
    },
  });

  if (!ticket) {
    return { success: false, error: { code: 'NOT_FOUND', message: '티켓을 찾을 수 없습니다.' } };
  }

  const isDelayed = ticket.status === 'DELAYED';
  const nextStatus = validateTransition(ticket.status, event, {
    postponementCount: ticket.postponementCount,
    isDelayed,
    plannedDueDate: ticket.plannedDueDate,
  });

  if (!nextStatus) {
    return {
      success: false,
      error: {
        code: 'TICKET_INVALID_TRANSITION',
        message: `현재 상태(${ticket.status})에서 ${event} 작업을 수행할 수 없습니다.`,
      },
    };
  }

  // Calculate duration in previous state
  const lastHistory = await prisma.ticketStatusHistory.findFirst({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
  });
  const duration = lastHistory
    ? Math.floor((Date.now() - lastHistory.createdAt.getTime()) / 1000)
    : Math.floor((Date.now() - ticket.createdAt.getTime()) / 1000);

  // Build update data
  const updateData: Record<string, unknown> = {
    status: nextStatus as TicketStatus,
  };

  // Event-specific side effects
  if (event === 'ACCEPT' || event === 'AUTO_ACCEPT') {
    updateData.acceptedAt = new Date();
    updateData.acceptedBy = event === 'AUTO_ACCEPT' ? null : changedBy;
    updateData.isAutoAccepted = event === 'AUTO_ACCEPT';
    updateData.plannedDueDate = options?.plannedDueDate ?? ticket.requestedDueDate;
    if (options?.actionPlan) updateData.actionPlan = options.actionPlan;
    // Auto-assign to the accepting agent if not already assigned
    if (event === 'ACCEPT' && !ticket.assigneeId) {
      updateData.assigneeId = changedBy;
    }
  }

  if (event === 'APPROVE_POSTPONEMENT' && options?.newDueDate) {
    updateData.plannedDueDate = options.newDueDate;
    updateData.postponementCount = ticket.postponementCount + 1;
  }

  if (event === 'REJECT_POSTPONEMENT') {
    updateData.postponementCount = ticket.postponementCount + 1;
  }

  if (event === 'REJECT') {
    // Reset delayed flag on rejection back to IN_PROGRESS
    updateData.status = 'IN_PROGRESS';
  }

  if (nextStatus === 'CLOSED') {
    updateData.closedAt = new Date();
  }

  // Execute in transaction
  await prisma.$transaction([
    prisma.ticket.update({ where: { id: ticketId }, data: updateData }),
    prisma.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: ticket.status,
        toStatus: nextStatus as TicketStatus,
        changedBy: event === 'AUTO_ACCEPT' ? 'SYSTEM' : changedBy,
        reason: options?.reason,
        duration,
      },
    }),
  ]);

  return { success: true };
}
