// Design Anchor: §7 Layout Pattern — Sidebar(256px) + Content

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { LayoutDashboard, Ticket, Settings, Building2, FolderKanban, Users, BarChart3, Shield } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const portalNav: NavItem[] = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/tickets', label: '티켓', icon: Ticket },
  { href: '/settings', label: '설정', icon: Settings },
];

const agentNav: NavItem[] = [
  { href: '/agent-dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/agent-tickets', label: '내 티켓', icon: Ticket },
  { href: '/agent-settings', label: '설정', icon: Settings },
];

const adminNav: NavItem[] = [
  { href: '/admin-dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin-clients', label: '고객사', icon: Building2 },
  { href: '/admin-projects', label: '프로젝트', icon: FolderKanban },
  { href: '/admin-teams', label: '팀 관리', icon: Users },
  { href: '/admin-users', label: '사용자', icon: Users },
  { href: '/admin-sla', label: 'SLA 정책', icon: Shield },
  { href: '/admin-reports', label: '리포트', icon: BarChart3 },
  { href: '/admin-settings', label: '설정', icon: Settings },
];

export function Sidebar({ variant }: { variant: 'portal' | 'agent' | 'admin' }) {
  const pathname = usePathname();
  const nav = variant === 'portal' ? portalNav : variant === 'agent' ? agentNav : adminNav;
  const title = variant === 'portal' ? 'ServiceDesk' : variant === 'agent' ? 'Agent Console' : 'Admin';
  const homeHref = variant === 'portal' ? '/dashboard' : variant === 'agent' ? '/agent-dashboard' : '/admin-dashboard';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <Link href={homeHref} className="text-xl font-bold text-blue-600">{title}</Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
