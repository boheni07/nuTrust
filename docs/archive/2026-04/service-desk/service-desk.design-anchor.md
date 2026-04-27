# ServiceDesk Design Anchor

> **Locked**: 2026-04-07
> **Theme**: Trust Blue — 신뢰/전문성/안정감
> **Enforcement**: 모든 UI 페이지에서 이 토큰을 준수해야 함

---

## 1. Colors

### Primary Palette

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--primary` | `#2563EB` | `blue-600` | 주요 버튼, 링크, 활성 상태, 브랜드 강조 |
| `--primary-hover` | `#1D4ED8` | `blue-700` | 주요 버튼 호버 |
| `--primary-light` | `#DBEAFE` | `blue-100` | 선택된 항목 배경, 포커스 링 |
| `--primary-50` | `#EFF6FF` | `blue-50` | 정보 알림 배경, 연한 강조 |

### Semantic Colors

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--accent` | `#059669` | `emerald-600` | 성공, 승인(Approved), 정상 SLA |
| `--accent-light` | `#D1FAE5` | `emerald-100` | 성공 배경 |
| `--danger` | `#DC2626` | `red-600` | 에러, SLA 위반, 지연중(Delayed) |
| `--danger-light` | `#FEE2E2` | `red-100` | 에러 배경 |
| `--warning` | `#D97706` | `amber-600` | 경고, SLA 임박, 연기요청 |
| `--warning-light` | `#FEF3C7` | `amber-100` | 경고 배경 |
| `--info` | `#2563EB` | `blue-600` | 정보, 처리중(In Progress) |
| `--info-light` | `#DBEAFE` | `blue-100` | 정보 배경 |

### Neutral Colors

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--bg` | `#F8FAFC` | `slate-50` | 페이지 배경 |
| `--surface` | `#FFFFFF` | `white` | 카드, 모달, 패널 배경 |
| `--border` | `#E2E8F0` | `slate-200` | 기본 테두리 |
| `--border-strong` | `#CBD5E1` | `slate-300` | 강조 테두리, 입력 필드 포커스 |
| `--text` | `#0F172A` | `slate-900` | 기본 텍스트 |
| `--text-secondary` | `#475569` | `slate-600` | 보조 텍스트, 레이블 |
| `--text-muted` | `#64748B` | `slate-500` | 비활성 텍스트, 플레이스홀더 |
| `--text-disabled` | `#94A3B8` | `slate-400` | 비활성 요소 |

### Ticket Status Colors

| Status | Badge Color | Badge BG | Tailwind Classes |
|--------|------------|----------|------------------|
| 등록 (REGISTERED) | `#64748B` | `#F1F5F9` | `text-slate-500 bg-slate-100` |
| 접수 (ACCEPTED) | `#2563EB` | `#DBEAFE` | `text-blue-600 bg-blue-100` |
| 처리중 (IN_PROGRESS) | `#2563EB` | `#EFF6FF` | `text-blue-600 bg-blue-50` |
| 지연중 (DELAYED) | `#DC2626` | `#FEE2E2` | `text-red-600 bg-red-100` |
| 완료요청 (COMPLETION_REQUESTED) | `#7C3AED` | `#EDE9FE` | `text-violet-600 bg-violet-100` |
| 연기요청 (POSTPONEMENT_REQUESTED) | `#D97706` | `#FEF3C7` | `text-amber-600 bg-amber-100` |
| 승인 (APPROVED) | `#059669` | `#D1FAE5` | `text-emerald-600 bg-emerald-100` |
| 반려 (REJECTED) | `#DC2626` | `#FEE2E2` | `text-red-600 bg-red-100` |
| 완료 (CLOSED) | `#059669` | `#ECFDF5` | `text-emerald-600 bg-emerald-50` |

### Priority Colors

| Priority | Color | Badge BG | Tailwind |
|----------|-------|----------|----------|
| LOW | `#64748B` | `#F1F5F9` | `text-slate-500 bg-slate-100` |
| MEDIUM | `#2563EB` | `#DBEAFE` | `text-blue-600 bg-blue-100` |
| HIGH | `#D97706` | `#FEF3C7` | `text-amber-600 bg-amber-100` |
| URGENT | `#DC2626` | `#FEE2E2` | `text-red-600 bg-red-100` |

### SLA Indicator Colors

| State | Color | Meaning |
|-------|-------|---------|
| Normal | `#059669` (emerald) | SLA 충분한 여유 (>50% 남음) |
| Warning | `#D97706` (amber) | SLA 임박 (<50% 남음) |
| Critical | `#DC2626` (red) | SLA 위반 또는 매우 임박 (<10%) |

---

