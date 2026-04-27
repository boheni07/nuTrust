// Design Ref: §6 — 프로젝트 CRUD 모달 + 에이전트 배정 탭
// Plan SC: SC-3, SC-4, SC-5

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderKanban, Plus, Pencil, Trash2, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  clientId: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  client?: { id: string; name: string };
  _count?: { tickets: number; assignments: number };
}

interface Assignment {
  id: string;
  agentId: string;
  role: string;
  agent: { id: string; name: string; email: string; role: string };
}

interface ProjectDetail extends Project {
  assignments: Assignment[];
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

type ModalMode = 'create' | 'edit' | null;
type ActiveTab = 'info' | 'assignments';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '진행중', ON_HOLD: '보류', COMPLETED: '완료', CANCELLED: '취소',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiJson(url: string, init?: RequestInit) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message || '요청 실패');
  }
  return r.json();
}

function toDateInput(val?: string) {
  if (!val) return '';
  return val.slice(0, 10);
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: ActiveTab; onChange: (t: ActiveTab) => void }) {
  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'info', label: '기본 정보' },
    { key: 'assignments', label: '담당 에이전트' },
  ];
  return (
    <div className="flex border-b border-slate-200 px-6">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Project Info Form ────────────────────────────────────────────────────────

function ProjectInfoForm({
  defaultValues,
  onSubmit,
  isLoading,
  isCreate,
}: {
  defaultValues?: Partial<Project>;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isCreate?: boolean;
}) {
  const [form, setForm] = useState({
    clientId: defaultValues?.clientId ?? '',
    name: defaultValues?.name ?? '',
    description: defaultValues?.description ?? '',
    startDate: toDateInput(defaultValues?.startDate),
    endDate: toDateInput(defaultValues?.endDate),
    status: defaultValues?.status ?? 'ACTIVE',
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-simple'],
    queryFn: () => apiJson('/api/clients?limit=100'),
  });
  const clients = clientsData?.data ?? [];

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="px-6 py-4 space-y-3">
      {isCreate && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">고객사 *</label>
          <select value={form.clientId} onChange={upd('clientId')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">선택</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">프로젝트명 *</label>
        <input value={form.name} onChange={upd('name')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
        <textarea value={form.description} onChange={upd('description')} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">시작일</label>
          <input type="date" value={form.startDate} onChange={upd('startDate')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">종료일</label>
          <input type="date" value={form.endDate} onChange={upd('endDate')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      {!isCreate && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">상태</label>
          <select value={form.status} onChange={upd('status')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ACTIVE">진행중</option>
            <option value="ON_HOLD">보류</option>
            <option value="COMPLETED">완료</option>
            <option value="CANCELLED">취소</option>
          </select>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <Button
          onClick={() => onSubmit({
            ...form,
            startDate: form.startDate || undefined,
            endDate: form.endDate || undefined,
            description: form.description || undefined,
          })}
          disabled={!form.name || (isCreate && !form.clientId) || isLoading}
        >
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  );
}

// ─── Assignments Tab ──────────────────────────────────────────────────────────

function AssignmentsTab({ projectId, assignments, onRefresh }: {
  projectId: string;
  assignments: Assignment[];
  onRefresh: () => void;
}) {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['agents-list'],
    queryFn: () => apiJson('/api/users?role=AGENT,MANAGER&limit=100'),
  });
  const allAgents: Agent[] = usersData?.data ?? [];
  const assignedIds = new Set(assignments.map(a => a.agentId));
  const availableAgents = allAgents.filter(a => !assignedIds.has(a.id) && (a.role === 'AGENT' || a.role === 'MANAGER'));

  const addAssignment = useMutation({
    mutationFn: (agentId: string) =>
      apiJson(`/api/projects/${projectId}/assignments`, { method: 'POST', body: JSON.stringify({ agentId, role: 'MEMBER' }) }),
    onSuccess: () => { setSelectedAgentId(''); onRefresh(); },
    onError: (e: Error) => setErrorMsg(e.message),
  });

  const removeAssignment = useMutation({
    mutationFn: (agentId: string) =>
      apiJson(`/api/projects/${projectId}/assignments/${agentId}`, { method: 'DELETE' }),
    onSuccess: () => onRefresh(),
    onError: (e: Error) => setErrorMsg(e.message),
  });

  return (
    <div className="px-6 py-4 space-y-3">
      {errorMsg && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-2 underline text-xs">닫기</button>
        </div>
      )}
      <div className="flex gap-2">
        <select
          value={selectedAgentId}
          onChange={e => setSelectedAgentId(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">에이전트 선택</option>
          {availableAgents.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
          ))}
        </select>
        <Button size="sm" onClick={() => selectedAgentId && addAssignment.mutate(selectedAgentId)} disabled={!selectedAgentId || addAssignment.isPending}>
          <Plus className="h-4 w-4 mr-1" />배정
        </Button>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">배정된 에이전트가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
          {assignments.map(a => (
            <li key={a.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">{a.agent.name}</p>
                <p className="text-xs text-slate-500">{a.agent.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${a.role === 'LEAD' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                  {a.role === 'LEAD' ? '담당' : '멤버'}
                </span>
                <button
                  onClick={() => removeAssignment.mutate(a.agentId)}
                  disabled={removeAssignment.isPending}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                  title="배정 해제"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectList() {
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => apiJson('/api/projects?limit=100'),
  });

  const { data: detail, refetch: refetchDetail } = useQuery<{ data: ProjectDetail }>({
    queryKey: ['project-detail', selectedProject?.id],
    queryFn: () => apiJson(`/api/projects/${selectedProject!.id}`),
    enabled: !!selectedProject && modalMode === 'edit',
  });

  const projects: Project[] = data?.data ?? [];
  const projectDetail = detail?.data;

  const createProject = useMutation({
    mutationFn: (body: any) =>
      apiJson('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-projects'] }); setModalMode(null); },
  });

  const updateProject = useMutation({
    mutationFn: (body: any) =>
      apiJson(`/api/projects/${selectedProject!.id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-projects'] });
      qc.invalidateQueries({ queryKey: ['project-detail', selectedProject?.id] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) =>
      apiJson(`/api/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-projects'] }); setDeleteTarget(null); setDeleteError(''); },
    onError: (e: Error) => { setDeleteTarget(null); setDeleteError(e.message); },
  });

  const openCreate = () => { setSelectedProject(null); setActiveTab('info'); setModalMode('create'); };
  const openEdit = (p: Project) => { setSelectedProject(p); setActiveTab('info'); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setSelectedProject(null); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FolderKanban className="h-6 w-6" />프로젝트 관리
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />프로젝트 추가
        </Button>
      </div>

      {deleteError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError('')} className="underline text-xs">닫기</button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">프로젝트명</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">고객사</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">상태</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">티켓</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">담당자</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">로딩 중...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">등록된 프로젝트가 없습니다.</td></tr>
            ) : projects.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.client?.name ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{p._count?.tickets ?? 0}</td>
                <td className="px-4 py-3 text-center text-slate-600">{p._count?.assignments ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-blue-600 transition-colors" title="수정">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(p)} className="text-slate-400 hover:text-red-600 transition-colors" title="삭제">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 등록 모달 */}
      <Modal isOpen={modalMode === 'create'} onClose={closeModal} title="프로젝트 추가" size="md">
        <ProjectInfoForm
          isCreate
          onSubmit={data => createProject.mutate(data)}
          isLoading={createProject.isPending}
        />
      </Modal>

      {/* 수정 모달 (탭) */}
      <Modal isOpen={modalMode === 'edit'} onClose={closeModal} title={`프로젝트 수정 — ${selectedProject?.name ?? ''}`} size="lg">
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === 'info' && (
          <ProjectInfoForm
            defaultValues={selectedProject ?? undefined}
            onSubmit={data => updateProject.mutate(data)}
            isLoading={updateProject.isPending}
          />
        )}
        {activeTab === 'assignments' && projectDetail && (
          <AssignmentsTab
            projectId={selectedProject!.id}
            assignments={projectDetail.assignments}
            onRefresh={() => refetchDetail()}
          />
        )}
        {activeTab === 'assignments' && !projectDetail && (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">로딩 중...</div>
        )}
      </Modal>

      {/* 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteProject.mutate(deleteTarget.id)}
        title="프로젝트 삭제"
        message={`"${deleteTarget?.name}" 프로젝트를 삭제하시겠습니까? 연결된 티켓이 있으면 삭제되지 않습니다.`}
        isLoading={deleteProject.isPending}
      />
    </div>
  );
}
