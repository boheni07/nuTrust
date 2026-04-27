// Design Ref: §4.2 — 기간/프로젝트 필터 트레이
// Plan SC: SC-1 (날짜 필터 → 모든 차트 연동)

'use client';

import { useQuery } from '@tanstack/react-query';

export type Period = '30' | '60' | '90' | 'custom';

export interface FilterState {
  period: Period;
  from: string;
  to: string;
  projectId: string;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '30', label: '30일' },
  { value: '60', label: '60일' },
  { value: '90', label: '90일' },
  { value: 'custom', label: '사용자 지정' },
];

interface FilterBarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { data: projectsData } = useQuery({
    queryKey: ['projects-reports-filter'],
    queryFn: async () => {
      const r = await fetch('/api/projects?limit=100');
      return r.json();
    },
  });
  const projects: { id: string; name: string; client?: { name: string } }[] =
    projectsData?.data ?? [];

  const setPeriod = (period: Period) => {
    if (period === 'custom') {
      const today = new Date().toISOString().slice(0, 10);
      const from30 = new Date();
      from30.setDate(from30.getDate() - 30);
      onChange({ ...filters, period, from: from30.toISOString().slice(0, 10), to: today });
    } else {
      onChange({ ...filters, period, from: '', to: '' });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3">
      {/* 기간 버튼 그룹 */}
      <div className="flex items-center gap-1">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filters.period === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 사용자 지정 날짜 입력 */}
      {filters.period === 'custom' && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => onChange({ ...filters, from: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-400">~</span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* 프로젝트 드롭다운 */}
      <select
        value={filters.projectId}
        onChange={(e) => onChange({ ...filters, projectId: e.target.value })}
        className="ml-auto rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">전체 프로젝트</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.client?.name ? `${p.client.name} — ` : ''}{p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
