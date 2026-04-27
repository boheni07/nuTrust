// Design Ref: §8 Ticket State Machine — 9 states, 3-guard postponement

export const TICKET_STATES = {
  REGISTERED: 'REGISTERED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  DELAYED: 'DELAYED',
  COMPLETION_REQUESTED: 'COMPLETION_REQUESTED',
  POSTPONEMENT_REQUESTED: 'POSTPONEMENT_REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED',
} as const;

export type TicketState = (typeof TICKET_STATES)[keyof typeof TICKET_STATES];

export const TICKET_EVENTS = {
  ACCEPT: 'ACCEPT',
  AUTO_ACCEPT: 'AUTO_ACCEPT',
  START: 'START',
  DELAY: 'DELAY',
  REQUEST_COMPLETION: 'REQUEST_COMPLETION',
  REQUEST_POSTPONEMENT: 'REQUEST_POSTPONEMENT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  APPROVE_POSTPONEMENT: 'APPROVE_POSTPONEMENT',
  REJECT_POSTPONEMENT: 'REJECT_POSTPONEMENT',
  SUBMIT_CSAT: 'SUBMIT_CSAT',
} as const;

export type TicketEvent = (typeof TICKET_EVENTS)[keyof typeof TICKET_EVENTS];

export interface TicketContext {
  ticketId: string;
  status: TicketState;
  postponementCount: number;
  plannedDueDate: Date | null;
  isDelayed: boolean;
}

export interface AcceptPayload {
  actionPlan: string;
  plannedDueDate: Date;
  acceptedBy: string;
}

export interface PostponementPayload {
  requestedDueDate: Date;
  reason: string;
  requestedBy: string;
}

export interface RejectPayload {
  reason: string;
  respondedBy: string;
}

export interface CSATPayload {
  rating: number;
  feedback?: string;
  ratedBy: string;
}

// Status display labels (Korean)
export const STATUS_LABELS: Record<TicketState, string> = {
  REGISTERED: '등록',
  ACCEPTED: '접수',
  IN_PROGRESS: '처리중',
  DELAYED: '지연중',
  COMPLETION_REQUESTED: '완료요청',
  POSTPONEMENT_REQUESTED: '연기요청',
  APPROVED: '승인',
  REJECTED: '반려',
  CLOSED: '완료',
};
