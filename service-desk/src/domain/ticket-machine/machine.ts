// Design Ref: §8 Ticket State Machine — XState 5 implementation
// Plan SC: SC-1 (티켓 상태 머신 전체 흐름 동작)

import { setup, assign } from 'xstate';
import type { TicketContext } from './types';

export const ticketMachine = setup({
  types: {
    context: {} as TicketContext,
    events: {} as
      | { type: 'ACCEPT'; actionPlan: string; plannedDueDate: Date; acceptedBy: string }
      | { type: 'AUTO_ACCEPT'; plannedDueDate: Date }
      | { type: 'START' }
      | { type: 'DELAY' }
      | { type: 'REQUEST_COMPLETION' }
      | { type: 'REQUEST_POSTPONEMENT'; requestedDueDate: Date; reason: string }
      | { type: 'APPROVE' }
      | { type: 'REJECT'; reason: string }
      | { type: 'APPROVE_POSTPONEMENT'; newDueDate: Date }
      | { type: 'REJECT_POSTPONEMENT' }
      | { type: 'SUBMIT_CSAT' },
  },
  guards: {
    canPostpone: ({ context }) => {
      return (
        context.postponementCount < 1 &&
        !context.isDelayed &&
        context.plannedDueDate !== null &&
        new Date() < context.plannedDueDate
      );
    },
  },
}).createMachine({
  id: 'ticket',
  initial: 'REGISTERED',
  context: {
    ticketId: '',
    status: 'REGISTERED' as const,
    postponementCount: 0,
    plannedDueDate: null,
    isDelayed: false,
  },

  states: {
    REGISTERED: {
      on: {
        ACCEPT: {
          target: 'ACCEPTED',
          actions: assign({
            status: () => 'ACCEPTED' as const,
            plannedDueDate: ({ event }) => event.plannedDueDate,
          }),
        },
        AUTO_ACCEPT: {
          target: 'ACCEPTED',
          actions: assign({
            status: () => 'ACCEPTED' as const,
            plannedDueDate: ({ event }) => event.plannedDueDate,
          }),
        },
      },
    },

    ACCEPTED: {
      on: {
        START: {
          target: 'IN_PROGRESS',
          actions: assign({ status: () => 'IN_PROGRESS' as const }),
        },
      },
    },

    IN_PROGRESS: {
      on: {
        DELAY: {
          target: 'DELAYED',
          actions: assign({
            status: () => 'DELAYED' as const,
            isDelayed: () => true,
          }),
        },
        REQUEST_COMPLETION: {
          target: 'COMPLETION_REQUESTED',
          actions: assign({ status: () => 'COMPLETION_REQUESTED' as const }),
        },
        REQUEST_POSTPONEMENT: {
          target: 'POSTPONEMENT_REQUESTED',
          guard: 'canPostpone',
          actions: assign({
            status: () => 'POSTPONEMENT_REQUESTED' as const,
          }),
        },
      },
    },

    DELAYED: {
      on: {
        REQUEST_COMPLETION: {
          target: 'COMPLETION_REQUESTED',
          actions: assign({ status: () => 'COMPLETION_REQUESTED' as const }),
        },
        // No REQUEST_POSTPONEMENT — 지연중 연기요청 불가
      },
    },

    COMPLETION_REQUESTED: {
      on: {
        APPROVE: {
          target: 'APPROVED',
          actions: assign({ status: () => 'APPROVED' as const }),
        },
        REJECT: {
          target: 'IN_PROGRESS',
          actions: assign({
            status: () => 'IN_PROGRESS' as const,
            isDelayed: () => false,
          }),
        },
      },
    },

    POSTPONEMENT_REQUESTED: {
      on: {
        APPROVE_POSTPONEMENT: {
          target: 'IN_PROGRESS',
          actions: assign({
            status: () => 'IN_PROGRESS' as const,
            postponementCount: ({ context }) => context.postponementCount + 1,
            plannedDueDate: ({ event }) => event.newDueDate,
            isDelayed: () => false,
          }),
        },
        REJECT_POSTPONEMENT: {
          target: 'IN_PROGRESS',
          actions: assign({
            status: () => 'IN_PROGRESS' as const,
            postponementCount: ({ context }) => context.postponementCount + 1,
          }),
        },
      },
    },

    APPROVED: {
      on: {
        SUBMIT_CSAT: {
          target: 'CLOSED',
          actions: assign({ status: () => 'CLOSED' as const }),
        },
      },
    },

    CLOSED: {
      type: 'final',
    },
  },
});

/**
 * Validate a state transition without XState (for server-side use).
 * Returns the next status or null if transition is invalid.
 */
export function validateTransition(
  currentStatus: string,
  event: string,
  context: Pick<TicketContext, 'postponementCount' | 'isDelayed' | 'plannedDueDate'>
): string | null {
  const transitions: Record<string, Record<string, string | ((ctx: typeof context) => string | null)>> = {
    REGISTERED: {
      ACCEPT: 'ACCEPTED',
      AUTO_ACCEPT: 'ACCEPTED',
    },
    ACCEPTED: {
      START: 'IN_PROGRESS',
    },
    IN_PROGRESS: {
      DELAY: 'DELAYED',
      REQUEST_COMPLETION: 'COMPLETION_REQUESTED',
      REQUEST_POSTPONEMENT: (ctx) => {
        if (ctx.postponementCount >= 1) return null;
        if (ctx.isDelayed) return null;
        if (!ctx.plannedDueDate || new Date() >= ctx.plannedDueDate) return null;
        return 'POSTPONEMENT_REQUESTED';
      },
    },
    DELAYED: {
      REQUEST_COMPLETION: 'COMPLETION_REQUESTED',
    },
    COMPLETION_REQUESTED: {
      APPROVE: 'APPROVED',
      REJECT: 'IN_PROGRESS',
    },
    POSTPONEMENT_REQUESTED: {
      APPROVE_POSTPONEMENT: 'IN_PROGRESS',
      REJECT_POSTPONEMENT: 'IN_PROGRESS',
    },
    APPROVED: {
      SUBMIT_CSAT: 'CLOSED',
    },
  };

  const stateTransitions = transitions[currentStatus];
  if (!stateTransitions) return null;

  const transition = stateTransitions[event];
  if (!transition) return null;

  if (typeof transition === 'function') {
    return transition(context);
  }

  return transition;
}
