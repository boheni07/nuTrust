// Design Ref: §4.1 — Project CRUD

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler } from '@/lib/api-helpers';
import { createProjectSchema } from '@/lib/validations/project';
import { getPaginationArgs, buildPaginatedResult } from '@/lib/utils/pagination';

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const { skip, take, page, limit } = getPaginationArgs({
      page: Number(searchParams.get('page') || 1),
      limit: Number(searchParams.get('limit') || 20),
    });

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;

    // CUSTOMER users see only projects they're associated with via contacts
    if (session!.user.role === 'CUSTOMER') {
      const contact = await prisma.contact.findFirst({
        where: { userId: session!.user.id },
        select: { clientId: true },
      });
      if (contact) where.clientId = contact.clientId;
    }

    // AGENT users see only projects they're assigned to
    if (session!.user.role === 'AGENT') {
      where.assignments = { some: { agentId: session!.user.id } };
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          _count: { select: { tickets: true, assignments: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json(buildPaginatedResult(data, total, page, limit));
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const body = await parseBody(request, createProjectSchema);

    const project = await prisma.project.create({
      data: body,
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  });
}
