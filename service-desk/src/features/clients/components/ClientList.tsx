// Design Ref: §5 — 고객사 CRUD 모달 + 부서/담당자 탭
// Plan SC: SC-1, SC-2, SC-5

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  _count?: { projects: number; contacts: number };
}

interface Department {
  id: string;
  name: string;
  _count?: { contacts: number };
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  department: { id: string; name: string };
}

interface ClientDetail extends Client {
  departments: Department[];
  contacts: Contact[];
}

type ModalMode = 'create' | 'edit' | null;
type ActiveTab = 'info' | 'departments' | 'contacts';

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiJson(url: string, init?: RequestInit) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message || '요청 실패');
  }
  return r.json();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: ActiveTab; onChange: (t: ActiveTab) => void }) {
  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'info', label: '기본 정보' },
    { key: 'departments', label: '부서' },
    { key: 'contacts', label: '담당자' },
  ];
  return (
    <div className="flex border-b border-slate-200 px-6">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === t.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Info Form ───────────────────────────────────────────────────────────────

function ClientInfoForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: Partial<Client>;
  onSubmit: (data: Omit<Client, 'id' | '_count'>) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    name: defaultValues?.name ?? '',
    contactEmail: defaultValues?.contactEmail ?? '',
    contactPhone: defaultValues?.contactPhone ?? '',
    address: defaultValues?.address ?? '',
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="px-6 py-4 space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">고객사명 *</label>
        <input value={form.name} onChange={update('name')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">이메일 *</label>
        <input type="email" value={form.contactEmail} onChange={update('contactEmail')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">전화번호</label>
        <input value={form.contactPhone} onChange={update('contactPhone')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">주소</label>
        <input value={form.address} onChange={update('address')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={() => onSubmit(form)} disabled={!form.name || !form.contactEmail || isLoading}>
          {isLoading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  );
}

// ─── Departments Tab ──────────────────────────────────────────────────────────

function DepartmentsTab({ clientId, departments, onRefresh }: {
  clientId: string;
  departments: Department[];
  onRefresh: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const addDept = useMutation({
    mutationFn: (name: string) =>
      apiJson(`/api/clients/${clientId}/departments`, { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => { setNewName(''); onRefresh(); },
    onError: (e: Error) => setErrorMsg(e.message),
  });

  const deleteDept = useMutation({
    mutationFn: (deptId: string) =>
      apiJson(`/api/clients/${clientId}/departments/${deptId}`, { method: 'DELETE' }),
    onSuccess: () => { setDeleteTarget(null); onRefresh(); },
    onError: (e: Error) => { setDeleteTarget(null); setErrorMsg(e.message); },
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
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="부서명"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) addDept.mutate(newName.trim()); }}
        />
        <Button size="sm" onClick={() => newName.trim() && addDept.mutate(newName.trim())} disabled={!newName.trim() || addDept.isPending}>
          <Plus className="h-4 w-4 mr-1" />추가
        </Button>
      </div>
      {departments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">등록된 부서가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
          {departments.map(d => (
            <li key={d.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
              <span className="text-sm text-slate-900">{d.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{d._count?.contacts ?? 0}명</span>
                <button
                  onClick={() => setDeleteTarget(d)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                  title="부서 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteDept.mutate(deleteTarget.id)}
        title="부서 삭제"
        message={`"${deleteTarget?.name}" 부서를 삭제하시겠습니까? 담당자가 있으면 삭제되지 않습니다.`}
        isLoading={deleteDept.isPending}
      />
    </div>
  );
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────

function ContactsTab({ clientId, contacts, departments, onRefresh }: {
  clientId: string;
  contacts: Contact[];
  departments: Department[];
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', position: '', departmentId: '' });
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const addContact = useMutation({
    mutationFn: (body: typeof form) =>
      apiJson(`/api/clients/${clientId}/contacts`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { setShowAdd(false); setForm({ name: '', email: '', phone: '', position: '', departmentId: '' }); onRefresh(); },
    onError: (e: Error) => setErrorMsg(e.message),
  });

  const deleteContact = useMutation({
    mutationFn: (contactId: string) =>
      apiJson(`/api/clients/${clientId}/contacts/${contactId}`, { method: 'DELETE' }),
    onSuccess: () => { setDeleteTarget(null); onRefresh(); },
    onError: (e: Error) => { setDeleteTarget(null); setErrorMsg(e.message); },
  });

  return (
    <div className="px-6 py-4 space-y-3">
      {errorMsg && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-2 underline text-xs">닫기</button>
        </div>
      )}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd(s => !s)}>
          <Plus className="h-4 w-4 mr-1" />담당자 추가
        </Button>
      </div>

      {showAdd && (
        <div className="border border-slate-200 rounded-md p-4 space-y-2 bg-slate-50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">이름 *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">이메일 *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">전화</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">직책</label>
              <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">부서 *</label>
              <select value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
                <option value="">선택</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>취소</Button>
            <Button size="sm"
              onClick={() => addContact.mutate(form)}
              disabled={!form.name || !form.email || !form.departmentId || addContact.isPending}
            >
              {addContact.isPending ? '추가 중...' : '추가'}
            </Button>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">등록된 담당자가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
          {contacts.map(c => (
            <li key={c.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.email} · {c.department.name}{c.position ? ` · ${c.position}` : ''}</p>
              </div>
              <button
                onClick={() => setDeleteTarget(c)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteContact.mutate(deleteTarget.id)}
        title="담당자 삭제"
        message={`"${deleteTarget?.name}" 담당자를 삭제하시겠습니까?`}
        isLoading={deleteContact.isPending}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClientList() {
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // 목록
  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiJson('/api/clients'),
  });

  // 상세 (수정 모달)
  const { data: detail, refetch: refetchDetail } = useQuery<{ data: ClientDetail }>({
    queryKey: ['client-detail', selectedClient?.id],
    queryFn: () => apiJson(`/api/clients/${selectedClient!.id}`),
    enabled: !!selectedClient && modalMode === 'edit',
  });

  const clients: Client[] = data?.data ?? [];
  const clientDetail = detail?.data;

  // 등록
  const createClient = useMutation({
    mutationFn: (body: Omit<Client, 'id' | '_count'>) =>
      apiJson('/api/clients', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setModalMode(null); },
  });

  // 수정
  const updateClient = useMutation({
    mutationFn: (body: Omit<Client, 'id' | '_count'>) =>
      apiJson(`/api/clients/${selectedClient!.id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['client-detail', selectedClient?.id] });
    },
  });

  // 삭제
  const deleteClient = useMutation({
    mutationFn: (id: string) =>
      apiJson(`/api/clients/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setDeleteTarget(null); setDeleteError(''); },
    onError: (e: Error) => { setDeleteTarget(null); setDeleteError(e.message); },
  });

  const openCreate = () => { setSelectedClient(null); setActiveTab('info'); setModalMode('create'); };
  const openEdit = (c: Client) => { setSelectedClient(c); setActiveTab('info'); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setSelectedClient(null); };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="h-6 w-6" />고객사 관리
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />고객사 추가
        </Button>
      </div>

      {/* 삭제 에러 메시지 */}
      {deleteError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError('')} className="underline text-xs">닫기</button>
        </div>
      )}

      {/* 목록 테이블 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">고객사명</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">이메일</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">프로젝트</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">담당자</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">로딩 중...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">등록된 고객사가 없습니다.</td></tr>
            ) : clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c.contactEmail}</td>
                <td className="px-4 py-3 text-center text-slate-600">{c._count?.projects ?? 0}</td>
                <td className="px-4 py-3 text-center text-slate-600">{c._count?.contacts ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-blue-600 transition-colors" title="수정">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(c)} className="text-slate-400 hover:text-red-600 transition-colors" title="삭제">
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
      <Modal isOpen={modalMode === 'create'} onClose={closeModal} title="고객사 추가" size="md">
        <ClientInfoForm
          onSubmit={data => createClient.mutate(data)}
          isLoading={createClient.isPending}
        />
      </Modal>

      {/* 수정 모달 (탭) */}
      <Modal isOpen={modalMode === 'edit'} onClose={closeModal} title={`고객사 수정 — ${selectedClient?.name ?? ''}`} size="lg">
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === 'info' && (
          <ClientInfoForm
            defaultValues={selectedClient ?? undefined}
            onSubmit={data => updateClient.mutate(data)}
            isLoading={updateClient.isPending}
          />
        )}
        {activeTab === 'departments' && clientDetail && (
          <DepartmentsTab
            clientId={selectedClient!.id}
            departments={clientDetail.departments}
            onRefresh={() => refetchDetail()}
          />
        )}
        {activeTab === 'contacts' && clientDetail && (
          <ContactsTab
            clientId={selectedClient!.id}
            contacts={clientDetail.contacts}
            departments={clientDetail.departments}
            onRefresh={() => refetchDetail()}
          />
        )}
        {(activeTab === 'departments' || activeTab === 'contacts') && !clientDetail && (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">로딩 중...</div>
        )}
      </Modal>

      {/* 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteClient.mutate(deleteTarget.id)}
        title="고객사 삭제"
        message={`"${deleteTarget?.name}" 고객사를 삭제하시겠습니까? 연결된 프로젝트가 있으면 삭제되지 않습니다.`}
        isLoading={deleteClient.isPending}
      />
    </div>
  );
}
