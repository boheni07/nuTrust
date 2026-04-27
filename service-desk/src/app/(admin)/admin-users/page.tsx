// Design Ref: §8 — 사용자 수정(이름/역할/팀) 추가
// Plan SC: SC-7

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';
import { Users, Plus, Pencil, X } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: '시스템관리자', MANAGER: '운영관리자', AGENT: '지원담당자', CUSTOMER: '고객',
};
const ROLE_COLORS: Record<string, string> = {
  SYSTEM_ADMIN: 'bg-red-100 text-red-700', MANAGER: 'bg-violet-100 text-violet-700',
  AGENT: 'bg-blue-100 text-blue-700', CUSTOMER: 'bg-emerald-100 text-emerald-700',
};

async function apiJson(url: string, init?: RequestInit) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || '요청 실패'); }
  return r.json();
}

interface User { id: string; name: string; email: string; role: string; isActive: boolean; team?: { id: string; name: string } | null; }

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiJson('/api/users'),
  });
  const { data: teamsData } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => apiJson('/api/teams'),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'AGENT', teamId: '' });
  const [createMsg, setCreateMsg] = useState('');

  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', teamId: '' });
  const [editMsg, setEditMsg] = useState('');

  const users: User[] = data?.data ?? [];
  const teams: any[] = teamsData?.data ?? [];

  const createUser = useMutation({
    mutationFn: (body: any) => apiJson('/api/users', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setShowCreate(false); setCreateForm({ name: '', email: '', password: '', role: 'AGENT', teamId: '' }); setCreateMsg(''); },
    onError: (e: Error) => setCreateMsg(e.message),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiJson(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); qc.invalidateQueries({ queryKey: ['admin-teams-list'] }); setEditTarget(null); setEditMsg(''); },
    onError: (e: Error) => setEditMsg(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiJson(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditForm({ name: u.name, role: u.role, teamId: u.team?.id ?? '' });
    setEditMsg('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="h-6 w-6" />사용자 관리</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />사용자 추가</Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">이름</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">이메일</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">역할</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">팀</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">상태</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">로딩 중...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? ''}`}>{ROLE_LABELS[u.role]}</span></td>
                <td className="px-4 py-3 text-slate-600">{u.team?.name ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(u)} className="text-slate-400 hover:text-blue-600 transition-colors" title="수정">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <Button size="sm" variant={u.isActive ? 'danger' : 'approve'}
                      onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}>
                      {u.isActive ? '비활성화' : '활성화'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 사용자 추가 모달 */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="사용자 추가" size="md">
        <div className="px-6 py-4 space-y-3">
          {createMsg && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{createMsg}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이름 *</label>
            <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이메일 *</label>
            <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호 * (8자 이상)</label>
            <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">역할</label>
            <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="CUSTOMER">고객</option>
              <option value="AGENT">지원담당자</option>
              <option value="MANAGER">운영관리자</option>
              <option value="SYSTEM_ADMIN">시스템관리자</option>
            </select>
          </div>
          {(createForm.role === 'AGENT' || createForm.role === 'MANAGER') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">팀</label>
              <select value={createForm.teamId} onChange={e => setCreateForm(f => ({ ...f, teamId: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">선택 안 함</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>취소</Button>
            <Button onClick={() => createUser.mutate({ ...createForm, teamId: createForm.teamId || undefined })}
              disabled={!createForm.name || !createForm.email || createForm.password.length < 8 || createUser.isPending}>추가</Button>
          </div>
        </div>
      </Modal>

      {/* 사용자 수정 모달 */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title={`사용자 수정 — ${editTarget?.name}`} size="md">
        <div className="px-6 py-4 space-y-3">
          {editMsg && <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{editMsg}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이름 *</label>
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">역할</label>
            <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value, teamId: '' }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="CUSTOMER">고객</option>
              <option value="AGENT">지원담당자</option>
              <option value="MANAGER">운영관리자</option>
              <option value="SYSTEM_ADMIN">시스템관리자</option>
            </select>
          </div>
          {(editForm.role === 'AGENT' || editForm.role === 'MANAGER') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">팀</label>
              <select value={editForm.teamId} onChange={e => setEditForm(f => ({ ...f, teamId: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">팀 없음</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>취소</Button>
            <Button
              onClick={() => editTarget && updateUser.mutate({
                id: editTarget.id,
                body: { name: editForm.name, role: editForm.role, teamId: editForm.teamId || null },
              })}
              disabled={!editForm.name || updateUser.isPending}
            >저장</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
