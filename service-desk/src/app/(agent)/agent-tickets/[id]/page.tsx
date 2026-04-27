import { AgentTicketDetail } from '@/features/tickets/components/AgentTicketDetail';

export default async function AgentTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgentTicketDetail ticketId={id} />;
}
