# ServiceDesk Planning Document

> **Summary**: 티켓 기반 요청 관리를 통한 고객 신뢰 구축 플랫폼
>
> **Project**: nuTrust / ServiceDesk
> **Version**: 1.0
> **Author**: Claude (PDCA Plan)
> **Date**: 2026-04-07
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 고객 요청이 이메일/전화/메신저에 분산되어 추적 불가. 처리 과정 불투명으로 고객 신뢰 저하. 일방적 완료 처리로 재문의 25~35% 발생. CSAT 피드백 루프 단절로 서비스 품질 개선 불가. |
| **Solution** | 프로젝트 기반 통합 티켓 관리 플랫폼. 고객사 > 부서 > 담당자 조직 계층과 프로젝트 단위로 티켓을 관리하며, 등록 → 접수(4근무시간 SLA) → 처리중/지연중 → 완료요청/연기요청 → 승인/반려 → 완료 상태 흐름을 통해 전체 라이프사이클을 투명하게 운영한다. |
| **Function/UX Effect** | 고객: 프로젝트별 포털에서 티켓 등록, 실시간 상태 추적, 처리 결과 승인/반려, CSAT 평가. 담당자: 프로젝트별 대시보드에서 배정 티켓 처리, 처리계획 등록, 내부메모/고객 소통 분리. 관리자: SLA 모니터링, 프로젝트별 성과 분석, 팀 배정 최적화. |
| **Core Value** | **고객 승인 기반 서비스 완결성** — 고객이 직접 결과를 확인하고 승인하는 구조를 통해 서비스 조직과 고객 간의 신뢰를 체계적으로 구축. 연기요청/반려 등 고객 통제권을 통해 단순 티켓 관리를 넘어선 신뢰 플랫폼. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 고객 요청 추적 불가 + 처리 불투명 + 고객 승인 부재로 인한 서비스 신뢰 저하. 50~500명 한국 중견기업에 적정 복잡도 솔루션 부재. |
| **WHO** | 고객(사내 서비스 이용자), 지원 담당자(IT 헬프데스크), 운영 관리자(서비스 운영팀장) |
| **RISK** | 고객 승인 워크플로우 채택 저항 (Critical) — 추가 승인 단계를 번거롭게 여길 가능성. 1-click UX + 자동 승인 옵션으로 대응. |
| **SUCCESS** | CSAT >= 4.0/5.0, SLA 준수율 >= 95%, 승인율 >= 85%, 재문의율 <= 8%, 접수 SLA 4시간 준수율 >= 90% |
| **SCOPE** | MVP: 12 Must-Have 기능 (티켓CRUD, 프로젝트 관리, 승인 워크플로우, CSAT, SLA, 대시보드, RBAC, 인증) / 2차: 지식기반, 이메일 통합, 고급 분석 / 3차: AI 분류, 채팅, 모바일 |

---

## 1. Overview

### 1.1 Purpose

고객 요청의 전체 라이프사이클(등록 → 접수 → 처리 → 승인 → 평가)을 단일 플랫폼에서 투명하게 관리하여, 고객과 서비스 조직 간의 신뢰를 체계적으로 구축한다.

### 1.2 Background

- 한국 중견기업(50~500명)의 IT 서비스 운영팀은 이메일/전화/메신저로 요청을 처리하여 추적이 불가능하고 서비스 품질 측정이 어렵다.
- ServiceNow는 과도하게 비싸고 복잡(도입 3~6개월), Zendesk/Freshdesk는 고객 승인 워크플로우가 약하고 한국어 지원이 부족하다.
- "고객 승인 기반 서비스 완결성"을 핵심 차별점으로, 적정 가격에 적정 복잡도를 제공하는 플랫폼이 시장 공백이다.

### 1.3 Related Documents

- PRD: `docs/00-pm/service-desk.prd.md`
- Lean Canvas, JTBD, OST: PRD Appendix 참조

---

## 2. Scope

### 2.1 In Scope (MVP)

