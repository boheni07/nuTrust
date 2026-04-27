import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['SYSTEM_ADMIN', 'MANAGER', 'AGENT', 'CUSTOMER']).optional(),
  teamId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN']);
    if (error) return error;

    const { id } = await params;
    const body = updateUserSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id },
      data: body,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    return NextResponse.json({ data: user });
  });
}
