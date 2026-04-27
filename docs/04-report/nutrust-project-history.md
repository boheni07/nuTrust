# nuTrust / ServiceDesk — 전체 대화 + 진행 내역

> **프로젝트**: nuTrust / ServiceDesk
> **기간**: 2026-04-07 ~ 2026-04-08
> **목표**: 티켓 기반 요청 관리로 고객 신뢰를 구축하는 헬프데스크 플랫폼

---

## Session 1 — PM & Plan (2026-04-07)

**대화 흐름:**
- 사용자가 "티켓 기반 고객 신뢰 구축 플랫폼"을 만들고 싶다고 요청
- `/pdca pm` 실행 → PM Agent Team이 PRD 자동 생성
  - 핵심 발견: 고객 요청 분산(이메일/전화/메신저) + 처리 불투명 + 고객 승인 부재
  - 경쟁사 분석: ServiceNow(비싸고 복잡) vs Zendesk(승인 워크플로우 약함) → 시장 공백 확인
  - 타겟: 50~500명 한국 중견기업
- `/pdca plan` 실행 → 요구사항 확인 체크포인트
  - SC 6개 확정: CSAT ≥ 4.0 / SLA ≥ 95% / 승인율 ≥ 85% / 재문의율 ≤ 8%
  - MVP 범위 합의: 12 Must-Have (티켓 CRUD, 승인 워크플로우, CSAT, SLA, 대시보드, RBAC)

---

## Session 2 — Design (2026-04-07)

**대화 흐름:**
- `/pdca design` 실행 → 아키텍처 3안 제시

| 옵션 | 방식 | 파일 수 | 결정 |
|------|------|:-------:|:----:|
| A | Monolithic | ~40 | - |
| B | Clean/DDD | ~80+ | - |
| **C** | **Feature-based Modular** | **~55** | **✅ 선택** |

- 사용자가 Option C 선택 (MVP 속도 + 장기 유지보수 균형)
- 핵심 설계 확정:
  - XState 5 + 서버 사이드 `validateTransition()` 이중 구조
  - 9-state 티켓 머신 (REGISTERED → CLOSED)
  - 연기요청 3중 가드 (횟수/상태/날짜)
  - Design Anchor 확정: Trust Blue (`#2563EB`), Pretendard/Inter
- Session Guide 8 모듈로 분할

---

## Session 3 — Do: 구현 (2026-04-07)

**대화 흐름:**
- `/pdca do --scope module-1` 부터 순차 진행
- 구현 중 발생한 이슈들:

| 이슈 | 대화 내용 | 해결 |
|------|----------|------|
| Prisma 7 breaking change | datasource url이 schema에서 제거됨 | Prisma 6으로 다운그레이드 |
| XState 5 context 타입 복잡도 | generic 타입 추론 오류 | 정적 context 객체로 전환 |
| Next.js Route Group 경로 충돌 | `(portal)`, `(agent)`, `(admin)` 간 경로명 중복 | role prefix 필수 (`/agent-dashboard`) |
| 접수→처리시작 2단계 UX | 사용자: "한 번에 되면 좋겠는데요" | accept API에서 ACCEPT+START 연속 실행 |

- 8 모듈 완료: 95개 파일, ~3,000 LOC, 46 API, 16 페이지

---

## Session 4 — Check & Act (2026-04-07~08)

**대화 흐름:**

**Check-1 결과 (86%) 리뷰:**
- 사용자가 Important 5건 모두 수정 선택

| Gap | 대화 | 수정 |
|-----|------|------|
| I-1: 고객 댓글 UI 없음 | "댓글 입력은 필수예요" | TicketDetail에 추가 |
| I-2: 파일 업로드 UI 없음 | "첨부파일 선택도요" | TicketForm에 추가 |
| I-3: 드롭다운 없이 ID 직접 입력 | "이건 못 쓰겠는데요" | API 기반 드롭다운으로 교체 |
| I-4/I-5: PUT API 누락 | - | route 추가 |

**Act-2 (91.2% → ~95%) 추가 요청:**
- 사용자: 미들웨어 없이 비인증 시 빈 화면 → 리다이렉트 추가
- SLA 카운트다운 배지 요청
- 프로젝트/기간 필터 요청
- 관리자/담당자 설정 페이지 요청

**최종 결과**: SC 6/6, API 15/15 PASSED, Match Rate ~95% → 리포트 + 아카이브

---

## Session 5 — ticket-machine 점검 (2026-04-08)

**대화 전문:**

```
사용자: /bkit:pdca 점검하고 실행해줘

→ PDCA 상태 확인 (ticket-machine, do 단계)
→ 도메인 레이어 4개 파일 모두 구현 확인

질문: 무엇을 진행할까요?
사용자: Check 단계 실행 (Gap 분석)

→ 정적 Gap 분석 수행
→ G-01 발견: machine.ts의 REJECTED final state 도달 불가
→ Match Rate: 98.8%

사용자: 수정

→ REJECTED state를 machine.ts에서 제거
→ types.ts, schema.prisma는 DB 호환성 위해 유지
→ Match Rate: 100%

사용자: 네 (Report 진행)

→ ticket-machine.report.md 생성

사용자: 이 프로젝트 처음부터 지금까지 진행했던 내용을 정리해줘
사용자: 나와 대화했던 내용도 함께 정리해줘
사용자: 방금 내용을 md파일로 작성해줘

→ nutrust-project-history.md 생성 (현재 파일)
```

---

## 전체 타임라인 요약

| 날짜 | 세션 | 결과 |
|------|------|------|
| 2026-04-07 | PM + Plan | PRD + Plan 문서 확정 |
| 2026-04-07 | Design | Option C 아키텍처 + Design Anchor 확정 |
| 2026-04-07 | Do (8 modules) | 95파일 / 46 API / 16 UI 완성 |
| 2026-04-07~08 | Check + Act × 2 | 86% → 91.2% → 95%, SC 6/6 |
| 2026-04-08 | ticket-machine 점검 | G-01 수정, 100% Match Rate, Report 완료 |

---

## 최종 산출물

| 항목 | 수량 |
|------|:----:|
| Source Files | 95 |
| Lines of Code | ~3,000 |
| API Endpoints | 46 |
| UI Pages | 16 |
| DB Models | 14 |
| Feature Modules | 6 |
| PDCA Documents | 7 |

---

## 주요 교훈

1. **Next.js Route Group** 경로명 충돌 → role prefix 필수 (`/agent-dashboard`)
2. **Prisma 7 Breaking Change** → Prisma 6 사용
3. **XState 5 Context** 타입 복잡도 → 정적 context 객체 패턴
4. **미들웨어 필수** — API 인증만으로는 UX 불량, 페이지 레벨 리다이렉트 필요
5. **ACCEPT+START 통합** — 2단계 분리 시 UI 복잡도 증가
6. **Feature 모듈 분리** — MVP는 인라인으로 빠르게, 안정화 후 분리가 효율적
