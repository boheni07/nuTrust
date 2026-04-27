// 풍성한 샘플 데이터 — 각 엔티티 10개씩

import { PrismaClient, TicketStatus, TicketPriority, TicketChannel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.cSATRating.deleteMany();
  await prisma.postponementRequest.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.projectAssignment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.department.deleteMany();
  await prisma.client.deleteMany();
  await prisma.sLAPolicy.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  console.log('Seeding full data (10 each)...');
  const hash = await bcrypt.hash('password123', 12);

  // ===== 10 Teams =====
  const teams = await Promise.all([
    prisma.team.create({ data: { name: 'IT지원1팀' } }),
    prisma.team.create({ data: { name: 'IT지원2팀' } }),
    prisma.team.create({ data: { name: '인프라운영팀' } }),
    prisma.team.create({ data: { name: '보안관제팀' } }),
    prisma.team.create({ data: { name: '애플리케이션지원팀' } }),
    prisma.team.create({ data: { name: 'DB관리팀' } }),
    prisma.team.create({ data: { name: '네트워크팀' } }),
    prisma.team.create({ data: { name: '클라우드팀' } }),
    prisma.team.create({ data: { name: 'QA팀' } }),
    prisma.team.create({ data: { name: '개발지원팀' } }),
  ]);

  // ===== 10+ Users (각 역할별) =====
  const admin = await prisma.user.create({
    data: { email: 'admin@servicedesk.com', name: '시스템관리자', passwordHash: hash, role: 'SYSTEM_ADMIN' },
  });

  const managers = await Promise.all([
    prisma.user.create({ data: { email: 'manager1@servicedesk.com', name: '이민정', passwordHash: hash, role: 'MANAGER', teamId: teams[0].id } }),
    prisma.user.create({ data: { email: 'manager2@servicedesk.com', name: '정대현', passwordHash: hash, role: 'MANAGER', teamId: teams[2].id } }),
  ]);

  const agents = await Promise.all([
    prisma.user.create({ data: { email: 'agent1@servicedesk.com', name: '박준호', passwordHash: hash, role: 'AGENT', teamId: teams[0].id } }),
    prisma.user.create({ data: { email: 'agent2@servicedesk.com', name: '최영수', passwordHash: hash, role: 'AGENT', teamId: teams[0].id } }),
    prisma.user.create({ data: { email: 'agent3@servicedesk.com', name: '한지민', passwordHash: hash, role: 'AGENT', teamId: teams[1].id } }),
    prisma.user.create({ data: { email: 'agent4@servicedesk.com', name: '김태우', passwordHash: hash, role: 'AGENT', teamId: teams[2].id } }),
    prisma.user.create({ data: { email: 'agent5@servicedesk.com', name: '이수진', passwordHash: hash, role: 'AGENT', teamId: teams[3].id } }),
    prisma.user.create({ data: { email: 'agent6@servicedesk.com', name: '장현우', passwordHash: hash, role: 'AGENT', teamId: teams[4].id } }),
    prisma.user.create({ data: { email: 'agent7@servicedesk.com', name: '윤서영', passwordHash: hash, role: 'AGENT', teamId: teams[5].id } }),
    prisma.user.create({ data: { email: 'agent8@servicedesk.com', name: '송민재', passwordHash: hash, role: 'AGENT', teamId: teams[6].id } }),
    prisma.user.create({ data: { email: 'agent9@servicedesk.com', name: '오하늘', passwordHash: hash, role: 'AGENT', teamId: teams[7].id } }),
    prisma.user.create({ data: { email: 'agent10@servicedesk.com', name: '배지훈', passwordHash: hash, role: 'AGENT', teamId: teams[8].id } }),
  ]);

  const customers = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.user.create({ data: { email: `customer${i+1}@example.com`, name: `고객${i+1}`, passwordHash: hash, role: 'CUSTOMER' } })
    )
  );

  // ===== 10 Clients =====
  const clientData = [
    { name: '(주)ABC제조', contactEmail: 'it@abc.co.kr', contactPhone: '02-1234-5678', address: '서울시 강남구 테헤란로 123' },
    { name: '(주)XYZ금융', contactEmail: 'support@xyz.co.kr', contactPhone: '02-9876-5432', address: '서울시 영등포구 여의대로 456' },
    { name: '대한전자(주)', contactEmail: 'help@daehan.co.kr', contactPhone: '031-111-2222', address: '경기도 수원시 영통구' },
    { name: '한국화학(주)', contactEmail: 'service@hkchem.co.kr', contactPhone: '032-333-4444', address: '인천시 남동구 공단로' },
    { name: '미래건설(주)', contactEmail: 'it@mirae.co.kr', contactPhone: '02-555-6666', address: '서울시 서초구 반포대로' },
    { name: '세종물류(주)', contactEmail: 'admin@sejong.co.kr', contactPhone: '042-777-8888', address: '대전시 유성구 세종로' },
    { name: '글로벌IT서비스', contactEmail: 'desk@globalit.co.kr', contactPhone: '02-100-2000', address: '서울시 마포구 상암동' },
    { name: '스마트헬스케어(주)', contactEmail: 'support@smarthealth.co.kr', contactPhone: '02-300-4000', address: '서울시 송파구 올림픽로' },
    { name: '(주)테크솔루션', contactEmail: 'help@techsol.co.kr', contactPhone: '031-500-6000', address: '경기도 성남시 분당구' },
    { name: '코리아에너지(주)', contactEmail: 'it@kenergy.co.kr', contactPhone: '052-700-8000', address: '울산시 남구 공업로' },
  ];
  const clients = await Promise.all(clientData.map(d => prisma.client.create({ data: d })));

  // ===== 10+ Departments (각 고객사에 2~3개) =====
  const deptNames = ['IT팀', '마케팅팀', '생산팀', '영업팀', '인사팀', '재무팀', '구매팀', '품질관리팀', '연구개발팀', '고객지원팀'];
  const departments: any[] = [];
  for (let i = 0; i < clients.length; i++) {
    const numDepts = i < 5 ? 3 : 2;
    for (let j = 0; j < numDepts; j++) {
      const dept = await prisma.department.create({
        data: { clientId: clients[i].id, name: deptNames[(i * 2 + j) % deptNames.length] },
      });
      departments.push(dept);
    }
  }

  // ===== 10+ Contacts (각 고객사에 1~2개) =====
  const contactNames = [
    { name: '김서연', position: '과장' }, { name: '이철수', position: '대리' },
    { name: '박민수', position: '팀장' }, { name: '정하나', position: '주임' },
    { name: '최동현', position: '과장' }, { name: '윤미래', position: '사원' },
    { name: '강현석', position: '차장' }, { name: '임수정', position: '부장' },
    { name: '조영호', position: '대리' }, { name: '한소희', position: '과장' },
  ];
  const contacts: any[] = [];
  for (let i = 0; i < 10; i++) {
    const clientIdx = Math.min(i, clients.length - 1);
    const deptIdx = i % departments.length;
    // Match department to same client
    const clientDepts = departments.filter(d => d.clientId === clients[clientIdx].id);
    const dept = clientDepts[i % clientDepts.length] || departments[0];
    const contact = await prisma.contact.create({
      data: {
        clientId: clients[clientIdx].id,
        departmentId: dept.id,
        userId: customers[i].id,
        name: contactNames[i].name,
        email: `customer${i+1}@example.com`,
        phone: `010-${String(1000 + i).slice(0, 4)}-${String(5000 + i * 111).slice(0, 4)}`,
        position: contactNames[i].position,
      },
    });
    contacts.push(contact);
  }

  // ===== 10 Projects =====
  const projectData = [
    { clientIdx: 0, name: 'ERP 운영 지원', description: 'ABC제조 ERP 시스템 운영 및 사용자 지원' },
    { clientIdx: 0, name: '보안 체계 수립', description: 'ABC제조 정보보안 정책 수립 및 점검' },
    { clientIdx: 1, name: '코어뱅킹 유지보수', description: 'XYZ금융 코어뱅킹 시스템 유지보수' },
    { clientIdx: 2, name: 'MES 시스템 구축', description: '대한전자 스마트 팩토리 MES 구축' },
    { clientIdx: 3, name: 'EHS 관리 시스템', description: '한국화학 환경안전보건 시스템 운영' },
    { clientIdx: 4, name: '현장관리 앱 개발', description: '미래건설 현장관리 모바일 앱 개발 지원' },
    { clientIdx: 5, name: 'TMS 운영 지원', description: '세종물류 운송관리 시스템 운영' },
    { clientIdx: 6, name: 'SI 프로젝트 지원', description: '글로벌IT 고객사 SI 프로젝트 기술 지원' },
    { clientIdx: 7, name: 'EMR 시스템 유지보수', description: '스마트헬스케어 전자의무기록 유지보수' },
    { clientIdx: 8, name: '클라우드 마이그레이션', description: '테크솔루션 AWS 클라우드 이전' },
  ];
  const projects = await Promise.all(
    projectData.map(p => prisma.project.create({
      data: { clientId: clients[p.clientIdx].id, name: p.name, description: p.description, status: 'ACTIVE' },
    }))
  );

  // ===== Project Assignments (각 프로젝트에 1~2명 배정) =====
  for (let i = 0; i < projects.length; i++) {
    await prisma.projectAssignment.create({
      data: { projectId: projects[i].id, agentId: agents[i % agents.length].id, role: 'LEAD' },
    });
    if (i < 7) {
      await prisma.projectAssignment.create({
        data: { projectId: projects[i].id, agentId: agents[(i + 1) % agents.length].id, role: 'MEMBER' },
      });
    }
  }

  // ===== 10 SLA Policies =====
  const slaData = [
    { name: '기본 SLA', acceptanceHours: 4, resolutionHours: 48, isDefault: true },
    { name: 'HIGH 우선순위', priority: 'HIGH' as const, acceptanceHours: 2, resolutionHours: 24 },
    { name: 'URGENT 우선순위', priority: 'URGENT' as const, acceptanceHours: 1, resolutionHours: 8 },
    { name: '접근권한 요청', category: 'ACCESS_REQUEST', acceptanceHours: 4, resolutionHours: 24 },
    { name: '장애/오류', category: 'INCIDENT', acceptanceHours: 1, resolutionHours: 16 },
    { name: '서비스 요청', category: 'SERVICE_REQUEST', acceptanceHours: 4, resolutionHours: 72 },
    { name: '변경 요청', category: 'CHANGE_REQUEST', acceptanceHours: 4, resolutionHours: 120 },
    { name: '문의', category: 'INQUIRY', acceptanceHours: 4, resolutionHours: 48 },
    { name: 'VIP 고객', acceptanceHours: 1, resolutionHours: 4 },
    { name: '야간/주말', acceptanceHours: 8, resolutionHours: 72 },
  ];
  await Promise.all(slaData.map(d => prisma.sLAPolicy.create({ data: d })));

  // ===== 10 Tickets (다양한 상태) =====
  const now = new Date();
  const day = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
  const ago = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  const ticketData = [
    { num: 'SD-20260407-001', proj: 0, req: 0, reg: customers[0].id, agent: agents[0].id, title: 'ERP 접속 권한 요청', desc: '신규 입사자 김민수 사원에게 ERP 모듈 접속 권한 부여 요청합니다.', cat: 'ACCESS_REQUEST', pri: 'MEDIUM' as TicketPriority, ch: 'ONLINE' as TicketChannel, status: 'IN_PROGRESS' as TicketStatus, reqDue: day(5), planDue: day(5), plan: 'ERP 관리자 콘솔에서 권한 부여 후 테스트 접속 확인 예정', acceptedAt: ago(1) },
    { num: 'SD-20260407-002', proj: 0, req: 1, reg: agents[0].id, agent: null, title: '생산 라인 모니터링 화면 오류', desc: '생산 라인 3번 모니터링 화면에서 실시간 데이터가 표시되지 않습니다.', cat: 'INCIDENT', pri: 'HIGH' as TicketPriority, ch: 'PHONE' as TicketChannel, status: 'REGISTERED' as TicketStatus, reqDue: day(1), planDue: null, plan: null, acceptedAt: null },
    { num: 'SD-20260407-003', proj: 2, req: 2, reg: customers[2].id, agent: agents[2].id, title: '코어뱅킹 배치 처리 지연', desc: '야간 배치 처리가 평소보다 2시간 이상 지연되고 있습니다.', cat: 'INCIDENT', pri: 'URGENT' as TicketPriority, ch: 'ONLINE' as TicketChannel, status: 'COMPLETION_REQUESTED' as TicketStatus, reqDue: ago(0), planDue: ago(0), plan: '배치 서버 로그 분석 완료, 인덱스 리빌드로 해결', acceptedAt: ago(1) },
    { num: 'SD-20260407-004', proj: 3, req: 3, reg: customers[3].id, agent: agents[3].id, title: 'MES 센서 데이터 누락 알림', desc: '3공장 A라인 센서에서 데이터가 30분째 수신되지 않습니다.', cat: 'INCIDENT', pri: 'HIGH' as TicketPriority, ch: 'ONLINE' as TicketChannel, status: 'DELAYED' as TicketStatus, reqDue: ago(2), planDue: ago(2), plan: '센서 네트워크 점검 및 재연결 시도', acceptedAt: ago(3) },
    { num: 'SD-20260407-005', proj: 4, req: 4, reg: agents[4].id, agent: agents[4].id, title: 'EHS 보고서 출력 오류', desc: '월간 환경안전 보고서 PDF 출력 시 차트가 깨져서 나옵니다. 전화로 접수.', cat: 'SERVICE_REQUEST', pri: 'MEDIUM' as TicketPriority, ch: 'PHONE' as TicketChannel, status: 'IN_PROGRESS' as TicketStatus, reqDue: day(3), planDue: day(3), plan: 'PDF 렌더링 라이브러리 버전 업데이트 예정', acceptedAt: ago(1) },
    { num: 'SD-20260407-006', proj: 5, req: 5, reg: customers[5].id, agent: agents[5].id, title: 'TMS 배차 최적화 모듈 문의', desc: '배차 최적화 알고리즘 설정 방법에 대해 문의드립니다.', cat: 'INQUIRY', pri: 'LOW' as TicketPriority, ch: 'EMAIL' as TicketChannel, status: 'APPROVED' as TicketStatus, reqDue: day(7), planDue: day(7), plan: '매뉴얼 전달 및 화상 교육 진행 완료', acceptedAt: ago(5) },
    { num: 'SD-20260407-007', proj: 6, req: 6, reg: customers[6].id, agent: agents[6].id, title: '고객사 포털 SSL 인증서 갱신', desc: 'SI 프로젝트 고객 포털의 SSL 인증서가 7일 후 만료됩니다. 갱신 요청합니다.', cat: 'SERVICE_REQUEST', pri: 'HIGH' as TicketPriority, ch: 'ONLINE' as TicketChannel, status: 'CLOSED' as TicketStatus, reqDue: ago(3), planDue: ago(3), plan: 'Let\'s Encrypt 자동 갱신 스크립트 적용 완료', acceptedAt: ago(6), closedAt: ago(1) },
    { num: 'SD-20260407-008', proj: 7, req: 7, reg: customers[7].id, agent: agents[7].id, title: 'EMR 환자 데이터 조회 느림', desc: '환자 검색 시 10초 이상 걸립니다. 인덱스 최적화 요청합니다.', cat: 'INCIDENT', pri: 'HIGH' as TicketPriority, ch: 'ONLINE' as TicketChannel, status: 'POSTPONEMENT_REQUESTED' as TicketStatus, reqDue: day(2), planDue: day(2), plan: 'DB 인덱스 분석 중, 야간 점검 시간 필요', acceptedAt: ago(1), postponementCount: 0 },
    { num: 'SD-20260407-009', proj: 8, req: 8, reg: customers[8].id, agent: agents[8].id, title: 'AWS VPC 피어링 설정 요청', desc: '개발 환경과 스테이징 환경 간 VPC 피어링 설정이 필요합니다.', cat: 'CHANGE_REQUEST', pri: 'MEDIUM' as TicketPriority, ch: 'ONLINE' as TicketChannel, status: 'ACCEPTED' as TicketStatus, reqDue: day(10), planDue: day(10), plan: 'AWS 콘솔에서 VPC 피어링 구성 예정', acceptedAt: now },
    { num: 'SD-20260407-010', proj: 9, req: 9, reg: agents[9].id, agent: agents[9].id, title: '코리아에너지 VPN 접속 장애', desc: '본사에서 울산 공장 VPN 접속이 불가합니다. 이메일로 접수.', cat: 'INCIDENT', pri: 'URGENT' as TicketPriority, ch: 'EMAIL' as TicketChannel, status: 'REGISTERED' as TicketStatus, reqDue: day(0), planDue: null, plan: null, acceptedAt: null },
  ];

  for (const t of ticketData) {
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: t.num,
        projectId: projects[t.proj].id,
        requesterId: contacts[t.req].id,
        registeredById: t.reg,
        assigneeId: t.agent,
        title: t.title,
        description: t.desc,
        category: t.cat,
        priority: t.pri,
        channel: t.ch,
        status: t.status,
        requestedDueDate: t.reqDue,
        plannedDueDate: t.planDue,
        actionPlan: t.plan,
        acceptedAt: t.acceptedAt,
        acceptedBy: t.agent,
        isAutoAccepted: false,
        postponementCount: (t as any).postponementCount ?? 0,
        closedAt: (t as any).closedAt ?? null,
      },
    });

    // Status history
    await prisma.ticketStatusHistory.create({
      data: { ticketId: ticket.id, fromStatus: null, toStatus: 'REGISTERED', changedBy: t.reg },
    });
    if (t.status !== 'REGISTERED') {
      await prisma.ticketStatusHistory.create({
        data: { ticketId: ticket.id, fromStatus: 'REGISTERED', toStatus: 'ACCEPTED', changedBy: t.agent || 'SYSTEM', duration: 3600 },
      });
    }
    if (['IN_PROGRESS', 'DELAYED', 'COMPLETION_REQUESTED', 'POSTPONEMENT_REQUESTED', 'APPROVED', 'CLOSED'].includes(t.status)) {
      await prisma.ticketStatusHistory.create({
        data: { ticketId: ticket.id, fromStatus: 'ACCEPTED', toStatus: 'IN_PROGRESS', changedBy: t.agent!, duration: 600 },
      });
    }
    if (t.status === 'DELAYED') {
      await prisma.ticketStatusHistory.create({
        data: { ticketId: ticket.id, fromStatus: 'IN_PROGRESS', toStatus: 'DELAYED', changedBy: 'SYSTEM', duration: 86400 },
      });
    }
    if (t.status === 'COMPLETION_REQUESTED') {
      await prisma.ticketStatusHistory.create({
        data: { ticketId: ticket.id, fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETION_REQUESTED', changedBy: t.agent!, duration: 7200 },
      });
    }
    if (t.status === 'APPROVED' || t.status === 'CLOSED') {
      await prisma.ticketStatusHistory.create({
        data: { ticketId: ticket.id, fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETION_REQUESTED', changedBy: t.agent!, duration: 7200 },
      });
      await prisma.ticketStatusHistory.create({
        data: { ticketId: ticket.id, fromStatus: 'COMPLETION_REQUESTED', toStatus: 'APPROVED', changedBy: contacts[t.req].userId!, duration: 1800 },
      });
    }

    // CSAT for CLOSED/APPROVED tickets
    if (t.status === 'CLOSED' || t.status === 'APPROVED') {
      await prisma.cSATRating.create({
        data: { ticketId: ticket.id, rating: 3 + Math.floor(Math.random() * 3), feedback: ['매우 빠른 처리 감사합니다.', '처리 과정이 투명하게 공유되어 좋았습니다.', '다음에는 좀 더 빨리 처리해 주세요.', '만족합니다.'][Math.floor(Math.random() * 4)], ratedById: contacts[t.req].id },
      });
    }

    // Postponement for POSTPONEMENT_REQUESTED
    if (t.status === 'POSTPONEMENT_REQUESTED') {
      await prisma.postponementRequest.create({
        data: { ticketId: ticket.id, requestedById: t.agent!, currentDueDate: t.planDue!, requestedDueDate: day(7), reason: 'DB 인덱스 리빌드를 위해 야간 점검 시간이 필요합니다.', status: 'PENDING' },
      });
    }

    // Comments (2~3 per ticket)
    if (t.agent && t.status !== 'REGISTERED') {
      await prisma.comment.create({
        data: { ticketId: ticket.id, authorId: t.agent, type: 'PUBLIC', content: '접수 완료했습니다. 확인 후 처리 진행하겠습니다.' },
      });
      await prisma.comment.create({
        data: { ticketId: ticket.id, authorId: t.agent, type: 'INTERNAL', content: '담당자 내부 메모: 유사 건이 지난주에도 있었음. KB-1234 참조.' },
      });
      if (contacts[t.req].userId) {
        await prisma.comment.create({
          data: { ticketId: ticket.id, authorId: contacts[t.req].userId!, type: 'PUBLIC', content: '확인했습니다. 빠른 처리 부탁드립니다.' },
        });
      }
    }
  }

  console.log('');
  console.log('Seed completed!');
  console.log('  - 10 clients');
  console.log('  - 25 departments');
  console.log('  - 10 contacts');
  console.log('  - 10 projects + 17 assignments');
  console.log('  - 10 teams');
  console.log('  - 23 users (1 admin, 2 managers, 10 agents, 10 customers)');
  console.log('  - 10 SLA policies');
  console.log('  - 10 tickets (다양한 상태: REGISTERED, ACCEPTED, IN_PROGRESS, DELAYED, COMPLETION_REQUESTED, POSTPONEMENT_REQUESTED, APPROVED, CLOSED)');
  console.log('  - 30+ comments, 2 CSAT ratings, 1 postponement request');
  console.log('');
  console.log('Login (password: password123):');
  console.log('  Admin:    admin@servicedesk.com');
  console.log('  Manager:  manager1@servicedesk.com');
  console.log('  Agent:    agent1@servicedesk.com ~ agent10@servicedesk.com');
  console.log('  Customer: customer1@example.com ~ customer10@example.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