- [ ] 프로젝트/고객사/부서/담당자 관리 체계
- [ ] 티켓 CRUD (등록, 목록, 상세, 수정)
- [ ] 등록 채널 기록 (온라인/전화/이메일 등)
- [ ] 4근무시간 접수 SLA (수동 접수 + 자동 접수)
- [ ] 처리계획(텍스트) 및 완료예정일(처리희망일 기반) 관리
- [ ] 티켓 상태 머신 (등록 → 접수 → 처리중/지연중 → 완료요청/연기요청 → 승인/반려 → 완료)
- [ ] 연기요청 (1회 제한, 완료예정일 전에만 가능, 지연중 상태에서 불가)
- [ ] 고객 승인/반려 워크플로우
- [ ] CSAT 통합 (승인 시 1~5점 + 텍스트 피드백)
- [ ] 댓글 (공개 댓글 / 내부 메모 분리)
- [ ] 파일 첨부 (티켓 등록 시 + 댓글 등록 시)
- [ ] 상태 변경 타임라인 이력
- [ ] 티켓 배정 (프로젝트별 사전 배정 담당자 풀 기반 수동/자동)
- [ ] 담당자 대시보드 (SLA 카운트다운, 우선순위 정렬)
- [ ] SLA 관리 (카테고리/우선순위별 정책)
- [ ] 기본 리포팅 (CSAT, SLA 준수율, 승인율, 처리량)
- [ ] RBAC (고객, 담당자, 관리자)
- [ ] 인증 (이메일/비밀번호 + SSO)

### 2.2 Out of Scope

- 전화/IVR 통합 (복잡도 대비 ROI 낮음)
- 소셜 미디어 채널 (B2B 내부 서비스 특성상 불필요)
- CMDB (엔터프라이즈 ITSM 기능, 장기 로드맵)
- 변경 관리 (ITIL 프로세스 전체는 범위 초과)
- AI 자동 분류/배정 (3차 출시 기능)
- 실시간 채팅, 모바일 앱 (3차 출시 기능)

---

## 3. Requirements

### 3.1 Functional Requirements

#### 3.1.1 프로젝트 및 조직 관리

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 고객사(Client) CRUD — 회사명, 연락처, 계약정보 관리 | High | Pending |
| FR-02 | 고객사 조직 구조 관리 — 부서(Department), 담당자(Contact) 계층 | High | Pending |
| FR-03 | 프로젝트(Project) CRUD — 프로젝트명, 설명, 기간, 상태 관리 | High | Pending |
| FR-04 | 프로젝트-고객사 연결 — 프로젝트에 고객사, 관련 부서/담당자 지정 | High | Pending |
| FR-05 | 프로젝트-지원팀 배정 — 프로젝트에 지원 담당자(팀/개인) 사전 배정 | High | Pending |

#### 3.1.2 티켓 관리

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-10 | 티켓 등록 — 프로젝트 선택, 제목, 설명, 카테고리, 우선순위, 처리희망일, 첨부파일 | High | Pending |
| FR-11 | 등록 채널 기록 — 온라인(고객 직접), 전화, 이메일 등 등록 방법 메타데이터 저장 | High | Pending |
| FR-12 | 대리 등록 — 전화/이메일 접수 시 지원 담당자가 고객 대신 티켓 등록, 원래 요청자 기록 | High | Pending |
| FR-13 | 티켓 목록 — 프로젝트별 필터, 상태별 필터, 검색, 정렬 | High | Pending |
| FR-14 | 티켓 상세 — 전체 이력(상태 타임라인, 댓글, 첨부파일) 단일 화면 표시 | High | Pending |
| FR-15 | 파일 첨부 — 티켓 등록 및 댓글에 다중 파일 첨부 (이미지, 문서, 스크린샷) | High | Pending |

#### 3.1.3 접수 및 처리

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-20 | 수동 접수 — 담당자가 4근무시간 이내 접수, 처리계획(텍스트) 등록 | High | Pending |
| FR-21 | 완료예정일 — 접수 시 처리희망일을 기본값으로 설정, 담당자 수정 가능 | High | Pending |
| FR-22 | 자동 접수 — 4근무시간 초과 시 시스템 자동 접수, 완료예정일 = 처리희망일 자동 설정 | High | Pending |
| FR-23 | 티켓 배정 — 프로젝트별 사전 배정 담당자 풀에서 수동 배정 또는 규칙 기반 자동 배정 | High | Pending |
| FR-24 | 재배정 — 담당자 변경 시 이력 기록, 알림 발송 | Medium | Pending |
| FR-25 | 처리계획 수정 — 진행 중 처리계획 업데이트 가능, 변경 이력 기록 | Medium | Pending |

