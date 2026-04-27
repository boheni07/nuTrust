# ServiceDesk Design Document

> **Summary**: 티켓 기반 요청 관리를 통한 고객 신뢰 구축 플랫폼
>
> **Project**: nuTrust / ServiceDesk
> **Version**: 1.0
> **Author**: Claude (PDCA Design)
> **Date**: 2026-04-07
> **Status**: Draft
> **Planning Doc**: [service-desk.plan.md](../../01-plan/features/service-desk.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 고객 요청 추적 불가 + 처리 불투명 + 승인 부재로 신뢰 저하. 50~500명 한국 중견기업에 적정 복잡도 솔루션 부재. |
| **WHO** | 고객(사내 서비스 이용자), 지원 담당자(IT 헬프데스크), 운영 관리자(서비스 운영팀장) |
| **RISK** | 고객 승인 워크플로우 채택 저항 (Critical) — 1-click UX + 자동 승인 옵션 대응 |
| **SUCCESS** | CSAT >= 4.0/5.0, SLA >= 95%, 승인율 >= 85%, 재문의율 <= 8% |
| **SCOPE** | MVP 12 Must-Have → 2차 지식기반/이메일/분석 → 3차 AI/채팅/모바일 |

---

## Design Anchor

> **Locked**: 2026-04-07 | **Theme**: Trust Blue
> **File**: [`service-desk.design-anchor.md`](../styles/service-desk.design-anchor.md)

| Category | Tokens |
|----------|--------|
| **Colors** | Primary: `#2563EB` (blue-600), Accent: `#059669` (emerald-600), Danger: `#DC2626`, Warning: `#D97706`, Bg: `#F8FAFC`, Text: `#0F172A` |
| **Typography** | Pretendard (KO) + Inter (EN), sizes: xs(12)~3xl(30), weights: 400/500/600/700 |
| **Spacing** | 4px base grid, card: `p-6`, section: `gap-8`, sidebar: 256px |
| **Radius** | default: `rounded-md` (6px), card: `rounded-lg` (8px), badge: `rounded-full` |
| **Tone** | 전문적이고 신뢰감. 파랑=신뢰/진행, 초록=성공/승인, 빨강=위험/지연 |
| **Layout** | Sidebar(256px) + Content, Card Grid, List→Detail 페이지 전환, 단일 컬럼 폼 |

---

## 1. Overview

### 1.1 Design Goals

1. **티켓 상태 머신 정확성** — 복잡한 상태 흐름(연기, 지연, 반려)을 XState로 모델링하여 불가능한 상태 전환을 원천 차단
2. **프로젝트 기반 멀티 테넌시** — 고객사/프로젝트/부서/담당자 계층 구조를 유연하게 관리
3. **3개 역할 분리** — 고객 포털, 담당자 대시보드, 관리자 콘솔을 독립 레이아웃으로 제공
4. **승인 워크플로우 UX** — 1-click 승인/반려로 채택 저항 최소화
5. **접수 SLA 자동화** — 4근무시간 비즈니스 캘린더 기반 자동 접수

### 1.2 Design Principles

- **Feature Isolation**: 기능별 모듈(features/)로 독립 개발/테스트
- **Domain Purity**: 핵심 도메인(상태 머신, SLA)은 UI/인프라에 의존하지 않음
- **Type Safety**: Prisma + Zod + TypeScript end-to-end 타입 안전성
- **Progressive Enhancement**: MVP 핵심 기능 먼저, 부가 기능 점진 추가

---

## 2. Architecture

### 2.0 Architecture Selection

| Criteria | A: Monolithic | B: Clean/DDD | **C: Feature-based** |
|----------|:---:|:---:|:---:|
| **New Files** | ~40 | ~80+ | **~55** |
| **Complexity** | Low | High | **Medium** |
| **Maintainability** | Medium | High | **High** |
| **Effort** | Low | High | **Medium** |

**Selected**: **Option C — Feature-based Modular**
**Rationale**: 기능별 자체 완결 모듈 + 핵심 도메인(상태 머신/SLA)만 별도 격리. MVP 속도와 장기 유지보수 균형.

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────┐
│                        Client (Browser)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 고객 포털  │  │ 담당자    │  │ 관리자    │               │
│  │ (portal) │  │ (agent)  │  │ (admin)  │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       └──────────────┼──────────────┘                     │
│                      ▼                                    │
│  ┌─────────────────────────────────────────────┐         │
│  │          Features Layer (Zustand + RQ)       │         │
│  │  tickets | approval | csat | dashboard | ... │         │
│  └────────────────────┬────────────────────────┘         │
└───────────────────────┼───────────────────────────────────┘
                        ▼ (API Calls)
┌───────────────────────────────────────────────────────────┐
│                   Next.js API Routes                       │
│  ┌─────────────────────────────────────────────┐          │
│  │            Application Layer                 │          │
│  │  Use Cases: CreateTicket, AcceptTicket,      │          │
│  │  ApproveTicket, RequestPostponement...       │          │
│  └────────────────────┬────────────────────────┘          │
│                       ▼                                    │
│  ┌─────────────────────────────────────────────┐          │
│  │              Domain Layer                    │          │
│  │  ticket-machine (XState) | sla (Calendar)   │          │
│  └────────────────────┬────────────────────────┘          │
│                       ▼                                    │
│  ┌─────────────────────────────────────────────┐          │
│  │           Infrastructure Layer               │          │
│  │  Prisma (PostgreSQL) | S3 | Resend | Auth   │          │
│  └─────────────────────────────────────────────┘          │
└───────────────────────────────────────────────────────────┘
```

### 2.2 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Next.js 14+ | React 18 | App Router, API Routes, SSR |
| Prisma | PostgreSQL | ORM, migrations, Row-level Security |
| XState 5 | - | 티켓 상태 머신 |
| Zustand | React | 클라이언트 상태 관리 |
| TanStack Query | React | 서버 상태 / 캐싱 |
| react-hook-form + zod | React | 폼 처리 + 유효성 검증 |
| shadcn/ui + Tailwind | React | UI 컴포넌트 |
| NextAuth.js | Next.js | 인증 (Email + SSO) |
| Resend | - | 이메일 알림 |
| AWS S3 | - | 파일 업로드/다운로드 |
| Vitest | - | 단위/통합 테스트 |
| Playwright | - | E2E 테스트 |

---

## 3. Data Model

### 3.1 Entity Definitions

```typescript
// ======= 조직 구조 =======

interface Client {
  id: string;
  name: string;                 // 고객사명
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

interface Department {
  id: string;
  clientId: string;             // FK → Client
  name: string;                 // 부서명
  parentId?: string;            // 상위 부서 (자기참조)
  createdAt: Date;
  updatedAt: Date;
}

interface Contact {
  id: string;
  clientId: string;             // FK → Client
  departmentId: string;         // FK → Department
  userId?: string;              // FK → User (시스템 계정 연결)
  name: string;
  email: string;
  phone?: string;
  position?: string;            // 직책
  createdAt: Date;
  updatedAt: Date;
}

// ======= 프로젝트 =======

interface Project {
  id: string;
  clientId: string;             // FK → Client
  name: string;                 // 프로젝트명
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectAssignment {
  id: string;
  projectId: string;            // FK → Project
  agentId: string;              // FK → User (지원 담당자)
  role: 'LEAD' | 'MEMBER';     // 프로젝트 내 역할
  createdAt: Date;
}

// ======= 티켓 =======

type TicketStatus =
  | 'REGISTERED'                // 등록
  | 'ACCEPTED'                  // 접수
  | 'IN_PROGRESS'               // 처리중
  | 'DELAYED'                   // 지연중
  | 'COMPLETION_REQUESTED'      // 완료요청
  | 'POSTPONEMENT_REQUESTED'    // 연기요청
  | 'APPROVED'                  // 승인
  | 'REJECTED'                  // 반려 (→ IN_PROGRESS 복귀)
  | 'CLOSED';                   // 완료

type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type TicketChannel = 'ONLINE' | 'PHONE' | 'EMAIL' | 'OTHER';

interface Ticket {
  id: string;
  ticketNumber: string;         // 자동 생성 (예: SD-20260407-001)
  projectId: string;            // FK → Project
  requesterId: string;          // FK → Contact (실제 요청자)
  registeredById: string;       // FK → User (등록자 — 대리 등록 시 담당자)
  assigneeId?: string;          // FK → User (배정된 담당자)
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  channel: TicketChannel;       // 등록 채널
  status: TicketStatus;
  requestedDueDate: Date;       // 처리희망일
  plannedDueDate?: Date;        // 완료예정일 (접수 시 설정, 기본=처리희망일)
  actionPlan?: string;          // 처리계획 (텍스트)
  acceptedAt?: Date;            // 접수 시각
  acceptedBy?: string;          // 접수자 (null = 자동 접수)
  isAutoAccepted: boolean;      // 자동 접수 여부
  postponementCount: number;    // 연기 횟수 (최대 1)
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ======= 상태 이력 =======

interface TicketStatusHistory {
  id: string;
  ticketId: string;             // FK → Ticket
  fromStatus: TicketStatus | null; // 이전 상태 (최초 등록 시 null)
  toStatus: TicketStatus;       // 변경된 상태
  changedById: string;          // FK → User (변경자, 시스템은 'SYSTEM')
  reason?: string;              // 변경 사유 (반려/연기 시)
  duration?: number;            // 이전 상태 체류 시간 (초)
  createdAt: Date;              // 변경 시각
}

// ======= 소통 =======

type CommentType = 'PUBLIC' | 'INTERNAL';

interface Comment {
  id: string;
  ticketId: string;             // FK → Ticket
  authorId: string;             // FK → User
  type: CommentType;            // 공개/내부
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// ======= 첨부파일 =======

interface Attachment {
  id: string;
  ticketId?: string;            // FK → Ticket (티켓 첨부)
  commentId?: string;           // FK → Comment (댓글 첨부)
  fileName: string;
  fileSize: number;             // bytes
  mimeType: string;
  storageKey: string;           // S3 key
  uploadedById: string;         // FK → User
  createdAt: Date;
}

// ======= 연기요청 =======

interface PostponementRequest {
  id: string;
  ticketId: string;             // FK → Ticket
  requestedById: string;        // FK → User (담당자)
  currentDueDate: Date;         // 현재 완료예정일
  requestedDueDate: Date;       // 새 완료예정일
  reason: string;               // 연기 사유
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  respondedById?: string;       // FK → Contact/User (고객)
  respondedAt?: Date;
  createdAt: Date;
}

// ======= CSAT =======

interface CSATRating {
  id: string;
  ticketId: string;             // FK → Ticket (1:1)
  rating: number;               // 1~5
  feedback?: string;            // 텍스트 피드백
  ratedById: string;            // FK → Contact
  createdAt: Date;
}

// ======= SLA =======

interface SLAPolicy {
  id: string;
  name: string;
  category?: string;            // 적용 카테고리 (null = 전체)
  priority?: TicketPriority;    // 적용 우선순위 (null = 전체)
  acceptanceHours: number;      // 접수 SLA (근무시간, 기본 4)
  resolutionHours: number;      // 해결 SLA (근무시간)
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ======= 사용자 =======

type UserRole = 'SYSTEM_ADMIN' | 'MANAGER' | 'AGENT' | 'CUSTOMER';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  contactId?: string;           // FK → Contact (고객 역할인 경우)
  teamId?: string;              // FK → Team (담당자인 경우)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Team {
  id: string;
  name: string;
  leaderId?: string;            // FK → User
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Entity Relationships

```
[Client] 1 ──── N [Department]
[Client] 1 ──── N [Contact]
[Client] 1 ──── N [Project]
[Department] 1 ──── N [Contact]

[Project] N ──── N [User:Agent] (via ProjectAssignment)

[Ticket] N ──── 1 [Project]
[Ticket] N ──── 1 [Contact] (requester)
[Ticket] N ──── 1 [User] (registeredBy)
[Ticket] N ──── 1 [User] (assignee)
[Ticket] 1 ──── N [TicketStatusHistory]
[Ticket] 1 ──── N [Comment]
[Ticket] 1 ──── N [Attachment]
[Ticket] 1 ──── 0..1 [PostponementRequest]
[Ticket] 1 ──── 0..1 [CSATRating]

[Comment] 1 ──── N [Attachment]

[User] N ──── 1 [Team]
[Team] 1 ──── N [User]
```

### 3.3 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum TicketStatus {
  REGISTERED
  ACCEPTED
  IN_PROGRESS
  DELAYED
  COMPLETION_REQUESTED
  POSTPONEMENT_REQUESTED
  APPROVED
  REJECTED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketChannel {
  ONLINE
  PHONE
  EMAIL
  OTHER
}

enum UserRole {
  SYSTEM_ADMIN
  MANAGER
  AGENT
  CUSTOMER
}

enum ProjectStatus {
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
}

enum PostponementStatus {
  PENDING
  APPROVED
  REJECTED
}

model Client {
  id           String       @id @default(cuid())
  name         String
  contactEmail String
  contactPhone String?
  address      String?
  status       String       @default("ACTIVE")
  departments  Department[]
  contacts     Contact[]
  projects     Project[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Department {
  id        String       @id @default(cuid())
  clientId  String
  client    Client       @relation(fields: [clientId], references: [id])
  name      String
  parentId  String?
  parent    Department?  @relation("DeptHierarchy", fields: [parentId], references: [id])
  children  Department[] @relation("DeptHierarchy")
  contacts  Contact[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model Contact {
  id           String     @id @default(cuid())
  clientId     String
  client       Client     @relation(fields: [clientId], references: [id])
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id])
  userId       String?    @unique
  user         User?      @relation(fields: [userId], references: [id])
  name         String
  email        String
  phone        String?
  position     String?
  tickets      Ticket[]   @relation("TicketRequester")
  csatRatings  CSATRating[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Project {
  id          String              @id @default(cuid())
  clientId    String
  client      Client              @relation(fields: [clientId], references: [id])
  name        String
  description String?
  startDate   DateTime?
  endDate     DateTime?
  status      ProjectStatus       @default(ACTIVE)
  assignments ProjectAssignment[]
  tickets     Ticket[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

model ProjectAssignment {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  agentId   String
  agent     User     @relation(fields: [agentId], references: [id])
  role      String   @default("MEMBER") // LEAD | MEMBER
  createdAt DateTime @default(now())

  @@unique([projectId, agentId])
}

model Ticket {
  id                String               @id @default(cuid())
  ticketNumber      String               @unique
  projectId         String
  project           Project              @relation(fields: [projectId], references: [id])
  requesterId       String
  requester         Contact              @relation("TicketRequester", fields: [requesterId], references: [id])
  registeredById    String
  registeredBy      User                 @relation("TicketRegisteredBy", fields: [registeredById], references: [id])
  assigneeId        String?
  assignee          User?                @relation("TicketAssignee", fields: [assigneeId], references: [id])
  title             String
  description       String
  category          String
  priority          TicketPriority       @default(MEDIUM)
  channel           TicketChannel        @default(ONLINE)
  status            TicketStatus         @default(REGISTERED)
  requestedDueDate  DateTime
  plannedDueDate    DateTime?
  actionPlan        String?
  acceptedAt        DateTime?
  acceptedBy        String?
  isAutoAccepted    Boolean              @default(false)
  postponementCount Int                  @default(0)
  closedAt          DateTime?
  statusHistory     TicketStatusHistory[]
  comments          Comment[]
  attachments       Attachment[]         @relation("TicketAttachments")
  postponement      PostponementRequest?
  csatRating        CSATRating?
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt

  @@index([projectId])
  @@index([assigneeId])
  @@index([status])
  @@index([createdAt])
}

model TicketStatusHistory {
  id         String        @id @default(cuid())
  ticketId   String
  ticket     Ticket        @relation(fields: [ticketId], references: [id])
  fromStatus TicketStatus?
  toStatus   TicketStatus
  changedBy  String        // userId or 'SYSTEM'
  reason     String?
  duration   Int?          // 이전 상태 체류 시간 (초)
  createdAt  DateTime      @default(now())

  @@index([ticketId])
}

model Comment {
  id          String       @id @default(cuid())
  ticketId    String
  ticket      Ticket       @relation(fields: [ticketId], references: [id])
  authorId    String
  author      User         @relation(fields: [authorId], references: [id])
  type        String       @default("PUBLIC") // PUBLIC | INTERNAL
  content     String
  attachments Attachment[] @relation("CommentAttachments")
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([ticketId])
}

model Attachment {
  id           String   @id @default(cuid())
  ticketId     String?
  ticket       Ticket?  @relation("TicketAttachments", fields: [ticketId], references: [id])
  commentId    String?
  comment      Comment? @relation("CommentAttachments", fields: [commentId], references: [id])
  fileName     String
  fileSize     Int
  mimeType     String
  storageKey   String
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now())
}

model PostponementRequest {
  id               String             @id @default(cuid())
  ticketId         String             @unique
  ticket           Ticket             @relation(fields: [ticketId], references: [id])
  requestedById    String
  requestedBy      User               @relation("PostponementRequester", fields: [requestedById], references: [id])
  currentDueDate   DateTime
  requestedDueDate DateTime
  reason           String
  status           PostponementStatus @default(PENDING)
  respondedById    String?
  respondedBy      User?              @relation("PostponementResponder", fields: [respondedById], references: [id])
  respondedAt      DateTime?
  createdAt        DateTime           @default(now())
}

model CSATRating {
  id        String   @id @default(cuid())
  ticketId  String   @unique
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  rating    Int      // 1~5
  feedback  String?
  ratedById String
  ratedBy   Contact  @relation(fields: [ratedById], references: [id])
  createdAt DateTime @default(now())
}

model SLAPolicy {
  id              String        @id @default(cuid())
  name            String
  category        String?
  priority        TicketPriority?
  acceptanceHours Int           @default(4)
  resolutionHours Int
  isDefault       Boolean       @default(false)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model User {
  id                    String              @id @default(cuid())
  email                 String              @unique
  name                  String
  passwordHash          String?
  role                  UserRole            @default(CUSTOMER)
  contactProfile        Contact?
  teamId                String?
  team                  Team?               @relation(fields: [teamId], references: [id])
  isActive              Boolean             @default(true)
  projectAssignments    ProjectAssignment[]
  registeredTickets     Ticket[]            @relation("TicketRegisteredBy")
  assignedTickets       Ticket[]            @relation("TicketAssignee")
  comments              Comment[]
  attachments           Attachment[]
  postponementRequests  PostponementRequest[] @relation("PostponementRequester")
  postponementResponses PostponementRequest[] @relation("PostponementResponder")
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
}

model Team {
  id        String   @id @default(cuid())
  name      String
  leaderId  String?
  members   User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 4. API Specification

### 4.1 Endpoint List

#### 조직/프로젝트 관리

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | `/api/clients` | 고객사 목록 | Required | MANAGER, ADMIN |
| POST | `/api/clients` | 고객사 생성 | Required | MANAGER, ADMIN |
| GET | `/api/clients/:id` | 고객사 상세 (부서/담당자 포함) | Required | MANAGER, ADMIN |
| PUT | `/api/clients/:id` | 고객사 수정 | Required | MANAGER, ADMIN |
| GET | `/api/clients/:clientId/departments` | 부서 목록 | Required | All |
| POST | `/api/clients/:clientId/departments` | 부서 생성 | Required | MANAGER, ADMIN |
| GET | `/api/clients/:clientId/contacts` | 담당자 목록 | Required | All |
| POST | `/api/clients/:clientId/contacts` | 담당자 생성 | Required | MANAGER, ADMIN |
| GET | `/api/projects` | 프로젝트 목록 | Required | All |
| POST | `/api/projects` | 프로젝트 생성 | Required | MANAGER, ADMIN |
| GET | `/api/projects/:id` | 프로젝트 상세 | Required | All |
| PUT | `/api/projects/:id` | 프로젝트 수정 | Required | MANAGER, ADMIN |
| POST | `/api/projects/:id/assignments` | 담당자 배정 | Required | MANAGER, ADMIN |
| DELETE | `/api/projects/:id/assignments/:agentId` | 담당자 배정 해제 | Required | MANAGER, ADMIN |

#### 티켓 관리

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | `/api/tickets` | 티켓 목록 (필터/정렬/페이지네이션) | Required | All |
| POST | `/api/tickets` | 티켓 등록 | Required | CUSTOMER, AGENT |
| GET | `/api/tickets/:id` | 티켓 상세 (이력/댓글/첨부 포함) | Required | All |
| PUT | `/api/tickets/:id` | 티켓 수정 (제목/설명/카테고리/우선순위) | Required | AGENT, MANAGER |
| POST | `/api/tickets/:id/accept` | 티켓 접수 (처리계획 + 완료예정일) | Required | AGENT |
| POST | `/api/tickets/:id/start` | 처리 시작 (ACCEPTED → IN_PROGRESS) | Required | AGENT |
| POST | `/api/tickets/:id/complete` | 완료 요청 (→ COMPLETION_REQUESTED) | Required | AGENT |
| POST | `/api/tickets/:id/postpone` | 연기 요청 (→ POSTPONEMENT_REQUESTED) | Required | AGENT |
| POST | `/api/tickets/:id/approve` | 완료 승인 (→ APPROVED) | Required | CUSTOMER |
| POST | `/api/tickets/:id/reject` | 완료 반려 (→ IN_PROGRESS, 사유 필수) | Required | CUSTOMER |
| POST | `/api/tickets/:id/approve-postponement` | 연기 승인 | Required | CUSTOMER |
| POST | `/api/tickets/:id/reject-postponement` | 연기 반려 | Required | CUSTOMER |
| POST | `/api/tickets/:id/assign` | 티켓 배정/재배정 | Required | MANAGER, AGENT |

#### 소통

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | `/api/tickets/:id/comments` | 댓글 목록 | Required | All |
| POST | `/api/tickets/:id/comments` | 댓글 등록 (type: PUBLIC/INTERNAL) | Required | All |
| GET | `/api/tickets/:id/history` | 상태 변경 이력 | Required | All |

#### 파일

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| POST | `/api/upload/presign` | Presigned URL 발급 | Required | All |
| GET | `/api/attachments/:id/download` | 파일 다운로드 URL | Required | All |

#### CSAT

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| POST | `/api/tickets/:id/csat` | CSAT 평가 제출 | Required | CUSTOMER |
| GET | `/api/csat/summary` | CSAT 통계 (프로젝트별/기간별) | Required | MANAGER, ADMIN |

#### 대시보드/리포팅

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | `/api/dashboard/agent` | 담당자 대시보드 데이터 | Required | AGENT |
| GET | `/api/dashboard/manager` | 관리자 대시보드 데이터 | Required | MANAGER, ADMIN |
| GET | `/api/reports/sla` | SLA 준수율 리포트 | Required | MANAGER, ADMIN |
| GET | `/api/reports/performance` | 팀/담당자 성과 리포트 | Required | MANAGER, ADMIN |

#### 관리

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | `/api/users` | 사용자 목록 | Required | ADMIN |
| POST | `/api/users` | 사용자 생성 | Required | ADMIN |
| PUT | `/api/users/:id` | 사용자 수정 | Required | ADMIN |
| GET | `/api/teams` | 팀 목록 | Required | MANAGER, ADMIN |
| POST | `/api/teams` | 팀 생성 | Required | ADMIN |
| GET | `/api/sla-policies` | SLA 정책 목록 | Required | MANAGER, ADMIN |
| POST | `/api/sla-policies` | SLA 정책 생성 | Required | ADMIN |
| PUT | `/api/sla-policies/:id` | SLA 정책 수정 | Required | ADMIN |

### 4.2 Request/Response Examples

#### `POST /api/tickets` (티켓 등록)

**Request:**
```json
{
  "projectId": "clxyz...",
  "requesterId": "clxyz...",
  "title": "ERP 접속 권한 요청",
  "description": "신규 입사자 김민수 사원에게 ERP 모듈 접속 권한 부여 요청합니다.",
  "category": "ACCESS_REQUEST",
  "priority": "MEDIUM",
  "channel": "ONLINE",
  "requestedDueDate": "2026-04-10T00:00:00Z",
  "attachmentIds": ["clxyz..."]
}
```

**Response (201):**
```json
{
  "data": {
    "id": "clxyz...",
    "ticketNumber": "SD-20260407-001",
    "status": "REGISTERED",
    "projectId": "clxyz...",
    "title": "ERP 접속 권한 요청",
    "requestedDueDate": "2026-04-10T00:00:00Z",
    "createdAt": "2026-04-07T09:00:00Z"
  }
}
```

#### `POST /api/tickets/:id/accept` (접수)

**Request:**
```json
{
  "actionPlan": "ERP 관리자 콘솔에서 권한 부여 후 테스트 접속 확인 예정",
  "plannedDueDate": "2026-04-09T00:00:00Z"
}
```

#### `POST /api/tickets/:id/postpone` (연기 요청)

**Request:**
```json
{
  "requestedDueDate": "2026-04-14T00:00:00Z",
  "reason": "ERP 서버 점검 일정과 겹쳐 처리가 지연됩니다."
}
```

**Validation:**
- `ticket.postponementCount === 0` (1회 초과 시 400)
- `ticket.status === 'IN_PROGRESS'` (지연중이면 400)
- `requestedDueDate > now` AND `now < ticket.plannedDueDate` (완료예정일 전에만)

#### Error Response Format

```json
{
  "error": {
    "code": "POSTPONEMENT_LIMIT_EXCEEDED",
    "message": "연기 요청은 1회만 가능합니다.",
    "details": {
      "currentCount": 1,
      "maxCount": 1
    }
  }
}
```

---

## 5. UI/UX Design

### 5.1 Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│  (portal) 고객 포털                                       │
│  ┌──────┬───────────────────────────────────────────────┐ │
│  │ Side │  Header: 프로젝트 선택 | 알림 | 프로필          │ │
│  │ bar  ├───────────────────────────────────────────────┤ │
│  │      │                                               │ │
│  │ - 대시│  Main Content                                 │ │
│  │ - 티켓│  (티켓 목록, 상세, 등록 폼 등)                  │ │
│  │ - 설정│                                               │ │
│  │      │                                               │ │
│  └──────┴───────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│  (agent) 담당자 대시보드                                   │
│  동일 레이아웃, 사이드바: 대시보드/내 티켓/프로젝트/팀       │
├──────────────────────────────────────────────────────────┤
│  (admin) 관리자 콘솔                                      │
│  동일 레이아웃, 사이드바: 대시보드/고객사/프로젝트/팀/SLA/  │
│  리포트/사용자 관리                                        │
└──────────────────────────────────────────────────────────┘
```

### 5.2 User Flow

```
[고객]
  로그인 → 프로젝트 선택 → 티켓 목록 → 티켓 등록 → 상태 추적
  → 완료요청 알림 → 승인/반려 → CSAT 평가

[담당자]
  로그인 → 대시보드 → 배정 티켓 확인 → 접수(처리계획 등록)
  → 처리 중 (댓글/메모) → 완료 요청 → 고객 승인 대기

[관리자]
  로그인 → 대시보드 → SLA 모니터링 → 팀/배정 관리 → 리포트 확인
```

### 5.3 Component List

| Component | Feature Module | Responsibility |
|-----------|---------------|----------------|
| `TicketList` | tickets | 티켓 목록 (필터, 검색, 정렬) |
| `TicketDetail` | tickets | 티켓 상세 (타임라인, 댓글, 첨부) |
| `TicketForm` | tickets | 티켓 등록/수정 폼 |
| `TicketTimeline` | tickets | 상태 변경 타임라인 시각화 |
| `AcceptanceForm` | tickets | 접수 폼 (처리계획, 완료예정일) |
| `ApprovalPanel` | approval | 승인/반려 UI (1-click) |
| `PostponementForm` | approval | 연기 요청 폼 |
| `PostponementReview` | approval | 연기 승인/반려 UI |
| `CSATForm` | csat | 만족도 평가 (별점 + 텍스트) |
| `CSATSummary` | csat | CSAT 통계 카드 |
| `AgentDashboard` | dashboard | 담당자 메인 대시보드 |
| `ManagerDashboard` | dashboard | 관리자 메인 대시보드 |
| `SLACountdown` | dashboard | SLA 카운트다운 뱃지 |
| `ProjectSelector` | projects | 프로젝트 선택 드롭다운 |
| `ClientForm` | clients | 고객사 등록/수정 폼 |
| `CommentThread` | tickets | 댓글/내부메모 스레드 |
| `FileUploader` | shared (components) | 파일 드래그&드롭 업로드 |
| `StatusBadge` | shared (components) | 상태 뱃지 (색상 코딩) |

### 5.4 Page UI Checklist

#### 고객 포털 — 티켓 목록

- [ ] Filter: 상태 필터 드롭다운 (9개 상태 전체 + "전체")
- [ ] Filter: 프로젝트 선택 드롭다운
- [ ] Filter: 우선순위 필터 (LOW, MEDIUM, HIGH, URGENT)
- [ ] Filter: 기간 필터 (등록일 범위)
- [ ] Search: 제목/설명 키워드 검색
- [ ] Sort: 등록일, 우선순위, 상태별 정렬
- [ ] Button: "새 티켓 등록" 버튼
- [ ] Card/Row: 티켓번호 표시 (SD-XXXXXXXX-NNN)
- [ ] Card/Row: 상태 뱃지 (색상 코딩: 등록=회색, 처리중=파랑, 지연=빨강, 완료=초록)
- [ ] Card/Row: 우선순위 뱃지
- [ ] Card/Row: 제목, 카테고리, 담당자명
- [ ] Card/Row: 처리희망일 / 완료예정일 표시
- [ ] Card/Row: SLA 카운트다운 (접수 전: 접수 SLA, 접수 후: 해결 SLA)
- [ ] Pagination: 페이지 네비게이션

#### 고객 포털 — 티켓 상세

- [ ] Header: 티켓번호, 제목, 상태 뱃지, 우선순위 뱃지
- [ ] Info: 프로젝트명, 카테고리, 등록 채널, 등록자
- [ ] Info: 처리희망일, 완료예정일, 담당자명
- [ ] Info: 처리계획 텍스트 (접수 후 표시)
- [ ] Timeline: 상태 변경 타임라인 (시간순, 체류 시간 표시)
- [ ] Comments: 공개 댓글 스레드 (내부 메모는 고객에게 비공개)
- [ ] Comments: 댓글 입력 폼 + 파일 첨부 버튼
- [ ] Attachments: 첨부파일 목록 (다운로드 링크)
- [ ] Action: "승인" 버튼 (COMPLETION_REQUESTED 상태일 때)
- [ ] Action: "반려" 버튼 + 사유 입력 모달 (COMPLETION_REQUESTED 상태일 때)
- [ ] Action: "연기 승인"/"연기 반려" 버튼 (POSTPONEMENT_REQUESTED 상태일 때)
- [ ] CSAT: 별점(1~5) + 텍스트 피드백 폼 (APPROVED 상태일 때)

#### 고객 포털 — 티켓 등록

- [ ] Select: 프로젝트 선택 (본인 소속 프로젝트 필터)
- [ ] Input: 제목 (필수)
- [ ] Textarea: 설명 (필수, 리치 텍스트 기본)
- [ ] Select: 카테고리 선택
- [ ] Select: 우선순위 선택 (기본: MEDIUM)
- [ ] DatePicker: 처리희망일 (필수, 오늘 이후)
- [ ] FileUpload: 파일 첨부 (다중, 드래그&드롭, 50MB/파일, 10개/티켓)
- [ ] Button: "등록" 제출 버튼
- [ ] Validation: 필수 필드 미입력 시 에러 메시지

#### 담당자 — 대시보드

- [ ] Card: 오늘 배정 티켓 수
- [ ] Card: SLA 위반 임박 티켓 수 (24시간 내)
- [ ] Card: 완료 대기(승인 대기) 티켓 수
- [ ] Card: 이번 주 완료 티켓 수
- [ ] List: 배정 티켓 목록 (우선순위/SLA 정렬)
- [ ] Badge: SLA 카운트다운 (빨강: 위반, 주황: 임박, 초록: 정상)
- [ ] Badge: 상태별 색상 코딩
- [ ] QuickAction: "접수" 버튼 (REGISTERED 상태)
- [ ] QuickAction: "완료요청" 버튼 (IN_PROGRESS/DELAYED 상태)

#### 담당자 — 티켓 접수 모달

- [ ] Textarea: 처리계획 (필수)
- [ ] DatePicker: 완료예정일 (기본값 = 처리희망일, 수정 가능)
- [ ] Button: "접수" 확인 버튼

#### 관리자 — 대시보드

- [ ] Chart: SLA 준수율 (시계열 차트)
- [ ] Chart: CSAT 평균 (시계열 차트)
- [ ] Chart: 티켓 현황 (상태별 파이/바 차트)
- [ ] Card: 총 활성 티켓, 지연 티켓, 승인율, 평균 처리시간
- [ ] Table: 담당자별 성과 (배정/완료/SLA 준수율/CSAT)
- [ ] Table: 프로젝트별 요약 (티켓 수/CSAT/SLA)
- [ ] Filter: 기간 선택, 프로젝트 선택

---

## 6. Error Handling

### 6.1 Domain Error Codes

| Code | HTTP | Message | Cause |
|------|------|---------|-------|
| `TICKET_INVALID_TRANSITION` | 400 | 현재 상태에서 해당 작업을 수행할 수 없습니다 | XState 가드 실패 |
| `POSTPONEMENT_LIMIT_EXCEEDED` | 400 | 연기 요청은 1회만 가능합니다 | postponementCount >= 1 |
| `POSTPONEMENT_DELAYED_NOT_ALLOWED` | 400 | 지연 상태에서는 연기 요청이 불가합니다 | status === DELAYED |
| `POSTPONEMENT_PAST_DUE` | 400 | 완료예정일이 지난 후에는 연기 요청이 불가합니다 | now > plannedDueDate |
| `TICKET_NOT_ASSIGNED` | 400 | 배정된 담당자가 없습니다 | assigneeId === null |
| `UNAUTHORIZED_PROJECT_ACCESS` | 403 | 해당 프로젝트 접근 권한이 없습니다 | 프로젝트 배정 안 됨 |
| `FILE_TOO_LARGE` | 413 | 파일 크기가 50MB를 초과합니다 | fileSize > 50MB |
| `FILE_LIMIT_EXCEEDED` | 400 | 티켓 당 최대 10개 파일만 첨부 가능합니다 | attachments.length >= 10 |

### 6.2 Error Response Format

```json
{
  "error": {
    "code": "POSTPONEMENT_LIMIT_EXCEEDED",
    "message": "연기 요청은 1회만 가능합니다.",
    "details": { "currentCount": 1, "maxCount": 1 }
  }
}
```

---

## 7. Security Considerations

- [ ] Input validation: Zod 스키마로 모든 API 입력 검증 (XSS, Injection 방지)
- [ ] Authentication: NextAuth.js — 이메일/비밀번호 + SSO (SAML/OIDC)
- [ ] Authorization: RBAC 미들웨어 — 역할별 API 접근 제어
- [ ] Data isolation: 고객은 자기 프로젝트 티켓만 조회 가능
- [ ] Internal notes: 내부 메모는 AGENT/MANAGER 역할만 조회 가능
- [ ] File upload: Presigned URL 방식, 서버 사이드 MIME 검증
- [ ] HTTPS: TLS 1.3 강제
- [ ] Rate Limiting: API 엔드포인트별 rate limit (100 req/min/user)
- [ ] Password: bcrypt 해싱, 최소 8자
- [ ] Session: HttpOnly + Secure + SameSite cookie

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1: API Tests | 티켓 CRUD, 상태 전환, 연기 규칙, CSAT | curl / Vitest | Do |
| L2: UI Action Tests | 폼 제출, 승인/반려, 필터, 파일 업로드 | Playwright | Do |
| L3: E2E Scenario Tests | 티켓 전체 라이프사이클, 연기 시나리오 | Playwright | Do |

### 8.2 L1: API Test Scenarios

| # | Endpoint | Method | Test | Expected |
|---|----------|--------|------|----------|
| 1 | `/api/tickets` | POST | 유효한 티켓 등록 | 201, ticketNumber 존재 |
| 2 | `/api/tickets` | POST | 필수 필드 누락 | 400, fieldErrors |
| 3 | `/api/tickets` | GET | 프로젝트별 필터 | 200, 해당 프로젝트만 반환 |
| 4 | `/api/tickets/:id/accept` | POST | 정상 접수 | 200, status=ACCEPTED |
| 5 | `/api/tickets/:id/accept` | POST | 이미 접수된 티켓 | 400, INVALID_TRANSITION |
| 6 | `/api/tickets/:id/postpone` | POST | 정상 연기 (1회차) | 200, status=POSTPONEMENT_REQUESTED |
| 7 | `/api/tickets/:id/postpone` | POST | 2회차 연기 시도 | 400, POSTPONEMENT_LIMIT_EXCEEDED |
| 8 | `/api/tickets/:id/postpone` | POST | 지연 상태에서 연기 | 400, POSTPONEMENT_DELAYED_NOT_ALLOWED |
| 9 | `/api/tickets/:id/postpone` | POST | 완료예정일 경과 후 연기 | 400, POSTPONEMENT_PAST_DUE |
| 10 | `/api/tickets/:id/approve` | POST | 정상 승인 | 200, status=APPROVED |
| 11 | `/api/tickets/:id/reject` | POST | 반려 (사유 포함) | 200, status=IN_PROGRESS |
| 12 | `/api/tickets/:id/csat` | POST | CSAT 제출 (1~5) | 201, rating 저장 |
| 13 | `/api/tickets/:id/csat` | POST | 범위 초과 (0 또는 6) | 400, validation |
| 14 | `/api/tickets` | GET | 인증 없이 접근 | 401, UNAUTHORIZED |
| 15 | `/api/upload/presign` | POST | 파일 업로드 URL 발급 | 200, presignedUrl 존재 |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected |
|---|------|--------|----------|
| 1 | 티켓 목록 | 페이지 로드 | 모든 §5.4 체크리스트 요소 표시 |
| 2 | 티켓 목록 | 상태 필터 "처리중" 선택 | IN_PROGRESS 티켓만 표시 |
| 3 | 티켓 등록 | 필수 필드 채우고 제출 | 성공 메시지, 목록으로 이동 |
| 4 | 티켓 등록 | 빈 폼 제출 시도 | 유효성 에러 메시지 표시 |
| 5 | 티켓 등록 | 파일 첨부 (50MB 이하) | 업로드 성공 표시 |
| 6 | 티켓 상세 | 공개 댓글 작성 | 댓글 스레드에 추가 |
| 7 | 티켓 상세 | 승인 버튼 클릭 | 상태 APPROVED, CSAT 폼 표시 |
| 8 | 티켓 상세 | 반려 버튼 → 사유 입력 → 확인 | 상태 IN_PROGRESS 복귀 |
| 9 | 담당자 대시보드 | 페이지 로드 | 배정 티켓, SLA 카운트다운 표시 |
| 10 | 접수 모달 | 처리계획 입력 → 접수 | 상태 ACCEPTED |

### 8.4 L3: E2E Scenario Tests

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 정상 티켓 라이프사이클 | 등록 → 접수 → 처리중 → 완료요청 → 승인 → CSAT → 완료 | 모든 상태 전환 성공, CSAT 저장 |
| 2 | 반려 후 재처리 | 등록 → ... → 완료요청 → 반려(사유) → 처리중 → 완료요청 → 승인 | 반려 이력 보존, 재승인 성공 |
| 3 | 연기 시나리오 | 등록 → 접수 → 처리중 → 연기요청 → 승인 → 새 완료예정일 적용 → 완료요청 → 승인 | 완료예정일 변경 확인 |
| 4 | 연기 제한 검증 | 연기 1회 후 재시도 | 2회차 연기 시 에러, 지연 상태에서 연기 불가 |
| 5 | 자동 접수 | 등록 → 4근무시간 대기 → 자동 접수 확인 | isAutoAccepted=true, 완료예정일=처리희망일 |
| 6 | 지연 자동 전환 | 처리중 → 완료예정일 경과 → 지연 자동 전환 | status=DELAYED |
| 7 | 대리 등록 | 담당자가 전화 접수 건 대리 등록 (channel=PHONE) | 요청자/등록자 분리, 채널 기록 |

### 8.5 Seed Data Requirements

| Entity | Count | Key Fields |
|--------|:-----:|------------|
| Client | 3 | 고객사A/B/C |
| Department | 6 | 각 고객사당 2 부서 |
| Contact | 12 | 각 부서당 2 담당자 |
| Project | 4 | 2 Active, 1 On-Hold, 1 Completed |
| User (AGENT) | 5 | 팀 2개에 분배 |
| User (MANAGER) | 2 | 팀 리더 |
| User (CUSTOMER) | 6 | Contact 연결 |
| Ticket | 20 | 다양한 상태 분포 |
| SLAPolicy | 3 | 기본, HIGH, URGENT 별도 정책 |

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | UI 컴포넌트, 페이지, 레이아웃, 훅 | `src/app/`, `src/features/*/components/`, `src/components/` |
| **Application** | Use Cases, API 핸들러, 비즈니스 로직 조합 | `src/features/*/api/`, `src/features/*/hooks/` |
| **Domain** | 상태 머신, SLA 계산, 도메인 모델, 밸리데이션 | `src/domain/` |
| **Infrastructure** | DB, 파일 스토리지, 이메일, 인증 | `src/lib/` |

### 9.2 File Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `src/app/` (pages) | `features/*`, `components/`, `domain/` | `lib/` directly |
| `src/features/*` | `domain/`, `lib/`, `components/` | other features |
| `src/domain/` | nothing external | `features/`, `lib/`, `app/` |
| `src/lib/` | `domain/` models/types only | `features/`, `app/` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `TicketList`, `ApprovalPanel` |
| Hooks | camelCase, use- prefix | `useTickets()`, `useApproval()` |
| API handlers | camelCase | `createTicket()`, `acceptTicket()` |
| Domain models | PascalCase | `Ticket`, `TicketStatus` |
| Constants/Enums | UPPER_SNAKE | `TICKET_STATUS`, `MAX_POSTPONEMENT` |
| Files (component) | PascalCase.tsx | `TicketList.tsx` |
| Files (logic) | camelCase.ts | `ticketMachine.ts` |
| Folders | kebab-case | `ticket-machine/`, `sla/` |

### 10.2 Import Order

```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

// 3. Domain
import { ticketMachine } from '@/domain/ticket-machine'
import type { Ticket } from '@/domain/models'

// 4. Features / Lib
import { useTickets } from '@/features/tickets/hooks'
import { prisma } from '@/lib/db'

// 5. Components
import { Button } from '@/components/ui/button'

// 6. Relative
import { TicketRow } from './TicketRow'

// 7. Types
import type { TicketListProps } from './types'
```

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/
│   ├── (portal)/               # 고객 포털 레이아웃
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   └── tickets/
│   │       ├── page.tsx        # 티켓 목록
│   │       ├── new/page.tsx    # 티켓 등록
│   │       └── [id]/page.tsx   # 티켓 상세
│   ├── (agent)/                # 담당자 레이아웃
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   └── tickets/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── (admin)/                # 관리자 레이아웃
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── teams/
│   │   ├── sla-policies/
│   │   ├── users/
│   │   └── reports/
│   ├── api/                    # API Routes
│   │   ├── tickets/
│   │   │   ├── route.ts        # GET(list), POST(create)
│   │   │   └── [id]/
│   │   │       ├── route.ts    # GET(detail), PUT(update)
│   │   │       ├── accept/route.ts
│   │   │       ├── start/route.ts
│   │   │       ├── complete/route.ts
│   │   │       ├── postpone/route.ts
│   │   │       ├── approve/route.ts
│   │   │       ├── reject/route.ts
│   │   │       ├── approve-postponement/route.ts
│   │   │       ├── reject-postponement/route.ts
│   │   │       ├── assign/route.ts
│   │   │       ├── comments/route.ts
│   │   │       ├── history/route.ts
│   │   │       └── csat/route.ts
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── teams/
│   │   ├── users/
│   │   ├── sla-policies/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   └── upload/
│   ├── auth/                   # NextAuth pages
│   └── layout.tsx              # Root layout
├── features/
│   ├── tickets/
│   │   ├── components/         # TicketList, TicketDetail, TicketForm, TicketTimeline
│   │   ├── hooks/              # useTickets, useTicketDetail, useTicketActions
│   │   └── types.ts
│   ├── approval/
│   │   ├── components/         # ApprovalPanel, PostponementForm, PostponementReview
│   │   ├── hooks/              # useApproval, usePostponement
│   │   └── types.ts
│   ├── csat/
│   │   ├── components/         # CSATForm, CSATSummary
│   │   ├── hooks/              # useCSAT
│   │   └── types.ts
│   ├── dashboard/
│   │   ├── components/         # AgentDashboard, ManagerDashboard, SLACountdown
│   │   ├── hooks/              # useDashboard
│   │   └── types.ts
│   ├── clients/
│   │   ├── components/         # ClientForm, ClientList, DepartmentTree, ContactList
│   │   ├── hooks/
│   │   └── types.ts
│   ├── projects/
│   │   ├── components/         # ProjectForm, ProjectList, AssignmentManager
│   │   ├── hooks/
│   │   └── types.ts
│   └── admin/
│       ├── components/         # UserForm, TeamForm, SLAPolicyForm
│       ├── hooks/
│       └── types.ts
├── domain/
│   ├── ticket-machine/
│   │   ├── machine.ts          # XState 상태 머신 정의
│   │   ├── guards.ts           # 전환 가드 (연기 조건, 상태 검증)
│   │   ├── actions.ts          # 상태 전환 액션
│   │   └── types.ts            # 상태/이벤트 타입
│   ├── sla/
│   │   ├── calculator.ts       # SLA 시간 계산
│   │   ├── businessCalendar.ts # 근무시간/공휴일 관리
│   │   └── types.ts
│   └── models/
│       ├── ticket.ts           # Ticket 도메인 모델
│       ├── project.ts
│       └── index.ts
├── lib/
│   ├── db.ts                   # Prisma client
│   ├── auth.ts                 # NextAuth config
│   ├── storage.ts              # S3 upload/download
│   ├── email.ts                # Resend email service
│   ├── validations/            # Zod schemas
│   │   ├── ticket.ts
│   │   ├── client.ts
│   │   └── project.ts
│   └── utils/
│       ├── ticketNumber.ts     # 티켓 번호 생성
│       └── pagination.ts       # 페이지네이션 유틸
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Sidebar, Header, Navigation
│   ├── FileUploader.tsx
│   ├── StatusBadge.tsx
│   └── DatePicker.tsx
└── types/
    └── index.ts                # 공유 타입
```

### 11.2 Implementation Order

1. [ ] **인프라 설정**: Next.js 프로젝트 초기화, Prisma, DB, 환경변수
2. [ ] **도메인 모델**: Prisma 스키마, 마이그레이션, Seed 데이터
3. [ ] **티켓 상태 머신**: XState 머신 + 가드 + 단위 테스트
4. [ ] **SLA 엔진**: 비즈니스 캘린더, SLA 계산, 자동 접수/지연 스케줄러
5. [ ] **인증/RBAC**: NextAuth 설정, 역할 미들웨어
6. [ ] **조직/프로젝트 API**: Client, Department, Contact, Project CRUD
7. [ ] **티켓 API**: 등록, 접수, 상태 전환, 댓글, 첨부파일
8. [ ] **승인 API**: 완료요청, 승인/반려, 연기요청/승인/반려
9. [ ] **CSAT API**: 평가 제출, 통계 집계
10. [ ] **공유 UI**: shadcn/ui 설정, 레이아웃, 공통 컴포넌트
11. [ ] **고객 포털 UI**: 티켓 목록/상세/등록, 승인/CSAT
12. [ ] **담당자 UI**: 대시보드, 티켓 처리, 접수/완료요청
13. [ ] **관리자 UI**: 고객사/프로젝트/팀/SLA 관리, 대시보드, 리포트
14. [ ] **이메일 알림**: 상태 변경 알림, 승인 요청 알림
15. [ ] **E2E 테스트**: 전체 시나리오 검증

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Effort |
|--------|-----------|-------------|:----------------:|
| 인프라 + 도메인 | `module-1` | 프로젝트 초기화, Prisma 스키마, XState 상태 머신, SLA 엔진, 인증 | Large |
| 조직/프로젝트 API+UI | `module-2` | Client/Dept/Contact/Project CRUD API + 관리자 UI | Medium |
| 티켓 핵심 API | `module-3` | 티켓 등록/접수/상태전환/댓글/첨부 API | Large |
| 승인/CSAT API | `module-4` | 승인/반려/연기/CSAT API | Medium |
| 고객 포털 UI | `module-5` | 티켓 목록/상세/등록/승인/CSAT 고객 화면 | Large |
| 담당자 UI | `module-6` | 대시보드, 티켓 처리, 접수/완료요청 화면 | Medium |
| 관리자 UI + 리포트 | `module-7` | 관리 화면, 대시보드, SLA/성과 리포트 | Medium |
| 알림 + E2E | `module-8` | 이메일 알림, 자동 접수/지연 스케줄러, E2E 테스트 | Medium |

#### Recommended Session Plan

| Session | Scope | Description |
|---------|-------|-------------|
| Session 1 | `--scope module-1` | 인프라 + Prisma + XState + SLA + Auth |
| Session 2 | `--scope module-2` | 조직/프로젝트 관리 API + UI |
| Session 3 | `--scope module-3` | 티켓 핵심 API (등록~상태전환) |
| Session 4 | `--scope module-4` | 승인/연기/CSAT API |
| Session 5 | `--scope module-5` | 고객 포털 전체 UI |
| Session 6 | `--scope module-6` | 담당자 대시보드 + 처리 UI |
| Session 7 | `--scope module-7` | 관리자 UI + 리포팅 |
| Session 8 | `--scope module-8` | 알림 + 스케줄러 + E2E 테스트 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-07 | Initial draft — Option C (Feature-based Modular) 아키텍처, 전체 데이터 모델, API 명세, UI 체크리스트, 상태 머신 설계, 8 세션 구현 가이드 | Claude (PDCA Design) |
