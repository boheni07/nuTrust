'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { User, Lock, Building2, Phone, Mail, Shield } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = { SYSTEM_ADMIN: '시스템관리자', MANAGER: '운영관리자', AGENT: '지원담당자', CUSTOMER: '고객' };

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => { const r = await fetch('/api/users/me'); return r.json(); },
  });

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  const [pwMode, setPwMode] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  const user = data?.data;

  const updateProfile = useMutation({
    mutationFn: async (body: { name: string }) => {
      const r = await fetch('/api/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json()).error?.message);
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-profile'] }); setEditMode(false); setProfileMsg('저장되었습니다.'); setTimeout(() => setProfileMsg(''), 3000); },
  });

  const changePassword = useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      const r = await fetch('/api/users/me/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { const err = await r.json(); throw new Error(err.error?.message); }
      return r.json();
    },
    onSuccess: () => { setPwMode(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' }); setTimeout(() => setPwMsg({ type: '', text: '' }), 3000); },
    onError: (err: Error) => { setPwMsg({ type: 'error', text: err.message }); },
  });

  const startEdit = () => { setEditMode(true); setName(user?.name || ''); };

  if (isLoading) return <div className="text-slate-400 py-8 text-center">로딩 중...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">설정</h1>

      {/* Profile */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><User className="h-4 w-4" />내 정보</h2>
          {!editMode && <Button size="sm" variant="secondary" onClick={startEdit}>수정</Button>}
        </div>

        {profileMsg && <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-700 mb-3">{profileMsg}</div>}

        {editMode ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => updateProfile.mutate({ name })} disabled={!name.trim()}>저장</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditMode(false)}>취소</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
                <p className="text-slate-500">{ROLE_LABELS[user?.role] ?? user?.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-slate-400" />{user?.email}</div>
              {user?.team && <div className="flex items-center gap-2 text-slate-600"><Shield className="h-4 w-4 text-slate-400" />{user.team.name}</div>}
              {user?.contactProfile?.client && <div className="flex items-center gap-2 text-slate-600"><Building2 className="h-4 w-4 text-slate-400" />{user.contactProfile.client.name}</div>}
              {user?.contactProfile?.department && <div className="flex items-center gap-2 text-slate-600">{user.contactProfile.department.name}</div>}
              {user?.contactProfile?.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" />{user.contactProfile.phone}</div>}
              {user?.contactProfile?.position && <div className="flex items-center gap-2 text-slate-600">{user.contactProfile.position}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Lock className="h-4 w-4" />비밀번호 변경</h2>
          {!pwMode && <Button size="sm" variant="secondary" onClick={() => setPwMode(true)}>변경</Button>}
        </div>

        {pwMsg.text && (
          <div className={`p-2 rounded text-sm mb-3 ${pwMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{pwMsg.text}</div>
        )}

        {pwMode ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">현재 비밀번호</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호 (8자 이상)</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호 확인</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              {confirmPw && newPw !== confirmPw && <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => changePassword.mutate({ currentPassword: currentPw, newPassword: newPw })}
                disabled={!currentPw || newPw.length < 8 || newPw !== confirmPw}>변경</Button>
              <Button size="sm" variant="secondary" onClick={() => { setPwMode(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}>취소</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">비밀번호를 변경하려면 "변경" 버튼을 클릭하세요.</p>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-3">계정 정보</h2>
        <div className="text-sm space-y-2 text-slate-600">
          <div className="flex justify-between"><span>계정 생성일</span><span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</span></div>
          <div className="flex justify-between"><span>상태</span><span className={user?.isActive ? 'text-emerald-600' : 'text-red-600'}>{user?.isActive ? '활성' : '비활성'}</span></div>
        </div>
      </div>
    </div>
  );
}
