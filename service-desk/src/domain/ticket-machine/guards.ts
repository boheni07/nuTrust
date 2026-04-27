// Design Ref: §8.2 State Transition Rules — 3-guard postponement validation
// Plan SC: SC-3 (연기요청 1회 제한 + 조건 검증)

import type { TicketContext } from './types';

const MAX_POSTPONEMENT = 1;

/**
 * Guard: 연기요청 가능 여부 (3중 검증)
 * 1. postponementCount < 1 (1회 제한)
 * 2. status !== DELAYED (지연중 불가)
 * 3. now < plannedDueDate (완료예정일 전에만)
 */
export function canRequestPostponement(context: TicketContext): boolean {
  if (context.postponementCount >= MAX_POSTPONEMENT) {
    return false;
  }
  if (context.isDelayed) {
    return false;
  }
  if (!context.plannedDueDate || new Date() >= context.plannedDueDate) {
    return false;
  }
  return true;
}

/**
 * Guard: 완료요청 가능 여부
 * - IN_PROGRESS 또는 DELAYED 상태에서만 가능
 */
export function canRequestCompletion(context: TicketContext): boolean {
  return (
    context.status === 'IN_PROGRESS' || context.status === 'DELAYED'
  );
}

/**
 * Guard: 접수 가능 여부
 * - REGISTERED 상태에서만 가능
 */
export function canAccept(context: TicketContext): boolean {
  return context.status === 'REGISTERED';
}

/**
 * Guard: 승인/반려 가능 여부
 * - COMPLETION_REQUESTED 상태에서만 가능
 */
export function canApproveOrReject(context: TicketContext): boolean {
  return context.status === 'COMPLETION_REQUESTED';
}

/**
 * Guard: 연기 승인/반려 가능 여부
 * - POSTPONEMENT_REQUESTED 상태에서만 가능
 */
export function canRespondToPostponement(context: TicketContext): boolean {
  return context.status === 'POSTPONEMENT_REQUESTED';
}

/**
 * Get detailed reason for postponement rejection
 */
export function getPostponementRejectionReason(context: TicketContext): string {
  if (context.postponementCount >= MAX_POSTPONEMENT) {
    return '연기 요청은 1회만 가능합니다.';
  }
  if (context.isDelayed) {
    return '지연 상태에서는 연기 요청이 불가합니다.';
  }
  if (!context.plannedDueDate || new Date() >= context.plannedDueDate) {
    return '완료예정일이 지난 후에는 연기 요청이 불가합니다.';
  }
  return '';
}
