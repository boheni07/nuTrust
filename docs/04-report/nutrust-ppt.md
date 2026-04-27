---
marp: true
theme: default
paginate: true
backgroundColor: #F8FAFC
color: #0F172A
style: |
  section {
    font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
    padding: 48px 64px;
  }
  h1 { color: #2563EB; font-size: 2em; }
  h2 { color: #2563EB; border-bottom: 2px solid #2563EB; padding-bottom: 8px; }
  h3 { color: #1E40AF; }
  table { font-size: 0.85em; width: 100%; }
  th { background: #2563EB; color: white; }
  tr:nth-child(even) { background: #EFF6FF; }
  .highlight { color: #2563EB; font-weight: bold; }
  .green { color: #059669; }
  .red { color: #DC2626; }
  .tag { background: #DBEAFE; color: #1E40AF; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; }
---

<!-- _paginate: false -->
<!-- _backgroundColor: #2563EB -->
<!-- _color: white -->

# nuTrust ServiceDesk

## 티켓 기반 요청 관리를 통한
## 고객 신뢰 구축 플랫폼

---

**기간** 2026-04-07 ~ 2026-04-08  
**방법론** PDCA (PM → Plan → Design → Do → Check → Act)  
**최종 Match Rate** ~95% (서비스) / 100% (도메인)

---

## 목차

1. **문제 정의** — 왜 만들었나
2. **솔루션** — 무엇을 만들었나
3. **PDCA 여정** — 어떻게 만들었나
4. **구현 결과** — 얼마나 만들었나
5. **품질 검증** — 얼마나 잘 만들었나
6. **교훈** — 무엇을 배웠나

---

## 01. 문제 정의

### 고객 페인포인트 3가지

| # | 문제 | 영향 |
|---|------|------|
| **P1** | 요청 추적 불가 — 이메일/전화/메신저 분산 | 60~70% 재문의 발생 |
| **P2** | 처리 과정 불투명 — "블랙박스" 경험 | NPS 20~30점 하락 |
| **P3** | 완료 기준 불일치 — 일방적 완료 처리 | 재문의율 25~35% |

### 시장 공백

| 경쟁사 | 문제점 |
|--------|--------|
| ServiceNow | 도입 3~6개월, 과도하게 비쌈 |
| Zendesk / Freshdesk | 고객 승인 워크플로우 약함, 한국어 부족 |
| **nuTrust** | ✅ 적정 가격 + 고객 승인 기반 차별화 |

---

## 02. 솔루션 개요

### 핵심 가치: 고객 승인 기반 서비스 완결성

> 고객이 직접 결과를 확인·승인하는 구조로 **신뢰를 체계적으로 구축**

### 3역할 독립 워크스페이스

```
고객 포털          담당자 대시보드        관리자 콘솔
─────────────      ────────────────      ──────────────────
티켓 등록          배정 티켓 처리         SLA 모니터링
실시간 상태 추적    처리계획 등록          팀 성과 분석
결과 승인/반려      내부메모 소통          프로젝트 관리
CSAT 평가          상태 전환             보고서
```

### 성공 기준 (SC)

CSAT ≥ 4.0 &nbsp;|&nbsp; SLA ≥ 95% &nbsp;|&nbsp; 승인율 ≥ 85% &nbsp;|&nbsp; 재문의율 ≤ 8%

---

## 03. PDCA 여정 — 전체 흐름

```
PM          PLAN        DESIGN       DO           CHECK        ACT
────────    ────────    ──────────   ──────────   ──────────   ──────────
PRD 작성    SC 6개      아키텍처     8 모듈       Gap 분석     수정 2회
4개 에이전트 확정        3안 비교     구현         86% → 91%   → 95%
병렬 분석               Option C     95파일       15/15 PASS  SC 6/6 ✅
            ✅          ✅           ✅           ✅           ✅
```

**총 기간**: 2일 (2026-04-07 ~ 2026-04-08)

---

## 04. Session 1 — PM & Plan

### PM 에이전트 팀 병렬 분석

```
pm-lead (오케스트레이터)
  ├── pm-discovery  → 기회 발견 + OST
  ├── pm-strategy   → JTBD + Lean Canvas
  ├── pm-research   → 3 페르소나 + 5 경쟁사 + TAM/SAM/SOM
  └── pm-prd        → 8섹션 PRD 종합
```

### 주요 결정 — Success Criteria 6개

| # | 기준 | 구현 방식 |
|---|------|---------|
| SC-1 | 상태 머신 전체 흐름 | XState 5, 9 states |
| SC-2 | SLA 4근무시간 자동 접수 | 비즈니스 캘린더 + Cron |
| SC-3 | 연기 3중 가드 | 횟수 / 상태 / 날짜 |
| SC-4 | 파일 첨부 | S3 presigned URL |
| SC-5 | RBAC 3역할 | 미들웨어 기반 |
| SC-6 | 이메일 알림 | 7개 템플릿 |

---

## 05. Session 2 — Design

### 아키텍처 3안 비교 → Option C 선택

| | A: Monolithic | B: Clean/DDD | ✅ C: Feature-based |
|-|:---:|:---:|:---:|
| 파일 수 | ~40 | ~80+ | **~55** |
| 복잡도 | Low | High | **Medium** |
| 유지보수 | Medium | High | **High** |
| MVP 속도 | Fast | Slow | **Balanced** |

> **선택 이유**: MVP 속도와 장기 유지보수의 균형

### Design Anchor 확정

| 항목 | 결정 |
|------|------|
| Primary Color | `#2563EB` (Trust Blue) |
| Typography | Pretendard (KO) + Inter (EN) |
| Layout | Sidebar(256px) + Content |
| Tone | 전문적·신뢰감 — 파랑=신뢰, 초록=성공, 빨강=위험 |

---

## 06. Session 3 — Do: 구현

### 8 모듈 순차 구현

| 모듈 | 내용 |
|------|------|
| module-1 | Prisma 스키마, XState 머신, SLA 엔진, NextAuth |
| module-2 | 티켓 CRUD API |
| module-3 | 상태 전환 API (accept/start/complete/assign) |
| module-4 | 승인/연기 API (approve/reject/postpone) |
| module-5 | 댓글/이력/첨부/CSAT |
| module-6 | 관리자 API (clients/projects/teams/users/sla) |
| module-7 | 대시보드/리포트 API + Cron |
| module-8 | 16개 UI 페이지 |

### 구현 중 해결한 이슈

- **Prisma 7 Breaking Change** → v6 다운그레이드
- **XState 5 타입 오류** → 정적 context 객체로 전환
- **Route Group 경로 충돌** → role prefix 추가
- **접수 2단계 UX** → ACCEPT+START 통합 API

---

## 07. 티켓 상태 머신

### 9-State XState 5 설계

```
                    ┌─────────────┐
                    │  REGISTERED │
                    └──────┬──────┘
              ACCEPT / AUTO_ACCEPT
                    └──────▼──────┐
                    │  ACCEPTED   │
                    └──────┬──────┘
                         START
                    └──────▼──────┐
               ┌────│ IN_PROGRESS │────┐
         DELAY │    └──────┬──────┘    │ REQUEST_POSTPONEMENT
               ▼     REQUEST_COMPLETION│  (3-guard)
          ┌─────────┐       │          ▼
          │ DELAYED │       │   ┌──────────────────┐
          └────┬────┘       │   │POSTPONEMENT_REQ  │
    REQUEST_COMPLETION      │   └──────┬───────────┘
               │            │ APPROVE_POSTPONEMENT /
               ▼            │ REJECT_POSTPONEMENT → IN_PROGRESS
      ┌──────────────────┐  │
      │COMPLETION_REQ    │◄─┘
      └────────┬─────────┘
    APPROVE    │    REJECT → IN_PROGRESS
               ▼
          ┌──────────┐
          │ APPROVED │
          └────┬─────┘
          SUBMIT_CSAT
               ▼
          ┌────────┐
          │ CLOSED │ (final)
          └────────┘
```

---

## 08. Session 4 — Check & Act

### Gap 분석 결과

| 라운드 | Overall | Structural | Functional | Contract |
|--------|:-------:|:----------:|:----------:|:--------:|
| Check-1 | **86%** | 88% | 82% | 89% |
| Act-1 | **91.2%** | 90% | 90% | 93% |
| Act-2 | **~95%** | 95% | 95% | 95% |

### Act-1: 사용자 피드백 기반 수정

> "댓글 입력은 필수예요" → TicketDetail 댓글 UI 추가
> "이건 못 쓰겠는데요" (ID 직접 입력) → 드롭다운으로 교체

### Act-2: 추가 요청 반영

> "비인증 시 빈 화면이 나와요" → middleware.ts 추가
> SLA 카운트다운 배지 / 프로젝트·기간 필터 / 설정 페이지 추가

---

## 09. Session 5 — ticket-machine 점검

### Gap 분석 (도메인 레이어)

| Axis | Rate |
|------|:----:|
| Structural | 100% (4/4 파일) |
| Functional | 97% → **100%** |
| Contract | 100% (오류 코드 4개) |
| **Overall** | **98.8% → 100%** |

### 발견 및 수정: G-01

```typescript
// Before: 도달 불가 dead state 존재
REJECTED: {
  type: 'final',  // ← 어떤 전환도 이 state로 오지 않음
},

// After: 제거
// REJECTED는 types.ts / schema.prisma에서 DB 호환성 위해 유지
```

**교훈**: 설계 시 사용하지 않는 상태는 XState에서 제거, DB enum은 유지

---

## 10. Session 6 — 환경설정 & 서비스 실행

### 문제 → 해결 과정

```
로그인 실패
  └→ DB 연결 오류 확인 (P1000: Authentication failed)
        └→ PostgreSQL 미실행 확인 (포트 5432 응답 없음)
              └→ Docker로 PostgreSQL 컨테이너 실행
                    └→ prisma db push (스키마 적용)
                          └→ npx tsx prisma/seed.ts (시드)
                                └→ npm run dev → 정상 실행 ✅
```

### 실행 명령어 요약

```bash
# 1. DB 실행
docker run -d --name servicedesk-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=servicedesk -p 5432:5432 postgres:16-alpine

# 2. 스키마 + 시드
npx prisma db push && npx tsx prisma/seed.ts

# 3. 서버 실행
npm run dev  # → http://localhost:3000
```

---

## 11. 최종 산출물

### 규모 요약

| 항목 | 수량 |
|------|:----:|
| Source Files | **95** |
| Lines of Code | **~3,000** |
| API Endpoints | **46** |
| UI Pages | **16** |
| DB Models | **14** |
| Feature Modules | **6** |
| PDCA Documents | **7** |

### API 분포

```
Tickets (CRUD + Actions)  ████████████  13개
Clients / Projects        ████████      8개
Users / Teams / SLA       ██████        6개
Dashboard / Reports       ███           3개
Auth / CSAT / Upload      ██            기타
```

---

## 12. 성공 기준 최종 달성

| # | Success Criteria | 상태 | 증거 |
|---|-----------------|:----:|------|
| SC-1 | 상태 머신 전체 흐름 | ✅ | XState 9 states + 15/15 API test PASS |
| SC-2 | SLA 4근무시간 자동 접수 | ✅ | businessCalendar.ts + cron/route.ts |
| SC-3 | 연기 3중 가드 | ✅ | guards.ts + 3개 상세 오류 코드 |
| SC-4 | 파일 첨부 | ✅ | S3 presign + 댓글 첨부 + 다운로드 |
| SC-5 | RBAC 3역할 | ✅ | middleware.ts + requireAuth 전 API |
| SC-6 | 이메일 알림 | ✅ | 7개 템플릿 (dev console fallback) |

## **6 / 6 (100%) ✅**

---

## 13. 주요 교훈

| # | 교훈 | 핵심 |
|---|------|------|
| 1 | Next.js Route Group 경로 충돌 | role prefix 필수 |
| 2 | Prisma 메이저 버전 주의 | v6 고정 사용 |
| 3 | XState 5 Context 타입 복잡도 | 정적 객체 패턴 |
| 4 | 미들웨어는 필수 | 페이지 레벨 인증 |
| 5 | ACCEPT+START 통합 | 2단계 → 1 API |
| 6 | Feature 모듈 분리 타이밍 | MVP 후 분리 |
| 7 | Dead State 관리 | Check 단계에서 발견 |
| 8 | DB 환경 코드화 | Docker Compose 권장 |

---

## 14. 기술 스택

| Layer | Technology | Version |
|-------|-----------|:-------:|
| Framework | Next.js App Router | 16.2.2 |
| Database | PostgreSQL + Prisma | 16 + 6.19 |
| State Machine | XState | 5.30 |
| UI | Tailwind CSS + shadcn/ui | 4.x |
| Auth | NextAuth.js | v5 beta |
| Client State | Zustand + TanStack Query | 5.x |
| Forms | react-hook-form + Zod | 7.x + 4.x |
| Email | Resend | 6.x |
| Storage | AWS S3 (presigned URL) | — |
| Container | Docker | 29.2.1 |

---

<!-- _paginate: false -->
<!-- _backgroundColor: #2563EB -->
<!-- _color: white -->

## 프로젝트 완료

### nuTrust ServiceDesk

---

**Match Rate** ~95% (서비스) / **100%** (도메인)

**Success Criteria** 6 / 6

**기간** 2026-04-07 ~ 2026-04-08 (2일)

**산출물** 95파일 / 3,000 LOC / 46 API / 16 UI

---

*고객이 승인하는 서비스가 신뢰를 만든다*
