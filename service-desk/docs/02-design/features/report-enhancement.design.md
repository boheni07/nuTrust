# Design: 리포트 고도화 (report-enhancement)

**Feature**: report-enhancement  
**Phase**: Design  
**Date**: 2026-04-08  
**Architecture**: Option B — 컴포넌트 분리

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 현재 리포트는 현재 시점 숫자 2개만 — 추세/원인 분석 불가, 운영 의사결정 근거 없음 |
| **WHO** | MANAGER, SYSTEM_ADMIN — 데이터 기반 운영 의사결정 필요 역할 |
| **RISK** | recharts SSR 오류(Next.js) / 날짜 범위 DB 집계 쿼리 성능 |
| **SUCCESS** | 날짜 필터 → 모든 차트 연동, 차트 3종 렌더링, TypeScript 오류 없음 |
| **SCOPE** | admin-reports 전면 재구성 + API 신규 1개 + /api/reports/sla 날짜 필터 확장 |

---

## 1. Overview

### 1.1 아키텍처 결정 (Option B)

- **신규 API** 1개: `GET /api/reports/analytics` — 일별 티켓, 주별 SLA, 카테고리 지연 집계
- **기존 API 확장** 1개: `GET /api/reports/sla` — `from`/`to` 파라미터 추가 (CSAT API는 이미 지원)
- **features/reports/components/** 디렉토리 신규 생성 — 차트 컴포넌트 분리
- **page.tsx**는 라우터 역할만 (`<ReportsDashboard />` 렌더링)
- recharts 신규 설치 (`'use client'` 컴포넌트에서만 사용 — SSR 안전)

### 1.2 기술 스택

- recharts (BarChart, LineChart, ReferenceLine, Tooltip, ResponsiveContainer)
- date-fns (날짜 범위 계산, 주차 그룹핑) — 이미 설치됨
- TanStack Query (useQuery — 기존 패턴 유지)
- Tailwind CSS — 기존 디자인 시스템 유지

### 1.3 발견된 기존 API 상태

| API | 날짜 필터 | 비고 |
|-----|----------|------|
| `GET /api/csat` | ✅ 이미 from/to 지원 | 변경 불필요 |
| `GET /api/reports/sla` | ❌ 없음 | from/to 추가 필요 |
| `GET /api/reports/analytics` | ❌ 미존재 | 신규 생성 |

---

## 2. 컴포넌트 구조

```
src/
├── app/api/reports/analytics/route.ts       [신규]
├── app/(admin)/admin-reports/page.tsx        [수정 — ReportsDashboard 임포트만]
└── features/reports/components/
    ├── ReportsDashboard.tsx                  [신규 — 메인 컨테이너, 필터 상태 관리]
    ├── FilterBar.tsx                         [신규 — 기간/프로젝트 선택기]
    ├── KPISummary.tsx                        [신규 — 4개 KPI 카드]
    ├── DailyTicketChart.tsx                  [신규 — recharts BarChart]
    ├── WeeklySLAChart.tsx                    [신규 — recharts LineChart]
    └── CategoryDelayChart.tsx                [신규 — recharts 가로 BarChart]
```

---

## 3. API 설계

### 3.1 신규: GET /api/reports/analytics

**권한**: MANAGER, SYSTEM_ADMIN

**Query 파라미터**:
```
period   = "30" | "60" | "90" | "custom"  (기본: "30")
from     = "2026-01-01"  (period=custom 시 필수)
to       = "2026-04-08"  (period=custom 시 필수)
projectId = string        (선택, 기본: 전체)
```

**날짜 범위 계산 로직**:
```typescript
// period → 실제 from/to 변환
function getDateRange(period: string, from?: string, to?: string) {
  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);
  if (period === 'custom' && from && to) {
    return { from: new Date(from), to: new Date(to) };
  }
  const days = parseInt(period) || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  fromDate.setHours(0, 0, 0, 0);
  return { from: fromDate, to: toDate };
}
```

**응답 스키마**:
```typescript
{
  data: {
    dailyTickets: Array<{
      date: string;        // "2026-04-01" (YYYY-MM-DD)
      created: number;     // 그날 생성된 티켓 수
      closed: number;      // 그날 완료된 티켓 수
    }>;
    weeklySLA: Array<{
      week: string;        // "04/01" (월/일 기준 주 시작일)
      rate: number;        // 85 (정수 %)
      compliant: number;
      total: number;
    }>;
    categoryDelay: Array<{
      category: string;    // "INCIDENT" | "ACCESS_REQUEST" | ...
      categoryKo: string;  // "장애/오류" | "접근 권한" | ...
      total: number;
      delayed: number;
      delayRate: number;   // 35.5 (소수점 1자리)
    }>;
    summary: {
      totalTickets: number;       // 기간 내 생성 티켓 수
      slaRate: number;            // 정수 %
      csatAverage: number;        // 소수점 1자리
      avgResolutionHours: number; // 정수 (시간)
    };
  }
}
```

**DB 쿼리 전략**:
```typescript
// dailyTickets: groupBy createdAt(날짜), closedAt(날짜)
// Prisma raw groupBy는 날짜 단위 미지원 → findMany 후 JS에서 집계
const tickets = await prisma.ticket.findMany({
  where: { createdAt: { gte: from, lte: to }, ...(projectId && { projectId }) },
  select: { createdAt: true, closedAt: true, status: true, category: true, plannedDueDate: true },
});

// weeklySLA: closedAt 기준 주차별 SLA 계산
// categoryDelay: status='DELAYED' 또는 closedAt > plannedDueDate인 티켓 카테고리별 집계
```

**카테고리 지연 판단 기준**:
- 현재 `status === 'DELAYED'` 인 티켓
- 또는 완료(CLOSED)됐지만 `closedAt > plannedDueDate` 인 티켓

### 3.2 기존 확장: GET /api/reports/sla

현재: 날짜 필터 없음, 전체 CLOSED 티켓 대상

추가:
```typescript
const from = searchParams.get('from');
const to = searchParams.get('to');

const where: Record<string, unknown> = {
  status: 'CLOSED',
  plannedDueDate: { not: null },
};
if (from || to) {
  where.closedAt = {};
  if (from) (where.closedAt as any).gte = new Date(from);
  if (to) (where.closedAt as any).lte = new Date(to);
}
```

---

## 4. 컴포넌트 상세 설계

### 4.1 ReportsDashboard.tsx

```typescript
// 필터 상태 중앙 관리
type FilterState = {
  period: '30' | '60' | '90' | 'custom';
  from: string;  // "YYYY-MM-DD"
  to: string;    // "YYYY-MM-DD"
  projectId: string;
};

// 모든 하위 컴포넌트에 filters 전달
// useQuery: /api/reports/analytics?period=30&projectId=
// 로딩 상태 공유
```

### 4.2 FilterBar.tsx

```
[ 30일 | 60일 | 90일 | 사용자 지정 ]  [ 프로젝트: 전체 v ]
                                         (period=custom일 때)
                              [ 2026-01-01 ~ ] [ ~ 2026-04-08 ]
```

- 기간 버튼: `bg-blue-600 text-white` (선택) / `bg-white border` (미선택)
- 프로젝트 드롭다운: 기존 `/api/projects?limit=100` 재사용
- custom 선택 시 날짜 입력 필드 2개 펼침 (date type input)

### 4.3 KPISummary.tsx

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   총 티켓     │ │  SLA 준수율  │ │  CSAT 평균   │ │  평균 해결   │
│     156      │ │    84%       │ │    4.2       │ │   시간 18h   │
│ (30일 기간)  │ │              │ │   / 5.0      │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

- data 소스: `analyticsData.data.summary`
- 로딩 시: `-` 플레이스홀더

### 4.4 DailyTicketChart.tsx — recharts BarChart

```typescript
// Plan SC-2
<ResponsiveContainer width="100%" height={240}>
  <BarChart data={dailyTickets}>
    <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'M/d')} />
    <YAxis />
    <Tooltip />
    <Bar dataKey="created" fill="#3b82f6" name="신규" />
    <Bar dataKey="closed"  fill="#10b981" name="완료" />
    <Legend />
  </BarChart>
</ResponsiveContainer>
```

- 기간 60일 이상이면 API에서 주별 집계로 자동 전환 (date → "week" 레이블)
- x축 날짜 포맷: 30일=`M/d`, 60일+=`M/d주`

### 4.5 WeeklySLAChart.tsx — recharts LineChart

```typescript
// Plan SC-3
<ResponsiveContainer width="100%" height={240}>
  <LineChart data={weeklySLA}>
    <XAxis dataKey="week" />
    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
    <Tooltip formatter={(v) => `${v}%`} />
    <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 4" label="목표 90%" />
    <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
  </LineChart>
</ResponsiveContainer>
```

- 목표 90% 점선: `ReferenceLine y={90}`
- 현재 전체 SLA율 + 직전 기간 대비 변화 방향 (↑↓) 헤더에 표시

### 4.6 CategoryDelayChart.tsx — recharts 가로 BarChart

```typescript
// Plan SC-4
// 색상: delayRate >= 50 → red, 30~49 → amber, < 30 → emerald
<ResponsiveContainer width="100%" height={200}>
  <BarChart layout="vertical" data={categoryDelay}>
    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
    <YAxis type="category" dataKey="categoryKo" width={70} />
    <Tooltip formatter={(v) => `${v}%`} />
    <Bar dataKey="delayRate">
      {categoryDelay.map((entry) => (
        <Cell key={entry.category}
          fill={entry.delayRate >= 50 ? '#ef4444' : entry.delayRate >= 30 ? '#f59e0b' : '#10b981'} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

---

## 5. 날짜/주차 집계 로직

```typescript
// src/lib/utils/dateAggregation.ts (신규 유틸)

// 일별 집계 (dailyTickets)
export function aggregateByDay(tickets: TicketRaw[], from: Date, to: Date) {
  // 날짜 범위 내 모든 날짜 초기화 (created:0, closed:0)
  // tickets.forEach → createdAt 날짜로 created++, closedAt 날짜로 closed++
}

// 주별 SLA 집계 (weeklySLA)
export function aggregateWeeklySLA(tickets: TicketRaw[]) {
  // closedAt 기준 주 시작일(월요일) 계산
  // 주차별 그룹핑 → compliant / total → rate
  // date-fns startOfWeek, format 활용
}

// 카테고리별 지연 집계 (categoryDelay)
const CATEGORY_KO: Record<string, string> = {
  ACCESS_REQUEST: '접근 권한', INCIDENT: '장애/오류',
  SERVICE_REQUEST: '서비스 요청', INQUIRY: '문의',
  CHANGE_REQUEST: '변경 요청', OTHER: '기타',
};
export function aggregateCategoryDelay(tickets: TicketRaw[]) {
  // category별 그룹핑
  // delayed = status==='DELAYED' || (closedAt && plannedDueDate && closedAt > plannedDueDate)
  // delayRate = (delayed / total * 100).toFixed(1)
}
```

---

## 6. 페이지 레이아웃 (최종)

```
┌─────────────────────────────────────────────────────────────┐
│  리포트                                                       │
├─────────────────────────────────────────────────────────────┤
│  FilterBar: [ 30일 | 60일 | 90일 | 사용자 지정 ] [프로젝트 v] │
├───────────┬───────────┬───────────┬───────────┤
│  총 티켓  │  SLA 준수 │  CSAT 평균│  평균해결 │  KPISummary
│   156     │   84%     │   4.2     │   18h     │
├───────────┴───────────┴───────────┴───────────┤
│                                                 │
│   [일별 티켓 발생량 — BarChart]                  │  DailyTicketChart
│   신규(파랑) + 완료(초록) 그룹 막대               │
│                                                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────┐  │
│  │ SLA 주별 추이        │  │ 카테고리별 지연   │  │
│  │ LineChart + 목표선   │  │ 가로 BarChart    │  │
│  └─────────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 7. 의존성 설치

```bash
npm install recharts
```

recharts 버전: ^2.x (React 19 호환 확인 필요 — 필요 시 `--legacy-peer-deps`)

TypeScript 타입: recharts 2.x는 자체 타입 내장 (`@types/recharts` 불필요)

---

## 8. 테스트 계획

| 테스트 | 방법 |
|--------|------|
| API 응답 구조 | curl GET /api/reports/analytics?period=30 → data.dailyTickets 배열 확인 |
| 필터 연동 | 30일 → 60일 변경 시 차트 데이터 개수 변화 확인 |
| 빈 데이터 | 데이터 없는 기간 선택 시 빈 차트(오류 없음) 확인 |
| TypeScript | npx tsc --noEmit |
| recharts SSR | 빌드 오류 없음 확인 (`'use client'` 적용) |

---

## 9. 리스크 대응

| 리스크 | 대응 전략 |
|--------|----------|
| recharts React 19 호환성 오류 | `--legacy-peer-deps` 설치 옵션 / React 18 compat 확인 |
| 대용량 데이터 집계 속도 | 90일 이내로 제한, `take: 1000` 상한 설정, createdAt 인덱스 활용 |
| 주별 집계 경계 날짜 오류 | date-fns `startOfWeek({ weekStartsOn: 1 })` 월요일 기준 통일 |
| ResponsiveContainer 높이 0 | 부모에 명시적 높이 설정 (`h-64 클래스`) |

---

## 10. 구현 순서

### 10.1 Module Map

| 모듈 | 파일 | 의존성 |
|------|------|--------|
| **module-1** API + 유틸 | `route.ts`, `dateAggregation.ts`, SLA route 확장 | 없음 |
| **module-2** FilterBar + KPI | `ReportsDashboard.tsx`, `FilterBar.tsx`, `KPISummary.tsx` | module-1 |
| **module-3** 차트 3종 | `DailyTicketChart.tsx`, `WeeklySLAChart.tsx`, `CategoryDelayChart.tsx` | module-1,2 |
| **module-4** 통합 + page | `admin-reports/page.tsx` 수정 | module-1,2,3 |

### 11.3 Session Guide

```
세션 1: /pdca do report-enhancement --scope module-1
  → API 신규 + 집계 유틸 + SLA API 확장 + TypeScript 검증

세션 2: /pdca do report-enhancement --scope module-2,module-3,module-4
  → recharts 설치 + 컴포넌트 전체 + 통합
```

권장: 세션 1 완료 후 API curl 테스트 → 세션 2 진행