#### 3.1.4 상태 머신 및 워크플로우

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-30 | 티켓 상태 흐름 — 등록 → 접수 → 처리중 → 완료요청 → 승인 → 완료 (정상 흐름) | High | Pending |
| FR-31 | 지연 자동 전환 — 완료예정일 경과 시 처리중 → 지연중 자동 전환 | High | Pending |
| FR-32 | 연기요청 — 처리중 상태에서 완료예정일 전에만 신청 가능, 최대 1회 제한 | High | Pending |
| FR-33 | 연기요청 제한 — 지연중 상태에서 연기요청 불가 | High | Pending |
| FR-34 | 연기 승인/반려 — 고객이 연기요청을 승인(새 완료예정일 적용) 또는 반려 | High | Pending |
| FR-35 | 완료요청 — 담당자가 처리 완료 후 고객에게 승인 요청 발송 | High | Pending |
| FR-36 | 완료 승인 — 고객이 결과 확인 후 승인 → CSAT 평가 → 완료 상태 전환 | High | Pending |
| FR-37 | 완료 반려 — 고객이 반려 시 사유 입력, 처리중으로 복귀, 동일 티켓에서 재작업 | High | Pending |
| FR-38 | 상태 타임라인 — 모든 상태 변경 시점, 변경자, 소요 시간 자동 기록 | High | Pending |

#### 3.1.5 소통 및 이력

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-40 | 공개 댓글 — 고객과 담당자 간 양방향 소통, 이메일 알림 연동 | High | Pending |
| FR-41 | 내부 메모 — 지원팀 내부 전용 메모, 고객에게 비공개 | High | Pending |
| FR-42 | 댓글 파일 첨부 — 댓글 등록 시 다중 파일 첨부 | High | Pending |
| FR-43 | 이메일 알림 — 상태 변경, 새 댓글, 승인 요청, 연기 요청 시 자동 이메일 발송 | High | Pending |

#### 3.1.6 CSAT 및 리포팅

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-50 | CSAT 수집 — 승인 완료 시 자동 1~5점 평가 + 선택적 텍스트 피드백 | High | Pending |
| FR-51 | 기본 대시보드 — CSAT 평균, SLA 준수율, 승인율, 티켓 처리량, 연기율 | High | Pending |
| FR-52 | 프로젝트별 리포팅 — 프로젝트 단위 KPI 집계 | High | Pending |
| FR-53 | 담당자 대시보드 — 배정 티켓 목록, SLA 카운트다운, 우선순위 정렬, 빠른 액션 | High | Pending |

#### 3.1.7 사용자 관리 및 인증

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-60 | RBAC — 시스템 관리자, 운영 관리자, 지원 담당자, 고객 역할 분리 | High | Pending |
| FR-61 | 인증 — 이메일/비밀번호 인증 | High | Pending |
| FR-62 | SSO 지원 — SAML/OIDC 기반 SSO 연동 | Medium | Pending |
| FR-63 | 팀 관리 — 지원 팀/그룹 생성, 팀별 프로젝트 배정 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | API 응답 시간 < 300ms (P95) | APM 모니터링 |
| Performance | 동시 사용자 500명 지원 | 부하 테스트 |
| Scalability | 멀티 테넌트 아키텍처, 수평 확장 가능 | 아키텍처 리뷰 |
| Security | OWASP Top 10 준수 | 보안 스캔, 코드 리뷰 |
| Security | 데이터 암호화 (전송: TLS 1.3, 저장: AES-256) | 인프라 검증 |
| Security | 테넌트 간 데이터 격리 (Row-level Security) | 자동화 테스트 |
| Availability | 99.9% 업타임 SLA | 모니터링 |
| i18n | 한국어 기본, 영어 지원 (추후 일본어) | UI 검증 |
| Accessibility | WCAG 2.1 AA | Lighthouse, axe |
| File Upload | 파일 당 최대 50MB, 티켓 당 최대 10개 | 업로드 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 Functional Requirements (FR-01 ~ FR-63) 구현 완료
- [ ] 티켓 상태 머신 전체 흐름 동작 검증 (정상 + 예외 경로)
- [ ] 접수 SLA 4근무시간 자동 접수 동작 확인
- [ ] 연기요청 1회 제한 및 조건 검증 (지연중 불가, 완료예정일 전만)
- [ ] 파일 첨부 업로드/다운로드 동작 확인
- [ ] 3개 역할(고객/담당자/관리자) 기능 접근 권한 검증
- [ ] 이메일 알림 발송 정상 동작
- [ ] 단위/통합 테스트 작성 및 통과
- [ ] 코드 리뷰 완료

