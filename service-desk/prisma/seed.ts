// Design Ref: §8.5 — Seed Data Requirements

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ===== Teams =====
  const team1 = await prisma.team.create({ data: { name: 'IT지원1팀' } });
  const team2 = await prisma.team.create({ data: { name: 'IT지원2팀' } });

  // ===== Users =====
  const hash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: { email: 'admin@servicedesk.com', name: '관리자', passwordHash: hash, role: 'SYSTEM_ADMIN' },
  });
  const manager = await prisma.user.create({
    data: { email: 'manager@servicedesk.com', name: '이민정', passwordHash: hash, role: 'MANAGER', teamId: team1.id },
  });
  const agent1 = await prisma.user.create({
    data: { email: 'agent1@servicedesk.com', name: '박준호', passwordHash: hash, role: 'AGENT', teamId: team1.id },
  });
  const agent2 = await prisma.user.create({
    data: { email: 'agent2@servicedesk.com', name: '최영수', passwordHash: hash, role: 'AGENT', teamId: team1.id },
  });
  const agent3 = await prisma.user.create({
    data: { email: 'agent3@servicedesk.com', name: '한지민', passwordHash: hash, role: 'AGENT', teamId: team2.id },
  });

  const customer1 = await prisma.user.create({
    data: { email: 'customer1@abc.com', name: '김서연', passwordHash: hash, role: 'CUSTOMER' },
  });
  const customer2 = await prisma.user.create({
    data: { email: 'customer2@abc.com', name: '이철수', passwordHash: hash, role: 'CUSTOMER' },
  });
  const customer3 = await prisma.user.create({
    data: { email: 'customer3@xyz.com', name: '박민수', passwordHash: hash, role: 'CUSTOMER' },
  });

  // ===== Clients =====
  const clientA = await prisma.client.create({
    data: { name: '(주)ABC제조', contactEmail: 'it@abc.com', contactPhone: '02-1234-5678', address: '서울시 강남구' },
  });
  const clientB = await prisma.client.create({
    data: { name: '(주)XYZ금융', contactEmail: 'support@xyz.com', contactPhone: '02-9876-5432', address: '서울시 여의도' },
  });

  // ===== Departments =====
  const deptIT_A = await prisma.department.create({ data: { clientId: clientA.id, name: 'IT팀' } });
  const deptMkt_A = await prisma.department.create({ data: { clientId: clientA.id, name: '마케팅팀' } });
  const deptProd_A = await prisma.department.create({ data: { clientId: clientA.id, name: '생산팀' } });
  const deptIT_B = await prisma.department.create({ data: { clientId: clientB.id, name: 'IT운영팀' } });
  const deptFin_B = await prisma.department.create({ data: { clientId: clientB.id, name: '금융서비스팀' } });

  // ===== Contacts =====
  const contact1 = await prisma.contact.create({
    data: { clientId: clientA.id, departmentId: deptMkt_A.id, userId: customer1.id, name: '김서연', email: 'customer1@abc.com', position: '과장' },
  });
  const contact2 = await prisma.contact.create({
    data: { clientId: clientA.id, departmentId: deptProd_A.id, userId: customer2.id, name: '이철수', email: 'customer2@abc.com', position: '대리' },
  });
  const contact3 = await prisma.contact.create({
    data: { clientId: clientB.id, departmentId: deptIT_B.id, userId: customer3.id, name: '박민수', email: 'customer3@xyz.com', position: '팀장' },
  });

  // ===== Projects =====
  const proj1 = await prisma.project.create({
    data: { clientId: clientA.id, name: 'ERP 운영 지원', description: 'ABC제조 ERP 시스템 운영 및 사용자 지원', status: 'ACTIVE' },
  });
  const proj2 = await prisma.project.create({
    data: { clientId: clientA.id, name: '보안 컨설팅', description: 'ABC제조 보안 체계 수립 및 점검', status: 'ACTIVE' },
  });
  const proj3 = await prisma.project.create({
    data: { clientId: clientB.id, name: '코어뱅킹 유지보수', description: 'XYZ금융 코어뱅킹 시스템 유지보수', status: 'ACTIVE' },
  });
  const proj4 = await prisma.project.create({
    data: { clientId: clientB.id, name: '인프라 마이그레이션', description: '클라우드 마이그레이션 프로젝트', status: 'COMPLETED' },
  });

  // ===== Project Assignments =====
  await prisma.projectAssignment.createMany({
    data: [
      { projectId: proj1.id, agentId: agent1.id, role: 'LEAD' },
      { projectId: proj1.id, agentId: agent2.id, role: 'MEMBER' },
      { projectId: proj2.id, agentId: agent2.id, role: 'LEAD' },
      { projectId: proj3.id, agentId: agent3.id, role: 'LEAD' },
      { projectId: proj3.id, agentId: agent1.id, role: 'MEMBER' },
    ],
  });

  // ===== SLA Policies =====
  await prisma.sLAPolicy.createMany({
    data: [
      { name: '기본 SLA', acceptanceHours: 4, resolutionHours: 48, isDefault: true },
      { name: 'HIGH 우선순위', priority: 'HIGH', acceptanceHours: 2, resolutionHours: 24 },
      { name: 'URGENT 우선순위', priority: 'URGENT', acceptanceHours: 1, resolutionHours: 8 },
    ],
  });

  // ===== Sample Tickets =====
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'SD-20260407-001',
      projectId: proj1.id,
      requesterId: contact1.id,
      registeredById: customer1.id,
      assigneeId: agent1.id,
      title: 'ERP 접속 권한 요청',
      description: '신규 입사자 김민수 사원에게 ERP 모듈 접속 권한 부여 요청합니다.',
      category: 'ACCESS_REQUEST',
      priority: 'MEDIUM',
      channel: 'ONLINE',
      status: 'IN_PROGRESS',
      requestedDueDate: nextWeek,
      plannedDueDate: nextWeek,
      actionPlan: 'ERP 관리자 콘솔에서 권한 부여 후 테스트 접속 확인 예정',
      acceptedAt: now,
      acceptedBy: agent1.id,
    },
  });

  await prisma.ticket.create({
    data: {
      ticketNumber: 'SD-20260407-002',
      projectId: proj1.id,
      requesterId: contact2.id,
      registeredById: agent1.id,
      title: '생산 라인 모니터링 화면 오류',
      description: '생산 라인 3번 모니터링 화면에서 실시간 데이터가 표시되지 않습니다. 전화로 접수.',
      category: 'INCIDENT',
      priority: 'HIGH',
      channel: 'PHONE',
      status: 'REGISTERED',
      requestedDueDate: tomorrow,
    },
  });

  await prisma.ticket.create({
    data: {
      ticketNumber: 'SD-20260407-003',
      projectId: proj3.id,
      requesterId: contact3.id,
      registeredById: customer3.id,
      assigneeId: agent3.id,
      title: '코어뱅킹 배치 처리 지연',
      description: '야간 배치 처리가 평소보다 2시간 이상 지연되고 있습니다.',
      category: 'INCIDENT',
      priority: 'URGENT',
      channel: 'ONLINE',
      status: 'COMPLETION_REQUESTED',
      requestedDueDate: now,
      plannedDueDate: now,
      actionPlan: '배치 서버 로그 분석 완료, 인덱스 리빌드로 해결',
      acceptedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      acceptedBy: agent3.id,
    },
  });

  // ===== Status History for ticket1 =====
  await prisma.ticketStatusHistory.createMany({
    data: [
      { ticketId: ticket1.id, fromStatus: null, toStatus: 'REGISTERED', changedBy: customer1.id },
      { ticketId: ticket1.id, fromStatus: 'REGISTERED', toStatus: 'ACCEPTED', changedBy: agent1.id, duration: 3600 },
      { ticketId: ticket1.id, fromStatus: 'ACCEPTED', toStatus: 'IN_PROGRESS', changedBy: agent1.id, duration: 600 },
    ],
  });

  console.log('Seed completed!');
  console.log('  - 2 clients, 5 departments, 3 contacts');
  console.log('  - 4 projects, 5 assignments');
  console.log('  - 8 users (1 admin, 1 manager, 3 agents, 3 customers)');
  console.log('  - 3 SLA policies');
  console.log('  - 3 sample tickets');
  console.log('');
  console.log('Login credentials (all passwords: password123):');
  console.log('  Admin:    admin@servicedesk.com');
  console.log('  Manager:  manager@servicedesk.com');
  console.log('  Agent:    agent1@servicedesk.com');
  console.log('  Customer: customer1@abc.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
