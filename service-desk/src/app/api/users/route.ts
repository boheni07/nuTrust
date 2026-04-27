import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getPaginationArgs, buildPaginatedResult } from '@/lib/utils/pagination';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  role: z.enum(['SYSTEM_ADMIN', 'MANAGER', 'AGENT', 'CUSTOMER']),
  teamId: z.string().optional(),
});

export async function GET(request: Request) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN']);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const { skip, take, page, limit } = getPaginationArgs({
      page: Number(searchParams.get('page') || 1),
      limit: Number(searchParams.get('limit') || 20),
    });

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        skip, take,
        select: { id: true, email: true, name: true, role: true, isActive: true, team: { select: { name: true } }, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json(buildPaginatedResult(data, total, page, limit));
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN']);
    if (error) return error;

    const body = createUserSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        role: body.role,
        teamId: body.teamId,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  });
}