### 4.2 Quality Criteria

- [ ] 테스트 커버리지 80% 이상
- [ ] Zero lint errors
- [ ] 빌드 성공
- [ ] 보안 스캔 통과 (Critical/High 없음)

### 4.3 Business Success Criteria

| Criteria | Target (6개월) | Target (12개월) |
|----------|----------------|-----------------|
| CSAT | >= 3.8/5.0 | >= 4.2/5.0 |
| SLA 준수율 | >= 85% | >= 95% |
| 승인율 (첫 번째 시도) | >= 75% | >= 85% |
| 재문의율 | <= 15% | <= 8% |
| CSAT 수집률 | >= 40% | >= 60% |
| 접수 SLA 4시간 준수율 | >= 80% | >= 90% |

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 고객 승인 워크플로우 채택 저항 — 승인 단계를 번거롭게 여김 | Critical | High | 1-click 승인 UX, 이메일 내 승인 버튼, 미응답 시 Auto-Approve 옵션 |
| MVP 개발 지연 — 핵심 기능 범위가 넓어 일정 초과 | High | Medium | Must-Have 12개 기능에 집중, 상태 머신 먼저 구현, 리포팅은 기본만 |
| 변화 관리 실패 — 기존 이메일/전화 관행 고수 | High | High | 점진적 도입 가이드, 무료 온보딩 컨설팅, 성공 지표 사전 정의 |
| 상태 머신 복잡도 — 연기/지연/반려 등 엣지 케이스 많음 | Medium | Medium | State Machine 라이브러리 활용 (XState), 상태 전환 단위 테스트 100% |
| 4근무시간 SLA 계산 복잡도 — 공휴일/근무시간 고려 필요 | Medium | Medium | 비즈니스 캘린더 라이브러리 도입, 근무시간 설정 관리 기능 |
| 멀티 테넌트 데이터 격리 실패 | Critical | Low | Row-level Security + Tenant ID 기반, 테넌트 간 접근 불가 자동 테스트 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

> 신규 프로젝트이므로 기존 소비자 없음. 새로 생성할 핵심 리소스 정의.

| Resource | Type | Description |
|----------|------|-------------|
| Client (고객사) | DB Model | 고객사 정보 — 회사명, 연락처, 계약정보 |
| Department (부서) | DB Model | 고객사 내 부서 — 부서명, 상위조직 |
| Contact (담당자) | DB Model | 고객사 담당자 — 이름, 이메일, 전화, 부서 소속 |
| Project (프로젝트) | DB Model | 프로젝트 — 프로젝트명, 기간, 고객사, 상태 |
| ProjectAssignment | DB Model | 프로젝트-지원담당자 배정 매핑 |
| Ticket (티켓) | DB Model | 티켓 — 프로젝트, 요청자, 상태, 우선순위, 처리희망일, 완료예정일, 채널 |
| TicketStatusHistory | DB Model | 상태 변경 타임라인 이력 |
| Comment (댓글) | DB Model | 공개 댓글 + 내부 메모 — 타입, 내용, 작성자, 첨부파일 |
| Attachment (첨부파일) | DB Model + Storage | 파일 메타데이터 + 스토리지 |
| ActionPlan (처리계획) | DB Model | 처리계획 텍스트 + 변경 이력 |
| PostponementRequest | DB Model | 연기요청 — 요청일, 새 완료예정일, 사유, 승인상태 |
| CSATRating | DB Model | 만족도 평가 — 점수(1~5), 텍스트 피드백, 티켓 ID |
| SLAPolicy | DB Model | SLA 정책 — 카테고리/우선순위별 응답/해결 시간 |
| User | DB Model | 사용자 — 역할(RBAC), 인증정보, 소속 |

### 6.2 Verification

