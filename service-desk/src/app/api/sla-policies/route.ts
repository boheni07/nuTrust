import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, withErrorHandler } from '@/lib/api-helpers';
import { z } from 'zod';

const createSLASchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  acceptanceHours: z.number().int().positive().default(4),
  resolutionHours: z.number().int().positive(),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['MANAGER', 'SYSTEM_ADMIN']);
    if (error) return error;

    const policies = await prisma.sLAPolicy.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ data: policies });
  });
}

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    const { error } = await requireAuth(['SYSTEM_ADMIN']);
    if (error) return error;

    const body = createSLASchema.parse(await request.json());
    const policy = await prisma.sLAPolicy.create({ data: body });
    return NextResponse.json({ data: policy }, { status: 201 });
  });
}