## 2. Typography

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--font-sans` | `'Pretendard', 'Inter', system-ui, sans-serif` | `font-sans` | 기본 본문 (한글 Pretendard, 영문 Inter) |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | `font-mono` | 티켓 번호, 코드 |

### Font Sizes

| Token | Size | Line Height | Tailwind | Usage |
|-------|------|-------------|----------|-------|
| `--text-xs` | 12px | 16px | `text-xs` | 뱃지, 메타데이터 |
| `--text-sm` | 14px | 20px | `text-sm` | 보조 텍스트, 테이블 셀 |
| `--text-base` | 16px | 24px | `text-base` | 기본 본문 |
| `--text-lg` | 18px | 28px | `text-lg` | 카드 제목 |
| `--text-xl` | 20px | 28px | `text-xl` | 섹션 제목 |
| `--text-2xl` | 24px | 32px | `text-2xl` | 페이지 제목 |
| `--text-3xl` | 30px | 36px | `text-3xl` | 대시보드 숫자 (KPI) |

### Font Weights

| Weight | Tailwind | Usage |
|--------|----------|-------|
| 400 (Regular) | `font-normal` | 본문 텍스트 |
| 500 (Medium) | `font-medium` | 레이블, 테이블 헤더, 뱃지 |
| 600 (Semibold) | `font-semibold` | 카드 제목, 섹션 제목 |
| 700 (Bold) | `font-bold` | 페이지 제목, 대시보드 KPI 숫자 |

---

## 3. Spacing

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Base unit | 4px | - | 모든 간격의 기본 단위 |
| `--space-1` | 4px | `p-1` / `gap-1` | 아이콘-텍스트 간격 |
| `--space-2` | 8px | `p-2` / `gap-2` | 뱃지 내부, 인라인 간격 |
| `--space-3` | 12px | `p-3` / `gap-3` | 작은 카드 패딩 |
| `--space-4` | 16px | `p-4` / `gap-4` | 기본 카드 패딩, 리스트 항목 간격 |
| `--space-5` | 20px | `p-5` / `gap-5` | 카드 내부 섹션 간격 |
| `--space-6` | 24px | `p-6` / `gap-6` | 카드/패널 패딩 (기본) |
| `--space-8` | 32px | `p-8` / `gap-8` | 섹션 간 간격 |
| `--space-12` | 48px | `p-12` | 페이지 상단 여백 |

### Layout Spacing

| Element | Value | Description |
|---------|-------|-------------|
| Sidebar 너비 | 256px (16rem) | `w-64` |
| Sidebar 축소 | 64px (4rem) | `w-16` (아이콘만) |
| Header 높이 | 64px (4rem) | `h-16` |
| 메인 콘텐츠 패딩 | 24px | `p-6` |
| 카드 간격 | 16px | `gap-4` |
| 테이블 셀 패딩 | 12px 16px | `px-4 py-3` |

---

## 4. Border Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--radius-sm` | 4px | `rounded-sm` | 뱃지, 작은 요소 |
| `--radius` | 6px | `rounded-md` | 입력 필드, 버튼 (기본) |
| `--radius-lg` | 8px | `rounded-lg` | 카드, 드롭다운 |
| `--radius-xl` | 12px | `rounded-xl` | 모달, 대형 패널 |
| `--radius-full` | 9999px | `rounded-full` | 아바타, 뱃지 (pill) |

---

## 5. Shadows

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | 버튼, 입력 필드 |
| `--shadow` | `0 1px 3px rgba(0,0,0,0.1)` | `shadow` | 카드 기본 |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | `shadow-md` | 카드 호버, 드롭다운 |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | `shadow-lg` | 모달 |

---

## 6. Tone & Voice

| Attribute | Guideline |
|-----------|-----------|
| **톤** | 전문적이고 신뢰감 있는. 과도하게 캐주얼하지 않으나 딱딱하지도 않음 |
| **색상 사용** | 파란색 = 신뢰/진행, 초록색 = 성공/승인, 빨간색 = 위험/지연 (일관 유지) |
| **아이콘** | Lucide React 사용. 16px(인라인), 20px(버튼), 24px(네비게이션) |
| **빈 상태** | 일러스트 없이 아이콘 + 텍스트 + CTA 버튼 조합 |
| **로딩** | Skeleton UI 사용 (스피너 대신) |
| **피드백** | Toast 알림 (우상단, 5초 자동 닫힘). 파괴적 액션은 확인 모달 |
| **한국어** | 존댓말(~합니다/~하세요) 기본. 버튼 레이블은 간결하게 ("등록", "접수", "승인") |

---

## 7. Layout Pattern

| Pattern | Description |
|---------|-------------|
| **Sidebar + Content** | 좌측 사이드바(256px) + 우측 메인 콘텐츠. 반응형: 모바일에서 햄버거 메뉴 |
| **Card Grid** | 대시보드 KPI는 `grid-cols-4` (데스크톱), `grid-cols-2` (태블릿), `grid-cols-1` (모바일) |
| **List → Detail** | 목록 클릭 → 상세 페이지 전환 (모달 아님). 뒤로가기로 목록 복귀 |
| **Form** | 단일 컬럼 폼. 라벨 상단 배치. 필수 필드 `*` 표시 |
| **Table** | 데이터 테이블 (정렬/필터/페이지네이션). 행 호버 `slate-50` 배경 |
| **Timeline** | 좌측 세로 선 + 원형 노드 + 우측 내용. 상태별 노드 색상 |

---

## 8. Component Patterns

### Button Hierarchy

| Variant | Tailwind Classes | Usage |
|---------|-----------------|-------|
| Primary | `bg-blue-600 hover:bg-blue-700 text-white` | 주요 액션 (등록, 접수, 승인) |
| Secondary | `bg-white border border-slate-300 hover:bg-slate-50 text-slate-700` | 보조 액션 (취소, 목록으로) |
| Danger | `bg-red-600 hover:bg-red-700 text-white` | 파괴적 액션 (반려, 삭제) |
| Ghost | `hover:bg-slate-100 text-slate-600` | 텍스트 링크 스타일 버튼 |
| Approve | `bg-emerald-600 hover:bg-emerald-700 text-white` | 승인 전용 |

### Status Badge

```
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {status-colors}">
  {status-label}
</span>
```

### SLA Countdown Badge

```
정상:  bg-emerald-50 text-emerald-700 border-emerald-200
임박:  bg-amber-50 text-amber-700 border-amber-200
위반:  bg-red-50 text-red-700 border-red-200 animate-pulse
```

---

## Tailwind Config Extension

```javascript
// tailwind.config.ts
{
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', 'Fira Code', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
    },
  },
}
```