- [ ] 신규 프로젝트 — 기존 소비자 영향 없음
- [ ] 멀티 테넌트 데이터 격리 설계 검증 필요

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | |
| **Dynamic** | Feature-based modules, BaaS | Web apps with backend | |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic, complex systems | **X** |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / React / Vue | Next.js (App Router) | 풀스택, SSR/SSG, API Routes, 한국 생태계 강세 |
| Backend | Custom Server / BaaS / Serverless | Custom Server (Next.js API + Prisma) | 상태 머신 복잡도, 비즈니스 캘린더 로직 필요 |
| Database | PostgreSQL / MySQL / MongoDB | PostgreSQL | Row-level Security, JSON 지원, 멀티 테넌트 적합 |
| ORM | Prisma / TypeORM / Drizzle | Prisma | 타입 안전성, 마이그레이션 관리, 생산성 |
| State Machine | XState / Custom / zustand | XState | 복잡한 티켓 상태 흐름, 시각화, 가드 조건 지원 |
| State Management | Context / Zustand / Redux | Zustand | 경량, 보일러플레이트 최소, 충분한 기능 |
| API Client | fetch / axios / react-query | TanStack Query + fetch | 서버 상태 관리, 캐싱, 낙관적 업데이트 |
| Form Handling | react-hook-form / formik | react-hook-form + zod | 성능, 유효성 검증 통합 |
| Styling | Tailwind / CSS Modules / styled | Tailwind CSS + shadcn/ui | 생산성, 일관성, 컴포넌트 라이브러리 |
| Testing | Jest / Vitest / Playwright | Vitest + Playwright | 단위(Vitest) + E2E(Playwright) |
| File Storage | S3 / GCS / Local | AWS S3 (or compatible) | Presigned URL, CDN 연동, 확장성 |
| Email | SendGrid / SES / Resend | Resend | DX 우수, 합리적 가격, 템플릿 지원 |
| Auth | NextAuth / Clerk / Custom | NextAuth.js | 유연성, SSO(SAML/OIDC) 지원, 커스터마이징 |
| Deployment | Vercel / AWS / Docker | Docker + AWS (ECS/EKS) | 엔터프라이즈 요구사항, 멀티 테넌트, 확장성 |

### 7.3 Clean Architecture Approach

```
Selected Level: Enterprise

src/
├── presentation/          # UI Layer
│   ├── components/        # Shared UI components (shadcn/ui)
│   ├── features/          # Feature-based pages
│   │   ├── tickets/       # 티켓 관리 UI
│   │   ├── projects/      # 프로젝트 관리 UI
│   │   ├── clients/       # 고객사 관리 UI
│   │   ├── dashboard/     # 대시보드
│   │   └── admin/         # 관리자 설정
│   └── layouts/           # 레이아웃 (고객포털 / 담당자 / 관리자)
├── application/           # Use Cases / Business Logic
│   ├── tickets/           # 티켓 생성, 상태 전환, 배정
│   ├── approval/          # 승인/반려/연기 워크플로우
│   ├── sla/               # SLA 계산, 자동 접수, 지연 감지
│   ├── csat/              # CSAT 수집, 집계
│   └── notification/      # 이메일 알림
├── domain/                # Domain Models / State Machine
│   ├── models/            # Ticket, Project, Client, User
│   ├── state-machine/     # XState 티켓 상태 머신
│   ├── events/            # Domain Events
│   └── value-objects/     # BusinessCalendar, SLATimer
├── infrastructure/        # External Services
│   ├── database/          # Prisma schema, migrations
│   ├── storage/           # S3 파일 업로드
│   ├── email/             # Resend 이메일 전송
│   └── auth/              # NextAuth 설정
└── shared/                # Cross-cutting
    ├── types/             # 공유 타입 정의
    ├── utils/             # 유틸리티
    └── constants/         # 상수
```

---

## 8. Ticket State Machine (핵심 설계)

### 8.1 상태 정의

| State | 한글 | Description |
|-------|------|-------------|
| `REGISTERED` | 등록 | 고객/담당자가 티켓 등록 완료 |
| `ACCEPTED` | 접수 | 담당자 수동 접수 또는 4근무시간 후 자동 접수 |
| `IN_PROGRESS` | 처리중 | 담당자가 처리 진행 중 |
| `DELAYED` | 지연중 | 완료예정일 경과 → 시스템 자동 전환 |
| `COMPLETION_REQUESTED` | 완료요청 | 담당자가 처리 완료, 고객 승인 대기 |
| `POSTPONEMENT_REQUESTED` | 연기요청 | 담당자가 완료예정일 연기 요청, 고객 승인 대기 |
| `APPROVED` | 승인 | 고객이 완료 승인 → CSAT 수집 |
| `REJECTED` | 반려 | 고객이 완료 반려 (사유 입력) → 처리중 복귀 |
| `CLOSED` | 완료 | CSAT 수집 완료, 티켓 종료 |

