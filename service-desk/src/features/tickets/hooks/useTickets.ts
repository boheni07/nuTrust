'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TicketFilters {
  projectId?: string;
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchTickets(filters: TicketFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') params.set(k, String(v));
  });
  const res = await fetch(`/api/tickets?${params}`);
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

async function fetchTicketDetail(id: string) {
  const res = await fetch(`/api/tickets/${id}`);
  if (!res.ok) throw new Error('Failed to fetch ticket');
  return res.json();
}

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => fetchTickets(filters),
  });
}

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicketDetail(id),
    enabled: !!id,
  });
}

export function useTicketAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, action, body }: { ticketId: string; action: string; body?: unknown }) => {
      const res = await fetch(`/api/tickets/${ticketId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Action failed');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
