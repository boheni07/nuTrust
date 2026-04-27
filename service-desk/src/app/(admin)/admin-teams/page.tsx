// Design Ref: §7 — 팀 수정/삭제 + 팀원 배정·해제
// Plan SC: SC-6

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, UserMinus, UserPlus } from 'lucide-react';

async function apiJson(url: string, init?: RequestInit) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || '요청 실패'); }
  return r.json();
}

interface Team { id: string; name: string; members?: Member[]; }
interface Member { id: string; name: string; role: string; }

export default function AdminTeamsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-teams-list'],
    queryFn: () => apiJson('/api/teams'),
  });
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-simple'],
    queryFn: () => apiJson('/api/users?limit=100'),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [addMemberTarget, setAddMemberTarget] = useState<Team | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const teams: Team[] = data?.data ?? [];
  const allUsers: Member[] = usersData?.data ?? [];

  const createTeam = useMutation({
    mutationFn: (name: string) => apiJson('/api/teams', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-teams-list'] }); setShowCreate(false); setTeamName(''); },
  });

  const updateTeam = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiJson(`/api/teams/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-teams-list'] }); setEditTarget(null); },
  });

  const deleteTeam = useMutation({
    mutationFn: (id: string) => apiJson(`/api/teams/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-teams-list'] }); setDeleteTarget(null); setErrorMsg(''); },
    onError: (e: Error) => { setDeleteTarget(null); setErrorMsg(e.message); },
  });

  // 팀원 추가: user의 teamId 업데이트
  const addMember = useMutation({
    mutationFn: ({ userId, teamId }: { userId: string; teamId: string }) =>
      apiJson(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify({ teamId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-teams-list'] }); qc.invalidateQueries({ queryKey: ['admin-users'] }); setSelectedUserId(''); },
    onError: (e: Error) => setErrorMsg(e.message),
  });

  // 팀원 제거: teamId를 null로
  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      apiJson(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify({ teamId: null }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-teams-list'] }); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e: Error) => setErrorMsg(e.message),
  });

  // 현재 어떤 팀에도 없는 AGENT/MANAGER 유저 필터
  const currentTeamMemberIds = new Set(teams.flatMap(t => t.members?.map(m => m.id) ?? []));
  const availableUsers = allUsers.filter((u: any) =>
    (u.role === 'AGENT' || u.role === 'MANAGER') && !currentTeamMemberIds.has(u.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="h-6 w-6" />팀 관리</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />팀 추가</Button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="underline text-xs">닫기</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          <p className="text-slate-400 col-span-2 text-center py-8">로딩 중...</p>
        ) : teams.length === 0 ? (
          <p className="text-slate-400 col-span-2 text-center py-8">등록된 팀이 없습니다.</p>
        ) : teams.map((team) => (
          <div key={team.id} className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">{team.name}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditTarget(team); setEditName(team.name); }}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="팀명 수정"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(team)}
                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                  title="팀 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {(team.members?.length ?? 0) === 0 && <p className="text-sm text-slate-400">소속 멤버 없음</p>}
              {team.members?.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                      {m.name[0]}
                    </div>
                    <span className="text-slate-900">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${m.role === 'MANAGER' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                      {m.role === 'MANAGER' ? '관리자' : '담당자'}
                    </span>
                    <button
                      onClick={() => removeMember.mutate(m.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      title="팀에서 제거"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">{team.members?.length ?? 0}명</p>
              <button
                onClick={() => { setAddMemberTarget(team); setSelectedUserId(''); }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <UserPlus className="h-3.5 w-3.5" />멤버 추가
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 팀 추가 모달 */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="팀 추가" size="sm">
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">팀 이름 *</label>
            <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="팀 이름"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => { if (e.key === 'Enter' && teamName.trim()) createTeam.mutate(teamName.trim()); }}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>취소</Button>
            <Button onClick={() => createTeam.mutate(teamName.trim())} disabled={!teamName.trim() || createTeam.isPending}>추가</Button>
          </div>
        </div>
      </Modal>

      {/* 팀명 수정 모달 */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="팀명 수정" size="sm">
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">팀 이름 *</label>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>취소</Button>
            <Button onClick={() => editTarget && updateTeam.mutate({ id: editTarget.id, name: editName })}
              disabled={!editName.trim() || updateTeam.isPending}>저장</Button>
          </div>
        </div>
      </Modal>

      {/* 멤버 추가 모달 */}
      <Modal isOpen={!!addMemberTarget} onClose={() => setAddMemberTarget(null)} title={`멤버 추가 — ${addMemberTarget?.name}`} size="sm">
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">사용자 선택</label>
            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">선택</option>
              {availableUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            {availableUsers.length === 0 && <p className="text-xs text-slate-400 mt-1">추가 가능한 에이전트/관리자가 없습니다.</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setAddMemberTarget(null)}>취소</Button>
            <Button
              onClick={() => addMemberTarget && selectedUserId && addMember.mutate({ userId: selectedUserId, teamId: addMemberTarget.id })}
              disabled={!selectedUserId || addMember.isPending}
            >추가</Button>
          </div>
        </div>
      </Modal>

      {/* 팀 삭제 확인 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteTeam.mutate(deleteTarget.id)}
        title="팀 삭제"
        message={`"${deleteTarget?.name}" 팀을 삭제하시겠습니까? 멤버가 있으면 삭제되지 않습니다.`}
        isLoading={deleteTeam.isPending}
      />
    </div>
  );
}
