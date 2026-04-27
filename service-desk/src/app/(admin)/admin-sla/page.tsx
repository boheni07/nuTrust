// Design Ref: §9 — SLA 정책 수정/삭제 추가
// Plan SC: SC-8

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState } from 'react';
import { Shield, Plus, Pencil, Trash2 } from 'lucide-react';

async function apiJson(url: string, init?: RequestInit) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || '요청 실패'); }
  return r.json();
}

interface SLAPolicy {
  id: string; name: string; category?: string; priority?: string;
  acceptanceHours: number; resolutionHours: number; isDefault: boolean;
}

type SLAForm = { name: string; category: string; priority: string; acceptanceHours: number; resolutionHours: number; isDefault: boolean; };

const emptyForm: SLAForm = { name: '', category: '', priority: '', acceptanceHours: 4, resolutionHours: 48, isDefault: false };

function SLAFormFields({ form, onChange }: { form: SLAForm; onChange: (f: SLAForm) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">정책명 *</label>
        <input value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">카테고리 (선택)</label>
          <select value={form.category} onChange={e => onChange({ ...form, category: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">전체</option>
            <option value="ACCESS_REQUEST">접근 권한</option>
            <option value="INCIDENT">장애/오류</option>
            <option value="SERVICE_REQUEST">서비스 요청</option>
            <option value="INQUIRY">문의</option>
            <option value="CHANGE_REQUEST">변경 요청</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">우선순위 (선택)</label>
          <select value={form.priority} onChange={e => onChange({ ...form, priority: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">전체</option>
            <option value="LOW">낮음</option>
            <option value="MEDIUM">보통</option>
            <option value="HIGH">높음</option>
            <option value="URGENT">긴급</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">접수 SLA (시간)</label>
          <input type="number" min={1} value={form.acceptanceHours} onChange={e => onChange({ ...form, acceptanceHours: Number(e.target.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">해결 SLA (시간)</label>
          <input type="number" min={1} value={form.resolutionHours} onChange={e => onChange({ ...form, resolutionHours: Number(e.target.value) })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isDefault} onChange={e => onChange({ ...form, isDefault: e.target.checked })} className="rounded" />
        기본 정책으로 설정
      </label>
    </div>
  );
}

export default function AdminSLAPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sla'],
    queryFn: () => apiJson('/api/sla-policies'),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<SLAForm>(emptyForm);

  const [editTarget, setEditTarget] = useState<SLAPolicy | null>(null);
  const [editForm, setEditForm] = useState<SLAForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<SLAPolicy | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const policies: SLAPolicy[] = data?.data ?? [];

  const createSLA = useMutation({
    mutationFn: (body: SLAForm) =>
      apiJson('/api/sla-policies', { method: 'POST', body: JSON.stringify({ ...body, category: body.category || undefined, priority: body.priority || undefined }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-sla'] }); setShowCreate(false); setCreateForm(emptyForm); },
  });

  const updateSLA = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<SLAForm> }) =>
      apiJson(`/api/sla-policies/${id}`, { method: 'PUT', body: JSON.stringify({ ...body, category: body.category || null, priority: body.priority || null }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-sla'] }); setEditTarget(null); },
  });

  const deleteSLA = useMutation({
    mutationFn: (id: string) => apiJson(`/api/sla-policies/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-sla'] }); setDeleteTarget(null); setErrorMsg(''); },
    onError: (e: Error) => { setDeleteTarget(null); setErrorMsg(e.message); },
  });

  const openEdit = (p: SLAPolicy) => {
    setEditTarget(p);
    setEditForm({ name: p.name, category: p.category ?? '', priority: p.priority ?? '', acceptanceHours: p.acceptanceHours, resolutionHours: p.resolutionHours, isDefault: p.isDefault });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Shield className="h-6 w-6" />SLA 정책 관리</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />정책 추가</Button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="underline text-xs">닫기</button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">정책명</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">카테고리</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">우선순위</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">접수 SLA</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">해결 SLA</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">기본</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">로딩 중...</td></tr>
            ) : policies.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.category ?? '전체'}</td>
                <td className="px-4 py-3 text-slate-600">{p.priority ?? '전체'}</td>
                <td className="px-4 py-3 text-right font-mono">{p.acceptanceHours}h</td>
                <td className="px-4 py-3 text-right font-mono">{p.resolutionHours}h</td>
                <td className="px-4 py-3 text-center">
                  {p.isDefault ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">기본</span> : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-blue-600 transition-colors" title="수정">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      disabled={p.isDefault}
                      className={`transition-colors ${p.isDefault ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600'}`}
                      title={p.isDefault ? '기본 정책은 삭제할 수 없습니다' : '삭제'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 정책 추가 모달 */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="SLA 정책 추가" size="md">
        <div className="px-6 py-4">
          <SLAFormFields form={createForm} onChange={setCreateForm} />
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>취소</Button>
            <Button onClick={() => createSLA.mutate(createForm)} disabled={!createForm.name.trim() || createSLA.isPending}>추가</Button>
          </div>
        </div>
      </Modal>

      {/* 정책 수정 모달 */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title={`SLA 정책 수정 — ${editTarget?.name}`} size="md">
        <div className="px-6 py-4">
          <SLAFormFields form={editForm} onChange={setEditForm} />
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>취소</Button>
            <Button onClick={() => editTarget && updateSLA.mutate({ id: editTarget.id, body: editForm })}
              disabled={!editForm.name.trim() || updateSLA.isPending}>저장</Button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteSLA.mutate(deleteTarget.id)}
        title="SLA 정책 삭제"
        message={`"${deleteTarget?.name}" 정책을 삭제하시겠습니까?`}
        isLoading={deleteSLA.isPending}
      />
    </div>
  );
}