### 8.2 상태 전환 규칙

```
REGISTERED ──(담당자 접수)──→ ACCEPTED
REGISTERED ──(4근무시간 초과)──→ ACCEPTED [자동, 완료예정일=처리희망일]

ACCEPTED ──(처리 시작)──→ IN_PROGRESS

IN_PROGRESS ──(완료예정일 경과)──→ DELAYED [자동]
IN_PROGRESS ──(담당자 완료처리)──→ COMPLETION_REQUESTED
IN_PROGRESS ──(담당자 연기신청)──→ POSTPONEMENT_REQUESTED
    [Guard: 완료예정일 전 AND 연기횟수 == 0 AND 상태 != DELAYED]

DELAYED ──(담당자 완료처리)──→ COMPLETION_REQUESTED
DELAYED ──(연기요청)──→ ❌ 불가

COMPLETION_REQUESTED ──(고객 승인)──→ APPROVED
COMPLETION_REQUESTED ──(고객 반려)──→ IN_PROGRESS [반려 사유 기록]

POSTPONEMENT_REQUESTED ──(고객 승인)──→ IN_PROGRESS [새 완료예정일 적용]
POSTPONEMENT_REQUESTED ──(고객 반려)──→ IN_PROGRESS [기존 완료예정일 유지]

APPROVED ──(CSAT 수집 완료)──→ CLOSED
```

### 8.3 자동화 규칙

| Rule | Trigger | Action |
|------|---------|--------|
| 자동 접수 | 등록 후 4근무시간 경과 | REGISTERED → ACCEPTED, 완료예정일 = 처리희망일 |
| 지연 전환 | 완료예정일 경과 (처리중 상태) | IN_PROGRESS → DELAYED |
| 연기 가드 | 연기요청 시도 | 완료예정일 전 AND 연기횟수 < 1 AND 상태 != DELAYED 검증 |
| CSAT 트리거 | 고객 완료 승인 시 | CSAT 평가 폼 자동 표시 |
| 알림 발송 | 상태 변경 시 | 관련 당사자에게 이메일 알림 |

---

## 9. Convention Prerequisites

### 9.1 Existing Project Conventions

- [ ] `CLAUDE.md` — 없음 (신규 프로젝트, 생성 필요)
- [ ] `docs/01-plan/conventions.md` — 없음 (생성 필요)
- [ ] ESLint configuration — 없음 (생성 필요)
- [ ] Prettier configuration — 없음 (생성 필요)
- [ ] TypeScript configuration — 없음 (생성 필요)

### 9.2 Conventions to Define

| Category | To Define | Priority |
|----------|-----------|:--------:|
| **Naming** | camelCase (변수/함수), PascalCase (컴포넌트/타입), UPPER_SNAKE (상수/enum) | High |
| **Folder structure** | Enterprise Clean Architecture (presentation/application/domain/infrastructure) | High |
| **Import order** | react → next → external → @/domain → @/application → @/presentation → relative | Medium |
| **Error handling** | Result<T, E> 패턴, Domain Error 클래스 | Medium |
| **State naming** | 영문 UPPER_SNAKE (REGISTERED, IN_PROGRESS), 한글 표시명 별도 관리 | High |

### 9.3 Environment Variables Needed

| Variable | Purpose | Scope |
|----------|---------|-------|
| `DATABASE_URL` | PostgreSQL 연결 | Server |
| `NEXTAUTH_SECRET` | NextAuth 시크릿 | Server |
| `NEXTAUTH_URL` | NextAuth 콜백 URL | Server |
| `S3_BUCKET` | 파일 업로드 버킷 | Server |
| `S3_REGION` | S3 리전 | Server |
| `S3_ACCESS_KEY_ID` | S3 액세스 키 | Server |
| `S3_SECRET_ACCESS_KEY` | S3 시크릿 키 | Server |
| `RESEND_API_KEY` | 이메일 발송 API 키 | Server |
| `NEXT_PUBLIC_APP_URL` | 프론트엔드 URL | Client |

---

## 10. Next Steps

1. [ ] Design 문서 작성 (`/pdca design service-desk`)
2. [ ] 팀 리뷰 및 승인
3. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-07 | Initial draft — PRD 기반 Plan 작성, 사용자 요구사항 반영 (프로젝트 구조, 상태 머신, 연기 1회 제한, 4근무시간 SLA, 파일 첨부) | Claude (PDCA Plan) |
