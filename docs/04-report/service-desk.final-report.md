# ServiceDesk Final PDCA Report

> **Feature**: service-desk — 티켓 기반 요청 관리를 통한 고객 신뢰 구축 플랫폼
> **Date**: 2026-04-08 (Final)
> **Level**: Enterprise
> **PDCA Cycle**: PM → Plan → Design → Do (8 modules) → Check → Act-1 → Act-2 (Minor 8건 + UI 6건) → Report

---

## 1. Executive Summary

### 1.1 Overview

| Item | Value |
|------|-------|
| **Feature** | ServiceDesk — 티켓 기반 고객 신뢰 구축 플랫폼 |
| **Start Date** | 2026-04-07 |
| **Final Date** | 2026-04-08 |
| **Final Match Rate** | **~95%** |
| **Iterations** | 2회 (Act-1: Important 5건, Act-2: Minor 8건 + UI 6건) |
| **API Test** | 15/15 PASSED |

### 1.2 Final Metrics

| Metric | Round 1 (86%) | Round 2 (91%) | Final (~95%) |
|--------|:------------:|:------------:|:------------:|
| Structural | 88% | 90% | 95% |
| Functional | 82% | 90% | 95% |
| Contract | 89% | 93% | 95% |
| **Overall** | **86%** | **91.2%** | **~95%** |

### 1.3 Deliverables

| Metric | Value |
|--------|-------|
| Source Files | 95 |
| Lines of Code | ~3,000 |
| API Endpoints | 46 |
| UI Pages | 16 |
| DB Models | 14 |
| Feature Modules | 6 (tickets, approval, csat, dashboard, clients, projects) |
| PDCA Documents | 6 (PRD, Plan, Design, Design Anchor, Analysis, Report) |

### 1.4 Value Delivered

| Perspective | Delivered |
|-------------|-----------|
| **Problem** | 고객 요청 분산/불투명 → 프로젝트 기반 통합 티켓 + 실시간 상태 타임라인 + 양방향 소통 |
| **Solution** | 9-state XState 상태 머신 + 연기 3중 가드 + 4h SLA 자동 접수 + CSAT 통합 + 미들웨어 인증 |
| **Function/UX** | 3역할 독립 UI + 로그인/로그아웃 + 프로필 설정 + 대시보드(KPI) + 프로젝트/기간/SLA 필터 + 첨부파일 다운로드 |
| **Core Value** | **고객 승인 기반 서비스 완결성** — 승인/반려/연기 통제권 + 만족도 평가로 신뢰 체계 구축 |

---

## 2. Success Criteria

| # | Criteria | Status | Evidence |
|---|---------|:------:|----------|
| SC-1 | 상태 머신 전체 흐름 | ✅ Met | XState 9 states + 10 action APIs + 15/15 API test |
| SC-2 | 접수 SLA 4근무시간 | ✅ Met | businessCalendar.ts + cron/route.ts |
| SC-3 | 연기 3중 가드 | ✅ Met | guards.ts + postpone API (3 error codes) + API test T8~T11 |
| SC-4 | 파일 첨부 | ✅ Met | upload presign + 댓글 첨부 + 다운로드 API |
| SC-5 | RBAC 3역할 | ✅ Met | middleware.ts + requireAuth + 미인증 리다이렉트 |
| SC-6 | 이메일 알림 | ✅ Met | 7 templates (dev console fallback) |

**Overall**: 6/6 (100%)

---

## 3. Implementation Summary

### 3.1 Architecture

```
src/
├── app/                    # 16 pages + 46 API routes
│   ├── (portal)/           # 고객: dashboard, tickets, settings
│   ├── (agent)/            # 담당자: dashboard, tickets, settings
│   ├── (admin)/            # 관리자: dashboard, clients, projects, teams, users, sla, reports, settings
│   └── api/                # REST API (46 endpoints)
├── features/               # 6 feature modules
│   ├── tickets/            # 목록, 상세, 등록, 담당자 상세
│   ├── approval/           # 승인/반려 패널 (M-1 분리)
│   ├── csat/               # CSAT 폼/표시 (M-2 분리)
│   ├── dashboard/          # Agent/Manager 대시보드
│   ├── clients/            # 고객사 목록 (M-3 분리)
│   └── projects/           # 프로젝트 목록 (M-3 분리)
├── domain/                 # XState 상태 머신 + SLA 엔진
├── lib/                    # DB, Auth, Email, Validations, Services
└── components/             # 공유 UI (Button, Input, StatusBadge, Sidebar, Header)
```

### 3.2 Pages

