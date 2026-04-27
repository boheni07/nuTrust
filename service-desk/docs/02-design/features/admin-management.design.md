# Design: 관리자 CRUD 관리 기능 (admin-management)

**Feature**: admin-management  
**Phase**: Design  
**Date**: 2026-04-08  
**Architecture**: Option C — Pragmatic Balance  

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 서비스 운영 시 고객사·프로젝트 데이터를 UI에서 관리할 수 없어 운영 불가 |
| **WHO** | SYSTEM_ADMIN, MANAGER — 고객사·프로젝트 관리 권한 보유 |
| **RISK** | 삭제 시 연결 티켓 cascade 문제 / 복잡한 탭 모달 UX 일관성 |
| **SUCCESS** | 고객사·프로젝트 CRUD 모달 완동, 하위 자원 탭 동작, 삭제 차단 메시지 |
| **SCOPE** | UI 계층 + DELETE API 추가 — 기존 GET/POST/PUT API는 완성 |

---

## 1. Overview

### 1.1 아키텍처 결정 (Option C)

- **공통 UI 컴포넌트** 2개 신규 생성: `Modal.tsx`, `ConfirmDialog.tsx`
- **고객사·프로젝트**: 기존 컴포넌트 파일 확장 (모달 + 탭 포함)
- **팀·사용자·SLA**: 기존 page 파일에 수정/삭제 기능 추가
- **DELETE API**: 기존 route.ts 확장 또는 신규 `[id]/route.ts` 추가

### 1.2 기술 스택 (기존과 동일)
- React 18 + Next.js 14 App Router
- TanStack Query (React Query) — 뮤테이션·캐시 무효화
- Tailwind CSS — 기존 디자인 시스템 유지
- Prisma 6 — DB 연산

---

## 2. 컴포넌트 구조

```
src/
├── components/ui/
│   ├── Modal.tsx              [신규] 공통 모달 래퍼
│   └── ConfirmDialog.tsx      [신규] 삭제 확인 다이얼로그
│
├── features/clients/components/
│   └── ClientList.tsx         [확장] 등록/수정/삭제 모달 + 부서/담당자 탭
│
├── features/projects/components/
│   └── ProjectList.tsx        [확장] 등록/수정/삭제 모달 + 에이전트 배정 탭
│
└── app/(admin)/
    ├── admin-teams/page.tsx   [확장] 수정/삭제 + 팀원 배정/해제
    ├── admin-users/page.tsx   [확장] 수정(이름/역할/팀)
    └── admin-sla/page.tsx     [확장] 수정/삭제
```

---

## 3. API 변경사항

### 3.1 신규 DELETE 라우트

| 파일 | 메서드 | 경로 | 설명 |
|------|--------|------|------|
| `api/clients/[id]/route.ts` | +DELETE | `/api/clients/:id` | 고객사 삭제 (티켓 있으면 409) |
| `api/projects/[id]/route.ts` | +DELETE | `/api/projects/:id` | 프로젝트 삭제 (티켓 있으면 409) |
| `api/clients/[id]/departments/[deptId]/route.ts` | 신규 DELETE | `/api/clients/:id/departments/:deptId` | 부서 삭제 |
| `api/clients/[id]/contacts/[contactId]/route.ts` | 신규 DELETE | `/api/clients/:id/contacts/:contactId` | 담당자 삭제 |
| `api/teams/[id]/route.ts` | 신규 PUT+DELETE | `/api/teams/:id` | 팀 수정/삭제 |
| `api/sla-policies/[id]/route.ts` | +DELETE | `/api/sla-policies/:id` | SLA 삭제 (기본 정책 차단) |

### 3.2 삭제 비즈니스 로직

**고객사 삭제 차단 조건:**
```typescript
// 프로젝트가 있으면 삭제 차단
const projectCount = await prisma.project.count({ where: { clientId: id } });
if (projectCount > 0) return errorResponse('HAS_PROJECTS', '..', 409);
```

**프로젝트 삭제 차단 조건:**
```typescript
// 티켓이 있으면 삭제 차단
const ticketCount = await prisma.ticket.count({ where: { projectId: id } });
if (ticketCount > 0) return errorResponse('HAS_TICKETS', '..', 409);
```

**SLA 삭제 차단 조건:**
```typescript
// 기본 정책은 삭제 차단
if (policy.isDefault) return errorResponse('DEFAULT_POLICY', '기본 정책은 삭제할 수 없습니다.', 409);
```

