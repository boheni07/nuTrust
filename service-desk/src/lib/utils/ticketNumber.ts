import { format } from 'date-fns';
import { prisma } from '@/lib/db';

/**
 * Generate a unique ticket number in format: SD-YYYYMMDD-NNN
 * e.g., SD-20260407-001
 */
export async function generateTicketNumber(): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  const prefix = `SD-${today}-`;

  const lastTicket = await prisma.ticket.findFirst({
    where: { ticketNumber: { startsWith: prefix } },
    orderBy: { ticketNumber: 'desc' },
    select: { ticketNumber: true },
  });

  let nextNumber = 1;
  if (lastTicket) {
    const lastNumber = parseInt(lastTicket.ticketNumber.split('-').pop() || '0', 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}
