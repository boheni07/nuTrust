import { NextResponse } from 'next/server';
import { requireAuth, withErrorHandler, errorResponse } from '@/lib/api-helpers';
import { transitionTicket } from '@/lib/services/ticket-transition';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { error, session } = await requireAuth(['AGENT', 'MANAGER']);
    if (error) return error;

    const { id } = await params;
    const result = await transitionTicket(id, 'START', session!.user.id);

    if (!result.success) {
      return errorResponse(result.error!.code, result.error!.message, 400);
    }

    return NextResponse.json({ data: { success: true } });
  });
}