**부서 삭제 차단 조건:**
```typescript
// 담당자가 있으면 삭제 차단
const contactCount = await prisma.contact.count({ where: { departmentId: deptId } });
if (contactCount > 0) return errorResponse('HAS_CONTACTS', '담당자가 있는 부서는 삭제할 수 없습니다.', 409);
```

---

## 4. 공통 UI 컴포넌트 설계

### 4.1 Modal.tsx
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';  // default: 'md'
}
// 배경 클릭 닫기, ESC 키 닫기
// size: sm=max-w-sm, md=max-w-md, lg=max-w-2xl
```

### 4.2 ConfirmDialog.tsx
```tsx
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;  // default: '삭제'
  isLoading?: boolean;
}
// 확인 버튼: variant="danger"
// 취소 버튼: variant="secondary"
```

---

## 5. 고객사 관리 (ClientList.tsx) 상세 설계

### 5.1 상태 구조
```typescript
type ModalMode = 'create' | 'edit' | null;
type ActiveTab = 'info' | 'departments' | 'contacts';

const [modalMode, setModalMode] = useState<ModalMode>(null);
const [selectedClient, setSelectedClient] = useState<Client | null>(null);
const [activeTab, setActiveTab] = useState<ActiveTab>('info');
const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
```

### 5.2 모달 탭 구조
```
[기본 정보 탭]
  - 고객사명 (필수)
  - 이메일 (필수)
  - 전화번호 (선택)
  - 주소 (선택)
  - 저장 버튼

[부서 탭] (수정 모달에서만)
  - 부서 목록 (이름, 담당자 수)
  - 부서 추가 인라인 폼 (이름 입력)
  - 부서별 삭제 버튼 (담당자 있으면 비활성)

[담당자 탭] (수정 모달에서만)
  - 담당자 목록 (이름, 이메일, 부서, 직책)
  - 담당자 추가 인라인 폼
  - 담당자별 삭제 버튼
```

### 5.3 목록 테이블 행 액션
```
[고객사명] [이메일] [프로젝트 수] [담당자 수] [수정 버튼] [삭제 버튼]
```

### 5.4 React Query 패턴
```typescript
// 고객사 상세 (탭 오픈 시 fetch)
const { data: clientDetail } = useQuery({
  queryKey: ['client-detail', selectedClient?.id],
  queryFn: () => fetch(`/api/clients/${selectedClient.id}`).then(r => r.json()),
  enabled: !!selectedClient && modalMode === 'edit',
});
```

---

## 6. 프로젝트 관리 (ProjectList.tsx) 상세 설계

### 6.1 상태 구조
```typescript
type ModalMode = 'create' | 'edit' | null;
type ActiveTab = 'info' | 'assignments';

const [modalMode, setModalMode] = useState<ModalMode>(null);
const [selectedProject, setSelectedProject] = useState<Project | null>(null);
const [activeTab, setActiveTab] = useState<ActiveTab>('info');
const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
```

### 6.2 모달 탭 구조
```
[기본 정보 탭]
  - 프로젝트명 (필수)
  - 고객사 드롭다운 (필수, /api/clients에서 로드)
  - 설명 (선택)
  - 시작일 / 종료일
  - 상태: ACTIVE / ON_HOLD / COMPLETED / CANCELLED
  - 저장 버튼

[담당 에이전트 탭] (수정 모달에서만)
  - 현재 배정된 에이전트 목록 + 해제 버튼
  - 에이전트 추가: 드롭다운 (/api/users?role=AGENT,MANAGER)
  - 배정 버튼 → POST /api/projects/:id/assignments
  - 해제 버튼 → DELETE /api/projects/:id/assignments/:agentId
```

### 6.3 목록 테이블 변경
```
[프로젝트명] [고객사] [상태 배지] [티켓 수] [담당자 수] [수정] [삭제]
```

---

## 7. 팀 관리 (AdminTeamsPage.tsx) 상세 설계

### 7.1 추가 기능
- 팀 카드에 **수정** 버튼 (팀명 수정 모달)
- 팀 카드에 **삭제** 버튼 (멤버 없을 때만 활성)
- 팀 카드 멤버 항목에 **X 버튼** (팀에서 제거: PUT /api/users/:id {teamId: null})
- 팀 카드에 **멤버 추가** 버튼 → 사용자 선택 드롭다운 (AGENT/MANAGER)

### 7.2 API
```typescript
// 팀 수정
PUT /api/teams/:id { name: string }

