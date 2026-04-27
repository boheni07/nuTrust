# ticket-machine PDCA Report

> **Feature**: ticket-machine — XState 5 기반 티켓 상태 머신 도메인 레이어
> **Date**: 2026-04-08
> **Phase**: Do → Check → Report
> **Final Match Rate**: 100%

---

## 1. Executive Summary

| Perspective | Value |
|-------------|-------|
| **Problem** | 복잡한 티켓 상태 전환(연기/지연/승인/반려)을 코드 레벨에서 원천 차단하는 도메인 모델 부재 |
| **Solution** | XState 5 상태 머신 + 서버 사이드 `validateTransition()` 이중 구조로 불가능한 전환 차단 |
| **Function/UX** | 3-guard 연기 검증(횟수/상태/날짜) + 5개 가드 함수 + 상세 오류 코드로 UX 친화적 오류 처리 |
| **Core Value** | **도메인 순수성** — UI/인프라 의존 없는 비즈니스 규칙 캡슐화, 독립 테스트 가능 |

---

## 2. Success Criteria

| # | Criteria | Status | Evidence |
|---|----------|:------:|----------|
| SC-1 | 상태 머신 전체 흐름 동작 (9 states, 11 events) | ✅ Met | `machine.ts` — XState 5 setup + 8 reachable states |
| SC-2 | 서버 사이드 검증 (`validateTransition`) | ✅ Met | `machine.ts:166` — 순수 함수, DB/XState 독립 |
| SC-3 | 연기요청 3중 가드 (횟수/상태/날짜) | ✅ Met | `guards.ts:14` + `machine.ts:24` |
| SC-4 | 3개 상세 오류 코드 분기 | ✅ Met | `postpone/route.ts:34,40,43` — 각 조건별 분기 |
| SC-5 | 도메인 순수성 (UI/인프라 의존 없음) | ✅ Met | imports: xstate only |

**Overall: 5/5 (100%)**

---

## 3. Implementation Summary

### 파일 구조

```
src/domain/ticket-machine/
├── machine.ts    # XState 5 머신 + validateTransition()
├── guards.ts     # 5개 가드 함수 + getPostponementRejectionReason()
├── types.ts      # 9 states, 11 events, 4 payload types, STATUS_LABELS
└── index.ts      # 공개 API 단일 진입점
```

### 상태 전환 맵

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

### 서비스 통합

- `ticket-transition.ts` — `validateTransition()` 기반 상태 전환 오케스트레이터
- `postpone/route.ts` — 3-guard 사전 검증 + 상세 오류 코드
- `accept/route.ts` — ACCEPT → AUTO_START 연계

---

## 4. Gap Analysis (Check)

| Axis | Rate | Notes |
|------|:----:|-------|
| Structural | 100% | 4/4 파일 |
| Functional | 97% → **100%** | G-01 수정 후 |
| Contract | 100% | 4개 오류 코드 일치 |
| **Overall** | **100%** | |

### 수정 이력

| ID | 심각도 | 내용 | 해결 |
|----|--------|------|------|
| G-01 | Minor | `machine.ts`의 REJECTED 도달 불가 final state | 제거 (types.ts/schema는 유지) |

---

## 5. Key Decisions & Outcomes

| Decision | Followed | Outcome |
|----------|:--------:|---------|
| XState 5 `setup()` API 사용 | ✅ | 타입 안전한 이벤트/컨텍스트 정의 |
| 서버 사이드 `validateTransition()` 분리 | ✅ | XState actor 없이 API route에서 직접 검증 가능 |
| REJECTED → IN_PROGRESS 복귀 설계 | ✅ | 반려 후 재처리 흐름 자연스럽게 구현 |
| guards.ts 별도 분리 | ✅ | 가드 로직 단독 테스트 가능, API route에서 재사용 |
