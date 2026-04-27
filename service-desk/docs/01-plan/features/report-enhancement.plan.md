# Plan: 리포트 고도화 (report-enhancement)

**Feature**: report-enhancement  
**Phase**: Plan  
**Date**: 2026-04-08  
**Author**: Claude Code (Plan Plus)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | admin-reports 페이지가 SLA 준수율 숫자 1개 + CSAT 평균 숫자 1개만 표시. 날짜 필터 없고 시계열 데이터 없어 관리자가 "왜 지난달 SLA가 떨어졌는지" 파악 불가. |
| **Solution** | 날짜 범위 필터 + 일별 티켓 트렌드 + 주별 SLA 추이 + 카테고리별 지연 분석을 갖춘 전체 분석 대시보드로 전환. 신규 집계 API 1개 + 기존 API 2개 확장. |
| **Functional UX** | 관리자가 30/60/90일 기간을 선택하면 모든 차트가 즉시 필터 적용. recharts 기반 BarChart(일별 티켓량) + LineChart(SLA 주별 추이) + 가로 BarChart(카테고리별 지연률). |
| **Core Value** | 데이터 기반 의사결정 가능 — 어떤 기간에 어떤 카테고리 티켓이 지연되는지 시각화해 운영 개선 포인트 식별. |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 현재 리포트는 현재 시점 숫자만 보여줘 추세 분석 불가 — 운영 개선의 근거 데이터 부재 |
| **WHO** | MANAGER, SYSTEM_ADMIN — 데이터 기반 운영 의사결정이 필요한 역할 |
| **RISK** | recharts 신규 의존성 추가 / 날짜 필터별 DB 집계 쿼리 성능 |
| **SUCCESS** | 날짜 필터 적용 시 모든 차트 연동, 차트 렌더링 정상, 카테고리 분석 동작 |
| **SCOPE** | admin-reports 페이지 전면 재구성 + API 신규 1개 + 기존 2개 확장 |

---

## 1. 현재 상태

### 리포트 페이지 (`admin-reports/page.tsx`)
```
현재 구조:
├── SLA 준수율 카드 (숫자 1개, 건수)
└── CSAT 만족도 카드 (숫자 1개 + 간단 막대)

API: GET /api/reports/sla   — 날짜 필터 없음
     GET /api/csat          — 날짜 필터 없음
```

### 데이터 모델 (활용 가능한 필드)
- `Ticket`: createdAt, closedAt, plannedDueDate, status, category, priority
- `CSATRating`: rating, createdAt
- `TicketStatusHistory`: createdAt, fromStatus, toStatus

---

## 2. 요구사항

### FR-01 날짜 범위 필터
- 상단 필터 트레이: **30일 / 60일 / 90일 / 사용자 지정 (from~to 날짜 픽커)**
- 프로젝트 드롭다운 필터 (선택, 전체 기본)
- 필터 변경 시 모든 차트/통계 즉시 연동 갱신

### FR-02 일별 티켓 발생량 트렌드 차트
- BarChart: x축=날짜, y축=티켓 수
- 바 2개: 신규 등록(파란색) + 완료(초록색)
- 기간 30일이면 일별, 60일 이상이면 주별로 자동 집계 단위 조정

### FR-03 SLA 준수율 주별 트렌드 차트
- LineChart: x축=주차, y축=SLA 준수율(%)
- 목표 라인(90%) 점선 표시
- 현재 기간 전체 SLA% 숫자 + 변화 추이 방향 표시 (↑↓)

### FR-04 카테고리별 지연 분석
- 가로 BarChart: y축=카테고리 (접근권한/장애/서비스요청/문의/변경요청)
- x축=지연률(%)
- 각 바 위에 "지연 N건 / 전체 M건" 표시
- 색상: 지연률 50% 이상 빨강, 30~50% 주황, 30% 미만 초록

### FR-05 상단 KPI 카드 (필터 연동)
- SLA 준수율 / CSAT 평균 / 총 티켓 수 / 평균 해결 시간 (시간)
- 기존 카드 유지하되 필터 적용 결과로 갱신

---

## 3. 성공 기준 (Success Criteria)

| SC | 기준 | 측정 방법 |
|----|------|-----------|
| SC-1 | 날짜 필터 (30/60/90/사용자지정) 선택 시 모든 차트 갱신 | 필터 변경 → 차트 데이터 변경 확인 |
| SC-2 | 일별 티켓 트렌드 BarChart 렌더링 | 날짜별 등록/완료 막대 표시 |
| SC-3 | SLA 주별 LineChart + 90% 목표선 | 선 차트 + 점선 표시 |
| SC-4 | 카테고리별 지연률 가로 BarChart | 5개 카테고리 지연률 시각화 |
| SC-5 | KPI 카드 4개가 필터 기간에 맞게 갱신 | 기간 변경 시 숫자 변경 |
| SC-6 | TypeScript 오류 없음 | npx tsc --noEmit |

