import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">ServiceDesk</h1>
          <p className="mt-2 text-slate-500">티켓 기반 고객 신뢰 구축 플랫폼</p>
        </div>

        <Link
          href="/auth/signin"
          className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          로그인
        </Link>

        <div className="text-center text-sm text-slate-400 space-y-1">
          <p>로그인 후 역할에 따라 화면이 전환됩니다</p>
          <p className="text-xs">nuTrust Platform v1.0</p>
        </div>
      </div>
    </div>
  );
}
