'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const DEMO_ACCOUNTS = [
  { email: 'admin@servicedesk.com', label: 'Admin (시스템관리자)', role: 'SYSTEM_ADMIN' },
  { email: 'manager@servicedesk.com', label: 'Manager (이민정)', role: 'MANAGER' },
  { email: 'agent1@servicedesk.com', label: 'Agent (박준호)', role: 'AGENT' },
  { email: 'customer1@abc.com', label: 'Customer (김서연)', role: 'CUSTOMER' },
];

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (loginEmail?: string, role?: string) => {
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      email: loginEmail || email,
      password: loginEmail ? 'password123' : password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } else {
      // Role-based redirect
      const targetRole = role || '';
      if (targetRole === 'AGENT') {
        router.push('/agent-dashboard');
      } else if (targetRole === 'SYSTEM_ADMIN' || targetRole === 'MANAGER') {
        router.push('/admin-dashboard');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">ServiceDesk</h1>
          <p className="mt-1 text-slate-500">로그인</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => handleLogin()}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>

        {/* Quick Demo Login */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-3">데모 계정으로 빠른 로그인</h3>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => handleLogin(acc.email, acc.role)}
                disabled={loading}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
              >
                <span className="font-medium text-slate-900">{acc.label}</span>
                <span className="text-xs text-slate-400">{acc.email}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">비밀번호: password123</p>
        </div>
      </div>
    </div>
  );
}
