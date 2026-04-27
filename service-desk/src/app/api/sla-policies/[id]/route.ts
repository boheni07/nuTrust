import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { z } from 'zod';

const updateSLASchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).nullable().optional(),
  acceptanceHours: z.number().int().positive().optional(),
  resolutionHours: z.number().int().positive().optional(),
  isDefault: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN']);
    if (error) return error;

    const { id } = await params;
    const body = updateSLASchema.parse(await request.json());

    const policy = await prisma.sLAPolicy.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ data: policy });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN']);
    if (error) return error;

    const { id } = await params;
    const policy = await prisma.sLAPolicy.findUnique({ where: { id }, select: { isDefault: true } });
    if (!policy) return errorResponse('NOT_FOUND', 'SLA 정책을 찾을 수 없습니다.', 404);
    if (policy.isDefault) return errorResponse('DEFAULT_POLICY', '기본 정책은 삭제할 수 없습니다.', 409);

    await prisma.sLAPolicy.delete({ where: { id } });
    return NextResponse.json({ data: { success: true } });
  });
}
