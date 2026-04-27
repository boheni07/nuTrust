'use client';

import { useSession, signOut } from 'next-auth/react';
import { Bell, User, LogOut } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: '시스템관리자',
  MANAGER: '운영관리자',
  AGENT: '지원담당자',
  CUSTOMER: '고객',
};

export function Header() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
          <Bell className="h-5 w-5" />
        </button>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[user.role] ?? user.role}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-slate-400">로그인 필요</span>
        )}
      </div>
    </header>
  );
}
