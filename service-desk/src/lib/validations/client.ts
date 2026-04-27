// Design Ref: §4.1 — Organization/Project API validation

import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, '고객사명을 입력해 주세요.').max(100),
  contactEmail: z.string().email('유효한 이메일을 입력해 주세요.'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const createDepartmentSchema = z.object({
  name: z.string().min(1, '부서명을 입력해 주세요.').max(100),
  parentId: z.string().optional(),
});

export const createContactSchema = z.object({
  departmentId: z.string().min(1, '부서를 선택해 주세요.'),
  name: z.string().min(1, '이름을 입력해 주세요.').max(50),
  email: z.string().email('유효한 이메일을 입력해 주세요.'),
  phone: z.string().optional(),
  position: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
