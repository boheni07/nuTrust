export { ticketMachine, validateTransition } from './machine';
export { canRequestPostponement, canRequestCompletion, canAccept, canApproveOrReject, canRespondToPostponement, getPostponementRejectionReason } from './guards';
export { TICKET_STATES, TICKET_EVENTS, STATUS_LABELS } from './types';
export type { TicketContext, TicketState, TicketEvent, AcceptPayload, PostponementPayload, RejectPayload, CSATPayload } from './types';