// 팀 삭제 (멤버 없을 때)
DELETE /api/teams/:id

// 멤버 추가 (팀 배정)
PUT /api/users/:id { teamId: string }

// 멤버 제거 (팀 해제)
PUT /api/users/:id { teamId: null }
```

---

## 8. 사용자 관리 (AdminUsersPage.tsx) 상세 설계

### 8.1 추가 기능
- 행 수정 버튼 → 수정 모달
  - 이름 수정
  - 역할 변경 (CUSTOMER/AGENT/MANAGER/SYSTEM_ADMIN)
  - 팀 배정 변경 (AGENT/MANAGER인 경우)

### 8.2 API
```typescript
PUT /api/users/:id { name, role, teamId }
```

---

## 9. SLA 정책 관리 (AdminSLAPage.tsx) 상세 설계

### 9.1 추가 기능
- 행 수정 버튼 → 수정 모달 (기존 생성 폼과 동일 필드)
- 행 삭제 버튼 (기본 정책은 비활성)

### 9.2 API
```typescript
PUT /api/sla-policies/:id { name, category, priority, acceptanceHours, resolutionHours, isDefault }
DELETE /api/sla-policies/:id  // isDefault=true 차단
```

---

## 10. 에러 처리 패턴

```typescript
// 409 Conflict 에러 처리 (삭제 차단)
const deleteClient = useMutation({
  mutationFn: async (id: string) => {
    const r = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error?.message || '삭제 실패');
    }
    return r.json();
  },
  onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setDeleteTarget(null); },
  onError: (err: Error) => alert(err.message),  // 차단 메시지 표시
});
```

---

## 11. Implementation Guide

### 11.1 구현 순서 (의존성 기반)

1. **공통 컴포넌트** → 모든 모달이 의존
2. **API DELETE 라우트** → UI가 의존
3. **고객사 CRUD UI** (P1)
4. **프로젝트 CRUD UI** (P1)
5. **팀 수정/삭제/멤버 관리** (P2)
6. **사용자 수정** (P2)
7. **SLA 수정/삭제** (P3)

### 11.2 파일별 변경 목록

**신규 생성 (4파일):**
| 파일 | 목적 |
|------|------|
| `src/components/ui/Modal.tsx` | 공통 모달 래퍼 |
| `src/components/ui/ConfirmDialog.tsx` | 삭제 확인 다이얼로그 |
| `src/app/api/clients/[id]/departments/[deptId]/route.ts` | 부서 DELETE |
| `src/app/api/clients/[id]/contacts/[contactId]/route.ts` | 담당자 DELETE |
| `src/app/api/teams/[id]/route.ts` | 팀 PUT/DELETE |

**확장 (기존 파일 수정, 6파일):**
| 파일 | 변경 내용 |
|------|-----------|
| `src/app/api/clients/[id]/route.ts` | +DELETE 함수 |
| `src/app/api/projects/[id]/route.ts` | +DELETE 함수 |
| `src/app/api/sla-policies/[id]/route.ts` | +DELETE 함수 |
| `src/features/clients/components/ClientList.tsx` | 완전 재작성 (모달+탭) |
| `src/features/projects/components/ProjectList.tsx` | 완전 재작성 (모달+탭) |
| `src/app/(admin)/admin-teams/page.tsx` | +수정/삭제/팀원관리 |
| `src/app/(admin)/admin-users/page.tsx` | +수정 모달 |
| `src/app/(admin)/admin-sla/page.tsx` | +수정/삭제 |

### 11.3 Session Guide

| Module | 범위 | 예상 작업량 |
|--------|------|------------|
| module-1 | 공통 UI + API DELETE 라우트 | Modal, ConfirmDialog, 6개 API |
| module-2 | 고객사 CRUD UI (ClientList) | 등록/수정/삭제 모달 + 부서/담당자 탭 |
| module-3 | 프로젝트 CRUD UI (ProjectList) | 등록/수정/삭제 모달 + 에이전트 탭 |
| module-4 | 팀+사용자+SLA 수정/삭제 | 3개 페이지 기능 추가 |

**권장 세션 플랜:**
- Session 1: module-1 + module-2 (기초 + 핵심)
- Session 2: module-3 + module-4 (프로젝트 + 나머지)