| Role | Pages | Routes |
|------|:-----:|--------|
| 공통 | 2 | `/`, `/auth/signin` |
| 고객 | 4 | `/dashboard`, `/tickets`, `/tickets/new`, `/tickets/[id]`, `/settings` |
| 담당자 | 3 | `/agent-dashboard`, `/agent-tickets/[id]`, `/agent-settings` |
| 관리자 | 7 | `/admin-dashboard`, `/admin-clients`, `/admin-projects`, `/admin-teams`, `/admin-users`, `/admin-sla`, `/admin-reports`, `/admin-settings` |

### 3.3 API Endpoints (46)

| Category | Count |
|----------|:-----:|
| Auth | 1 |
| Clients/Departments/Contacts | 8 |
| Projects/Assignments | 6 |
| Tickets CRUD | 3 |
| Ticket Actions (accept/start/complete/assign) | 4 |
| Approval (approve/reject/postpone) | 6 |
| Comments/History | 3 |
| CSAT | 2 |
| Upload/Download | 2 |
| Dashboard (agent/manager) | 2 |
| Reports (SLA) | 1 |
| Users/Teams/SLA Policies | 6 |
| User Profile (me/password) | 2 |
| Cron (auto-accept/delay) | 1 |

---

## 4. Gap Resolution History

### Round 1: Initial Check (86%)
- Critical: 0
- Important: 5 → All resolved in Act-1
- Minor: 8

### Act-1: Important 5건 수정 (86% → 91.2%)
| # | Gap | Fix |
|---|-----|-----|
| I-1 | 고객 댓글 UI 없음 | TicketDetail에 댓글 입력 추가 |
| I-2 | 파일 업로드 UI 없음 | TicketForm에 파일 선택/미리보기 |
| I-3 | 프로젝트/요청자 ID 직접 입력 | API 기반 드롭다운 |
| I-4 | PUT /api/users/:id 없음 | route 추가 |
| I-5 | PUT /api/sla-policies/:id 없음 | route 추가 |

### Act-2: Minor 8건 + UI 6건 수정 (91.2% → ~95%)
| # | Gap | Fix |
|---|-----|-----|
| M-1 | approval 모듈 미분리 | ApprovalPanel.tsx 추출 |
| M-2 | csat 모듈 미분리 | CSATForm.tsx + CSATDisplay 추출 |
| M-3 | clients/projects 미분리 | ClientList.tsx, ProjectList.tsx 추출 |
| M-4 | 프로젝트 필터 없음 | 프로젝트 드롭다운 추가 |
| M-5 | 기간 필터 없음 | from~to DatePicker + API 기간 필터 |
| M-6 | SLA 카운트다운 없음 | SLABadge 컴포넌트 (초과/임박/정상) |
| M-7 | 프로젝트별 요약 없음 | API + 대시보드 테이블 |
| M-8 | 다운로드 API 없음 | attachments/[id]/download route |
| UI-1 | 미인증 빈 화면 | middleware.ts → 로그인 리다이렉트 |
| UI-2 | /settings 404 | .next 캐시 클리어 |
| UI-3 | 담당자 설정 없음 | /agent-settings 페이지 |
| UI-4 | 관리자 설정 없음 | /admin-settings 페이지 |
| UI-5 | 로고 클릭 경로 | 역할별 대시보드 분기 |
| UI-6 | 접수→처리중 2단계 | accept API에서 ACCEPT+START 연속 |

---

## 5. Lessons Learned

1. **Next.js Route Group 충돌**: `(portal)`, `(agent)`, `(admin)`에서 같은 경로명 사용 불가 → prefix 필요 (e.g., `/agent-dashboard`)
2. **Prisma 7 Breaking Change**: datasource url이 schema에서 제거됨 → Prisma 6 사용
3. **XState 5 Context Factory**: 타입 복잡도가 높아 정적 context 객체로 전환
4. **미들웨어 필수**: SPA에서 API 인증만으로는 UX 불량 → 미들웨어로 페이지 수준 리다이렉트 추가
5. **접수+처리시작 통합**: 2단계(ACCEPT→START)를 분리하면 UI가 복잡해짐 → accept API에서 연속 실행
6. **Feature 모듈 분리 타이밍**: MVP 단계에서는 인라인이 효율적, 안정화 후 분리가 적절

---

## 6. Tech Stack

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
| Storage | AWS S3 (presigned URL) | - |
| Testing | curl-based API tests | 15/15 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-07 | Initial PDCA — 86% Match Rate |
| 1.1 | 2026-04-07 | Act-1 Important 5건 → 91.2% |
| 2.0 | 2026-04-08 | Act-2 Minor 8건 + UI 6건 → ~95%. 미들웨어, 설정, 프로젝트 필터, SLA 카운트다운, 모듈 분리, 대시보드 프로젝트 요약 |
