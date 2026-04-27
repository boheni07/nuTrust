import { z } from 'zod';

export const createProjectSchema = z.object({
  clientId: z.string().min(1, '고객사를 선택해 주세요.'),
  name: z.string().min(1, '프로젝트명을 입력해 주세요.').max(200),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ clientId: true }).extend({
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createAssignmentSchema = z.object({
  agentId: z.string().min(1, '담당자를 선택해 주세요.'),
  role: z.enum(['LEAD', 'MEMBER']).default('MEMBER'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
