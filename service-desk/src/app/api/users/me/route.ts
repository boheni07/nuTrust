import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').optional(),
  email: z.string().email().optional(),
});

export async function GET() {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth();
    if (error) return error;

    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: {
        id: true, email: true, name: true, role: true, isActive: true, createdAt: true,
        team: { select: { id: true, name: true } },
        contactProfile: { select: { id: true, name: true, phone: true, position: true, department: { select: { name: true } }, client: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ data: user });
  });
}

export async function PUT(request: Request) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth();
    if (error) return error;

    const body = updateProfileSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id: session!.user.id },
      data: body,
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ data: user });
  });
}
