import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, parseBody, withErrorHandler } from '@/lib/api-helpers';
import { createDepartmentSchema } from '@/lib/validations/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth();
    if (error) return error;

    const { id: clientId } = await params;
    const departments = await prisma.department.findMany({
      where: { clientId },
      include: { children: true, _count: { select: { contacts: true } } },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: departments });
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN', 'MANAGER']);
    if (error) return error;

    const { id: clientId } = await params;
    const body = await parseBody(request, createDepartmentSchema);

    const department = await prisma.department.create({
      data: { ...body, clientId },
    });

    return NextResponse.json({ data: department }, { status: 201 });
  });
}
