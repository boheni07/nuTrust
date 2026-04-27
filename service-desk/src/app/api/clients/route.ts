// Design Ref: §4.1 — Client CRUD (MANAGER, ADMIN only)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler } from '@/lib/api-helpers';
import { createClientSchema } from '@/lib/validations/client';
import { getPaginationArgs, buildPaginatedResult } from '@/lib/utils/pagination';

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = getPaginationArgs({
      page: Number(searchParams.get('page') || 1),
      limit: Number(searchParams.get('limit') || 20),
    });

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { projects: true, contacts: true } } },
      }),
      prisma.client.count(),
    ]);

    return NextResponse.json(buildPaginatedResult(data, total, page, limit));
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const body = await parseBody(request, createClientSchema);

    const client = await prisma.client.create({ data: body });

    return NextResponse.json({ data: client }, { status: 201 });
  });
}