---

## 4. API 설계

### 4.1 신규 API: GET /api/reports/analytics

**파라미터**:
```
?period=30|60|90|custom
&from=2026-01-01   (period=custom일 때)
&to=2026-04-08     (period=custom일 때)
&projectId=xxx     (선택)
```

**응답 구조**:
```typescript
{
  data: {
    // FR-02: 일별/주별 티켓 집계
    dailyTickets: Array<{
      date: string;        // "2026-04-01"
      created: number;     // 신규 등록
      closed: number;      // 완료
    }>;
    // FR-03: 주별 SLA 준수율
    weeklySLA: Array<{
      week: string;        // "4/1~4/7"
      rate: number;        // 85
      compliant: number;
      total: number;
    }>;
    // FR-04: 카테고리별 지연
    categoryDelay: Array<{
      category: string;    // "INCIDENT"
      total: number;
      delayed: number;
      delayRate: number;   // 35.5
    }>;
    // FR-05: KPI 요약
    summary: {
      totalTickets: number;
      slaRate: number;
      csatAverage: number;
      avgResolutionHours: number;
    };
  }
}
```

### 4.2 기존 API 확장

| API | 추가 파라미터 |
|-----|-------------|
| `GET /api/reports/sla` | `from`, `to` 날짜 필터 |
| `GET /api/csat` | `from`, `to` 날짜 필터 |

---

## 5. 컴포넌트 설계

```
src/
├── app/api/reports/analytics/route.ts    [신규] 집계 API
├── app/(admin)/admin-reports/page.tsx    [전면 재구성]
└── features/reports/components/
    ├── ReportsDashboard.tsx              [신규] 메인 컴포넌트
    ├── FilterBar.tsx                     [신규] 기간/프로젝트 필터
    ├── DailyTicketChart.tsx              [신규] 일별 티켓 BarChart
    ├── WeeklySLAChart.tsx                [신규] SLA LineChart
    └── CategoryDelayChart.tsx            [신규] 카테고리 가로 BarChart
```

---

## 6. 의존성

```bash
# 신규 설치 필요
npm install recharts
npm install @types/recharts  # 또는 recharts 자체 타입 포함 확인
```

recharts 선택 이유:
- Next.js 클라이언트 컴포넌트와 호환성 검증됨
- BarChart, LineChart, ReferenceLine(목표선) 지원
- Tailwind와 색상 커스터마이징 쉬움

---

## 7. 구현 우선순위

| 순서 | 항목 | 이유 |
|------|------|------|
| 1 | 신규 API (`/api/reports/analytics`) | 모든 차트의 데이터 소스 |
| 2 | FilterBar + 상태 관리 | 전체 필터 연동의 기반 |
| 3 | DailyTicketChart (BarChart) | 가장 직관적, recharts 첫 검증 |
| 4 | WeeklySLAChart (LineChart + 목표선) | 핵심 비즈니스 지표 |
| 5 | CategoryDelayChart (가로 BarChart) | 운영 개선 포인트 시각화 |
| 6 | KPI 카드 4개 + 필터 연동 | 기존 카드 재구성 |

---

## 8. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| recharts SSR 오류 (Next.js) | HIGH | `'use client'` 컴포넌트 + dynamic import로 처리 |
| 날짜 범위 DB 집계 쿼리 성능 | MEDIUM | 90일 이내로 제한, Prisma 인덱스 활용 (createdAt) |
| 주별 SLA 집계 로직 복잡도 | MEDIUM | 날짜를 ISO 주차로 그룹핑하는 헬퍼 함수 분리 |

---

## 9. 범위 외 (Out of Scope — v1)

- 에이전트별 성과 랭킹 (처리 건수, SLA율, CSAT 점수별 정렬)
- SLA 위반 티켓 상세 목록 (드릴다운)
- CSV/PDF 내보내기
- 이메일 예약 발송 리포트
- 커스텀 대시보드 레이아웃 저장

---

## 10. 브레인스토밍 로그

| Phase | 결정 | 이유 |
|-------|------|------|
| Phase 2 (접근법) | Option B (전체 분석 대시보드) 선택 | A는 너무 단순, C는 절충안 — 완전한 분석 도구가 필요 |
| Phase 3 (YAGNI) | 에이전트 랭킹, SLA 위반 목록 Out of Scope | 4가지 핵심 기능으로 충분히 가치 제공 가능 |
| Phase 4 (아키텍처) | 신규 `/api/reports/analytics` + 기존 API 확장 병행 | 기존 API 호환성 유지하면서 집계 쿼리를 단일 엔드포인트로 최적화 |
