// Design Ref: §4.2 — Zod validation schemas for ticket API

import { z } from 'zod';

export const createTicketSchema = z.object({
  projectId: z.string().min(1, '프로젝트를 선택해 주세요.'),
  requesterId: z.string().min(1, '요청자를 선택해 주세요.'),
  title: z.string().min(1, '제목을 입력해 주세요.').max(200),
  description: z.string().min(1, '설명을 입력해 주세요.'),
  category: z.string().min(1, '카테고리를 선택해 주세요.'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  channel: z.enum(['ONLINE', 'PHONE', 'EMAIL', 'OTHER']).default('ONLINE'),
  requestedDueDate: z.coerce.date().refine(
    (d) => d > new Date(),
    '처리희망일은 오늘 이후여야 합니다.'
  ),
  attachmentIds: z.array(z.string()).optional().default([]),
});

export const acceptTicketSchema = z.object({
  actionPlan: z.string().min(1, '처리계획을 입력해 주세요.'),
  plannedDueDate: z.coerce.date(),
});

export const postponeTicketSchema = z.object({
  requestedDueDate: z.coerce.date().refine(
    (d) => d > new Date(),
    '연기 요청일은 오늘 이후여야 합니다.'
  ),
  reason: z.string().min(1, '연기 사유를 입력해 주세요.'),
});

export const rejectTicketSchema = z.object({
  reason: z.string().min(1, '반려 사유를 입력해 주세요.'),
});

export const csatSchema = z.object({
  rating: z.number().int().min(1, '1점 이상').max(5, '5점 이하'),
  feedback: z.string().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, '댓글 내용을 입력해 주세요.'),
  type: z.enum(['PUBLIC', 'INTERNAL']).default('PUBLIC'),
  attachmentIds: z.array(z.string()).optional().default([]),
});

export const assignTicketSchema = z.object({
  assigneeId: z.string().min(1, '담당자를 선택해 주세요.'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AcceptTicketInput = z.infer<typeof acceptTicketSchema>;
export type PostponeTicketInput = z.infer<typeof postponeTicketSchema>;
export type RejectTicketInput = z.infer<typeof rejectTicketSchema>;
export type CSATInput = z.infer<typeof csatSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
