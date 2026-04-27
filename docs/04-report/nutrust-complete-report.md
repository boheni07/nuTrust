# nuTrust / ServiceDesk — 전체 프로젝트 보고서

> **프로젝트**: nuTrust ServiceDesk
> **기간**: 2026-04-07 ~ 2026-04-08
> **최종 Match Rate**: ~95% (service-desk) / 100% (ticket-machine)
> **성공 기준**: 6/6 (100%)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [Session 1 — PM & Plan](#2-session-1--pm--plan)
3. [Session 2 — Design](#3-session-2--design)
4. [Session 3 — Do: 구현](#4-session-3--do-구현)
5. [Session 4 — Check & Act](#5-session-4--check--act)
6. [Session 5 — ticket-machine 점검](#6-session-5--ticket-machine-점검)
7. [Session 6 — 환경설정 & 서비스 실행](#7-session-6--환경설정--서비스-실행)
8. [최종 산출물](#8-최종-산출물)
9. [주요 교훈](#9-주요-교훈)
10. [기술 스택](#10-기술-스택)

---

## 1. 프로젝트 개요

### 1.1 Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 고객 요청이 이메일/전화/메신저에 분산되어 추적 불가. 처리 과정 불투명으로 고객 신뢰 저하. 일방적 완료 처리로 재문의 25~35% 발생. CSAT 피드백 루프 단절로 서비스 품질 개선 불가. |
| **Solution** | 프로젝트 기반 통합 티켓 관리 플랫폼. 등록→접수(4h SLA)→처리중→완료요청→승인→완료 전체 흐름을 단일 시스템으로 관리. |
| **Function/UX** | 고객 포털(티켓 등록/추적/승인/CSAT) + 담당자 대시보드(처리/내부메모) + 관리자 콘솔(SLA/팀/보고서) |
| **Core Value** | **고객 승인 기반 서비스 완결성** — 고객이 직접 결과를 확인·승인하는 구조로 신뢰 체계 구축 |

### 1.2 Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 고객 요청 추적 불가 + 처리 불투명 + 승인 부재로 신뢰 저하. 50~500명 한국 중견기업에 적정 복잡도 솔루션 부재. |
| **WHO** | 고객(사내 서비스 이용자), 지원 담당자(IT 헬프데스크), 운영 관리자(서비스 운영팀장) |
| **RISK** | 고객 승인 워크플로우 채택 저항 (Critical) — 1-click UX + 자동 승인 옵션으로 대응 |
| **SUCCESS** | CSAT ≥ 4.0/5.0, SLA ≥ 95%, 승인율 ≥ 85%, 재문의율 ≤ 8% |
| **SCOPE** | MVP 12 Must-Have → 2차 지식기반/이메일 → 3차 AI/채팅/모바일 |

---

## 2. Session 1 — PM & Plan

**날짜**: 2026-04-07

### 대화 흐름

**사용자**: "티켓 기반 고객 신뢰 구축 플랫폼을 만들고 싶어요."

→ `/pdca pm` 실행 — PM Agent Team (pm-discovery, pm-strategy, pm-research, pm-prd) 4개 에이전트 병렬 분석

**PM 분석 결과:**
- **고객 페인포인트 3가지** 도출
  - 요청 추적 불가 (모든 요청의 60~70%에서 재문의 발생)
  - 처리 과정 불투명 (NPS 20~30점 하락 요인)
  - 완료 기준 불일치 (재문의율 25~35%)
- **경쟁사 분석**: ServiceNow(비싸고 복잡, 도입 3~6개월) vs Zendesk(승인 워크플로우 약함, 한국어 부족) → 시장 공백 확인
- **타겟 세그먼트**: 50~500명 한국 중견기업 IT 운영팀

→ `/pdca plan` 실행 — 요구사항 확인 체크포인트

**체크포인트 1 — 요구사항 확인:**
- 사용자 확인 후 SC 6개 확정

| # | Success Criteria | Target |
|---|-----------------|--------|
| SC-1 | 상태 머신 전체 흐름 | 9 states, 10 action APIs |
| SC-2 | 접수 SLA 4근무시간 | 비즈니스 캘린더 기반 자동 접수 |
| SC-3 | 연기 3중 가드 | 횟수/상태/날짜 조건 검증 |
| SC-4 | 파일 첨부 | S3 presigned URL |
| SC-5 | RBAC 3역할 | CUSTOMER / AGENT / MANAGER |
| SC-6 | 이메일 알림 | 7개 이벤트 템플릿 |

**MVP 범위 합의**: 티켓 CRUD, 승인 워크플로우, CSAT, SLA, 대시보드, RBAC, 인증

---

## 3. Session 2 — Design

**날짜**: 2026-04-07

### 대화 흐름

→ `/pdca design` 실행 — 아키텍처 3안 제시

**체크포인트 3 — 아키텍처 선택:**

| 옵션 | 방식 | 파일 수 | 복잡도 | 유지보수 |
|------|------|:-------:|:------:|:-------:|
| A | Monolithic | ~40 | Low | Medium |
| B | Clean/DDD | ~80+ | High | High |
| **C** | **Feature-based Modular** | **~55** | **Medium** | **High** |

**사용자**: Option C 선택 ("MVP 속도와 장기 유지보수 균형")

**핵심 설계 확정:**

| 항목 | 결정 |
|------|------|
| 상태 머신 | XState 5 + 서버 사이드 `validateTransition()` 이중 구조 |
| 티켓 상태 | 9-state (REGISTERED → CLOSED) |
| 연기 가드 | 3중 조건 (횟수/상태/날짜) |
| 인증 | NextAuth.js v5, 미들웨어 RBAC |
| SLA | 4근무시간 비즈니스 캘린더 + Cron 자동 접수 |
| Design Anchor | Trust Blue (`#2563EB`), Pretendard/Inter |

Session Guide: 8 모듈로 분할 구현 계획 수립

---

## 4. Session 3 — Do: 구현

**날짜**: 2026-04-07

### 대화 흐름

→ `/pdca do --scope module-1` 부터 8 모듈 순차 구현

| 모듈 | 내용 | 주요 파일 |
|------|------|---------|
| module-1 | 인프라 + 도메인 | schema.prisma, machine.ts, businessCalendar.ts, auth.ts |
| module-2 | 티켓 CRUD | tickets/route.ts, tickets/[id]/route.ts |
| module-3 | 상태 전환 | accept, start, complete, assign routes |
| module-4 | 승인/연기 | approve, reject, postpone, approve-postponement, reject-postponement |
| module-5 | 소통/파일 | comments, history, upload, download, csat |
| module-6 | 관리자 API | clients, projects, teams, users, sla-policies |
| module-7 | 대시보드/크론 | dashboard/agent, dashboard/manager, reports/sla, cron |
| module-8 | UI 16페이지 | portal/agent/admin 3역할 레이아웃 |

### 구현 중 발생한 이슈 및 해결

| 이슈 | 내용 | 해결 |
|------|------|------|
| Prisma 7 Breaking Change | datasource url이 schema에서 제거됨 → 연결 오류 | Prisma 6으로 다운그레이드 |
| XState 5 Context 타입 | generic 타입 추론 오류 → 컴파일 실패 | 정적 context 객체로 전환 |
| Next.js Route Group 충돌 | `(portal)`, `(agent)`, `(admin)` 동일 경로명 사용 불가 | role prefix 추가 (`/agent-dashboard`) |
| 접수→처리시작 2단계 UX | 사용자: "한 번에 되면 좋겠는데요" | accept API에서 ACCEPT+START 연속 실행 |

---

## 5. Session 4 — Check & Act

**날짜**: 2026-04-07~08

### Check-1: 초기 Gap 분석 (86%)

| Axis | Rate |
|------|:----:|
| Structural | 88% |
| Functional | 82% |
| Contract | 89% |
| **Overall** | **86%** |

### Act-1: Important 5건 수정 (86% → 91.2%)

| Gap | 사용자 피드백 | 수정 |
|-----|------------|------|
| I-1: 고객 댓글 UI 없음 | "댓글 입력은 필수예요" | TicketDetail에 댓글 입력/목록 추가 |
| I-2: 파일 업로드 UI 없음 | "첨부파일 선택도요" | TicketForm에 파일 선택/미리보기 추가 |
| I-3: ID 직접 입력 | "이건 못 쓰겠는데요" | API 기반 드롭다운으로 교체 |
| I-4: PUT /api/users/:id 없음 | — | route 추가 |
| I-5: PUT /api/sla-policies/:id 없음 | — | route 추가 |

### Act-2: Minor 8건 + UI 6건 수정 (91.2% → ~95%)

**사용자 추가 요청:**

| 요청 | 수정 |
|------|------|
| 비인증 시 빈 화면 → 리다이렉트 | middleware.ts 추가 |
| SLA 카운트다운 배지 | SLABadge 컴포넌트 (초과/임박/정상) |
| 프로젝트/기간 필터 | 드롭다운 + DatePicker + API 필터 |
| 관리자/담당자 설정 페이지 | /admin-settings, /agent-settings |

**모듈 분리:**

| Gap | 수정 |
|-----|------|
| approval 모듈 미분리 | ApprovalPanel.tsx 추출 |
| csat 모듈 미분리 | CSATForm.tsx 추출 |
| clients/projects 미분리 | ClientList.tsx, ProjectList.tsx 추출 |

### 최종 결과

| 항목 | 결과 |
|------|------|
| Final Match Rate | ~95% |
| Iterations | 2회 |
| SC 달성 | 6/6 (100%) |
| API 테스트 | 15/15 PASSED |

---

## 6. Session 5 — ticket-machine 점검

**날짜**: 2026-04-08

### 대화 전문

**사용자**: `/bkit:pdca 점검하고 실행해줘`

→ PDCA 상태 확인: ticket-machine, do 단계
→ 도메인 레이어 4개 파일 구현 완료 확인 (machine.ts, guards.ts, types.ts, index.ts)

**사용자**: Check 단계 실행 선택

→ 정적 Gap 분석 수행

**Gap 분석 결과 (98.8%)**

| Axis | Rate |
|------|:----:|
| Structural | 100% (4/4 파일) |
| Functional | 97% |
| Contract | 100% (오류 코드 4개) |
| **Overall** | **98.8%** |

**발견된 이슈:**

| ID | 심각도 | 내용 |
|----|--------|------|
| G-01 | Minor | `machine.ts`의 REJECTED final state가 도달 불가 — XState 전환 경로 없음 |

**사용자**: "수정"

→ `machine.ts:152`에서 REJECTED state 제거
→ `types.ts`, `schema.prisma`는 DB 호환성 위해 유지

**사용자**: "네" (Report 진행)

→ `ticket-machine.report.md` 생성, Match Rate 100% 달성

---

## 7. Session 6 — 환경설정 & 서비스 실행

**날짜**: 2026-04-08

### 대화 흐름

**사용자**: "실행해줘"
→ `npm run dev` 실행

**사용자**: "이메일 또는 비밀번호가 올바르지 않습니다. 로그인 되지 않음"

→ DB 연결 상태 확인
→ 오류: `P1000: Authentication failed against database server`
→ PostgreSQL이 실행되지 않고 있음 확인 (포트 5432 응답 없음)

**사용자**: "서비스 실행되도록 환경설정 등도 진행해줘"

→ Docker 설치 확인 (v29.2.1)
→ PostgreSQL 컨테이너 실행

```bash
docker run -d \
  --name servicedesk-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=servicedesk \
  -p 5432:5432 \
  postgres:16-alpine
```

→ `prisma db push` — 스키마 적용 완료
→ `prisma generate` — 클라이언트 생성 (dev server 중단 후 재실행)
→ `npx tsx prisma/seed.ts` — 시드 데이터 적용

```
Seed completed!
  - 2 clients, 5 departments, 3 contacts
  - 4 projects, 5 assignments
  - 8 users (1 admin, 1 manager, 3 agents, 3 customers)
  - 3 SLA policies
  - 3 sample tickets
```

→ `npm run dev` 재실행 → http://localhost:3000 정상 접속

### 로그인 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|---------|
| 관리자 | admin@servicedesk.com | password123 |
| 매니저 | manager@servicedesk.com | password123 |
| 담당자 | agent1@servicedesk.com | password123 |
| 고객 | customer1@abc.com | password123 |

---

## 8. 최종 산출물

### 규모

| 항목 | 수량 |
|------|:----:|
| Source Files | 95 |
| Lines of Code | ~3,000 |
| API Endpoints | 46 |
| UI Pages | 16 |
| DB Models | 14 |
| Feature Modules | 6 |
| PDCA Documents | 7 |

### 아키텍처

```
service-desk/src/
├── app/
│   ├── (portal)/          # 고객: dashboard, tickets(목록/등록/상세), settings
│   ├── (agent)/           # 담당자: agent-dashboard, agent-tickets/[id], agent-settings
│   ├── (admin)/           # 관리자: admin-dashboard, clients, projects, teams, users, sla, reports, settings
│   ├── api/               # REST API (46 endpoints)
│   └── auth/signin/       # 로그인
├── features/
│   ├── tickets/           # TicketList, TicketForm, TicketDetail, AgentTicketDetail
│   ├── approval/          # ApprovalPanel
│   ├── csat/              # CSATForm
│   ├── dashboard/         # AgentDashboard, ManagerDashboard
│   ├── clients/           # ClientList
│   └── projects/          # ProjectList
├── domain/
│   ├── ticket-machine/    # XState 머신 + guards + types
│   └── sla/               # 비즈니스 캘린더
├── lib/
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # NextAuth + RBAC
│   ├── api-helpers.ts     # requireAuth, withErrorHandler
│   ├── validations/       # Zod 스키마
│   └── services/          # ticket-transition, email
└── components/
    ├── ui/                # Button, Input, StatusBadge
    └── layout/            # Sidebar, Header
```

### API 엔드포인트 (46개)

| 카테고리 | 수 |
|---------|:--:|
| Auth | 1 |
| Clients / Departments / Contacts | 8 |
| Projects / Assignments | 6 |
| Tickets CRUD | 3 |
| Ticket Actions (accept/start/complete/assign) | 4 |
| Approval (approve/reject/postpone/×2) | 5 |
| Comments / History | 3 |
| CSAT | 2 |
| Upload / Download | 2 |
| Dashboard (agent/manager) | 2 |
| Reports (SLA) | 1 |
| Users / Teams / SLA Policies | 6 |
| User Profile (me/password) | 2 |
| Cron (auto-accept/delay) | 1 |

### 티켓 상태 머신

```
REGISTERED ──ACCEPT/AUTO_ACCEPT──→ ACCEPTED
ACCEPTED ──START──→ IN_PROGRESS
IN_PROGRESS ──DELAY──→ DELAYED
IN_PROGRESS ──REQUEST_COMPLETION──→ COMPLETION_REQUESTED
IN_PROGRESS ──REQUEST_POSTPONEMENT (3-guard)──→ POSTPONEMENT_REQUESTED
DELAYED ──REQUEST_COMPLETION──→ COMPLETION_REQUESTED
COMPLETION_REQUESTED ──APPROVE──→ APPROVED
COMPLETION_REQUESTED ──REJECT──→ IN_PROGRESS
POSTPONEMENT_REQUESTED ──APPROVE_POSTPONEMENT──→ IN_PROGRESS
POSTPONEMENT_REQUESTED ──REJECT_POSTPONEMENT──→ IN_PROGRESS
APPROVED ──SUBMIT_CSAT──→ CLOSED (final)
```

### PDCA 문서 목록

| 문서 | 경로 |
|------|------|
| PRD | `docs/archive/2026-04/service-desk/service-desk.prd.md` |
| Plan | `docs/archive/2026-04/service-desk/service-desk.plan.md` |
| Design | `docs/archive/2026-04/service-desk/service-desk.design.md` |
| Design Anchor | `docs/archive/2026-04/service-desk/service-desk.design-anchor.md` |
| Analysis | `docs/archive/2026-04/service-desk/service-desk.analysis.md` |
| ServiceDesk Report | `docs/04-report/service-desk.final-report.md` |
| ticket-machine Report | `docs/04-report/ticket-machine.report.md` |

---

## 9. 주요 교훈

| # | 교훈 | 상황 | 해결책 |
|---|------|------|--------|
| 1 | **Next.js Route Group 경로 충돌** | `(portal)/(agent)/(admin)`에서 같은 경로명 사용 시 충돌 | role prefix 필수 (`/agent-dashboard`, `/admin-dashboard`) |
| 2 | **Prisma 메이저 버전 주의** | Prisma 7에서 datasource url schema 제거 → 연결 불가 | Prisma 6 고정 사용 |
| 3 | **XState 5 Context 타입 복잡도** | generic 타입 추론 오류로 컴파일 실패 | 정적 context 객체 패턴 사용 |
| 4 | **미들웨어는 필수** | API 인증만으로는 비인증 시 빈 화면 노출 | 페이지 레벨 미들웨어로 리다이렉트 |
| 5 | **ACCEPT+START 통합** | 2단계 분리 시 UI 복잡도 증가 | accept API에서 두 전환 연속 실행 |
| 6 | **Feature 모듈 분리 타이밍** | MVP 단계에서 조기 분리 시 속도 저하 | 인라인으로 빠르게 → 안정화 후 분리 |
| 7 | **Dead State 관리** | XState에 도달 불가 final state 존재 (REJECTED) | 주기적 Check 단계에서 발견·제거 |
| 8 | **DB 환경 설정 문서화** | PostgreSQL 미실행 → 로그인 불가 | Docker Compose로 환경 코드화 권장 |

---

## 10. 기술 스택

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.2 |
| Database | PostgreSQL + Prisma | 16 + 6.19 |
| State Machine | XState | 5.30 |
| UI | Tailwind CSS + shadcn/ui pattern | 4.x |
| Auth | NextAuth.js | v5 beta |
| Client State | Zustand + TanStack Query | 5.x + 5.x |
| Forms | react-hook-form + Zod | 7.x + 4.x |
| Email | Resend | 6.x |
| Storage | AWS S3 (presigned URL) | — |
| Runtime | Node.js | v24.14.0 |
| Container | Docker | 29.2.1 |

---

## 전체 타임라인

| 날짜 | 세션 | 주요 활동 | 결과 |
|------|------|---------|------|
| 2026-04-07 AM | PM + Plan | PRD 작성, SC 6개 확정 | PRD + Plan 문서 |
| 2026-04-07 AM | Design | 아키텍처 3안 → Option C 선택 | Design 문서 + Design Anchor |
| 2026-04-07 PM | Do (8 modules) | 95파일 / 46 API / 16 UI 구현 | 전체 코드베이스 |
| 2026-04-07 PM | Check-1 | Gap 분석 86% | Important 5건 식별 |
| 2026-04-07 PM | Act-1 | Important 5건 수정 | 91.2% |
| 2026-04-08 AM | Act-2 | Minor 8건 + UI 6건 수정 | ~95%, SC 6/6 |
| 2026-04-08 AM | Report | 최종 보고서 작성 + 아카이브 | service-desk 완료 |
| 2026-04-08 PM | ticket-machine Check | G-01 발견 및 수정 | 100% |
| 2026-04-08 PM | 환경설정 | Docker PostgreSQL + 시드 | 서비스 정상 실행 |
