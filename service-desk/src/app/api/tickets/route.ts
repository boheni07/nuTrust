// Design Ref: §4.1 — Ticket CRUD (등록, 목록)
// Plan SC: SC-1 (티켓 등록), FR-10~FR-15

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler } from '@/lib/api-helpers';
import { createTicketSchema } from '@/lib/validations/ticket';
import { getPaginationArgs, buildPaginatedResult } from '@/lib/utils/pagination';
import { generateTicketNumber } from '@/lib/utils/ticketNumber';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = getPaginationArgs({
      page: Number(searchParams.get('page') || 1),
      limit: Number(searchParams.get('limit') || 20),
    });

    const where: Prisma.TicketWhereInput = {};

    // Filters
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (projectId) where.projectId = projectId;
    if (status) where.status = status as Prisma.EnumTicketStatusFilter;
    if (priority) where.priority = priority as Prisma.EnumTicketPriorityFilter;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to + 'T23:59:59Z');
    }

    // Search filter (uses AND to combine with role filter)
    const searchFilter: Prisma.TicketWhereInput[] = [];
    if (search) {
      searchFilter.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { ticketNumber: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Role-based filtering
    const user = session!.user;
    if (user.role === 'CUSTOMER') {
      const contact = await prisma.contact.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (contact) where.requesterId = contact.id;
    } else if (user.role === 'AGENT') {
      const myProjects = await prisma.projectAssignment.findMany({
        where: { agentId: user.id },
        select: { projectId: true },
      });
      const projectIds = myProjects.map(p => p.projectId);
      searchFilter.push({
        OR: [
          { assigneeId: user.id },
          { assigneeId: null, projectId: { in: projectIds } },
        ],
      });
    }

    if (searchFilter.length > 0) {
      where.AND = searchFilter;
    }

    // Sort
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json(buildPaginatedResult(data, total, page, limit));
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['CUSTOMER', 'AGENT']);
    if (error) return error;

    const body = await parseBody(request, createTicketSchema);
    const ticketNumber = await generateTicketNumber();

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          ticketNumber,
          projectId: body.projectId,
          requesterId: body.requesterId,
          registeredById: session!.user.id,
          title: body.title,
          description: body.description,
          category: body.category,
          priority: body.priority,
          channel: body.channel,
          requestedDueDate: body.requestedDueDate,
        },
        include: {
          project: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
        },
      });

      // Record initial status history
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: created.id,
          fromStatus: null,
          toStatus: 'REGISTERED',
          changedBy: session!.user.id,
        },
      });

      // Link attachments if provided
      if (body.attachmentIds.length > 0) {
        await tx.attachment.updateMany({
          where: { id: { in: body.attachmentIds } },
          data: { ticketId: created.id },
        });
      }

      return created;
    });

    return NextResponse.json({ data: ticket }, { status: 201 });
  });
}
