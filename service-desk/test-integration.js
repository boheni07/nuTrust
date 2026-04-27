// ServiceDesk 통합테스트 v2
const http = require('http');
const fs = require('fs');

const BASE = { hostname: 'localhost', port: 3000 };
const results = [];
let passed = 0, failed = 0;

function log(id, name, ok, status, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${id} ${name} (HTTP ${status})${detail ? ' — ' + detail : ''}`);
  results.push({ id, name, ok, status, detail });
  ok ? passed++ : failed++;
}

function parseCookies(headers) {
  const map = {};
  ((headers || {})['set-cookie'] || []).forEach(c => {
    const [kv] = c.split(';');
    const idx = kv.indexOf('=');
    map[kv.slice(0, idx).trim()] = kv.slice(idx + 1);
  });
  return map;
}
function cookieStr(map) { return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; '); }

function rawReq(opts, body) {
  return new Promise((resolve) => {
    const r = http.request({ ...BASE, ...opts }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let data;
        try { data = JSON.parse(d); } catch { data = d; }
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });
    r.on('error', e => resolve({ status: 0, error: e.message }));
    if (body) r.write(body);
    r.end();
  });
}

async function getSession(email) {
  // 1. CSRF token
  const csrf = await rawReq({ path: '/api/auth/csrf', method: 'GET', headers: {} });
  let jar = parseCookies(csrf.headers);
  const csrfToken = csrf.data?.csrfToken;

  // 2. Login → 302
  const body = `csrfToken=${encodeURIComponent(csrfToken)}&email=${encodeURIComponent(email)}&password=password123`;
  const login = await new Promise((resolve) => {
    const r = http.request({
      ...BASE,
      path: '/api/auth/callback/credentials', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieStr(jar), 'Content-Length': Buffer.byteLength(body) },
    }, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers })); });
    r.on('error', e => resolve({ status: 0 }));
    r.write(body); r.end();
  });
  Object.assign(jar, parseCookies(login.headers));

  // 3. Follow redirect to get session-token
  const loc = login.headers?.location || '/';
  const follow = await rawReq({ path: loc, method: 'GET', headers: { 'Cookie': cookieStr(jar) } });
  Object.assign(jar, parseCookies(follow.headers));

  return { jar, ok: !!jar['authjs.session-token'] };
}

function api(method, path, jar, body) {
  const headers = { 'Content-Type': 'application/json', 'Cookie': cookieStr(jar) };
  return rawReq({ method, path, headers }, body ? JSON.stringify(body) : undefined);
}

(async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ServiceDesk 통합테스트                 ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log('[세션 획득 중...]');
  const admin   = await getSession('admin@servicedesk.com');
  const manager = await getSession('manager@servicedesk.com');
  const agent   = await getSession('agent1@servicedesk.com');
  const customer= await getSession('customer1@abc.com');

  // ── GROUP 1: 인증 ────────────────────────────────
  console.log('\n[GROUP 1] 인증 (Authentication)');
  log('T01', 'Admin 로그인',    admin.ok,    admin.ok    ? 302 : 0);
  log('T02', 'Manager 로그인',  manager.ok,  manager.ok  ? 302 : 0);
  log('T03', 'Agent 로그인',    agent.ok,    agent.ok    ? 302 : 0);
  log('T04', 'Customer 로그인', customer.ok, customer.ok ? 302 : 0);

  // ── GROUP 2: RBAC ────────────────────────────────
  console.log('\n[GROUP 2] 인증 보호 (RBAC)');
  const unauth = await rawReq({ path: '/api/tickets', method: 'GET', headers: {} });
  log('T05', '미인증 → 401', unauth.status === 401, unauth.status);

  const noTeam = await api('GET', '/api/teams', customer.jar);
  log('T06', 'Customer → /api/teams 403', noTeam.status === 403, noTeam.status);

  // ── GROUP 3: 티켓 CRUD ───────────────────────────
  console.log('\n[GROUP 3] 티켓 CRUD');
  const ticketList = await api('GET', '/api/tickets?limit=10', agent.jar);
  log('T07', 'GET /api/tickets', ticketList.status === 200, ticketList.status,
    ticketList.data?.data ? `${ticketList.data.data.length}건` : '');

  const firstTicket = ticketList.data?.data?.[0];
  const createBody = {
    title: '통합테스트 티켓 ' + Date.now(),
    description: '자동 생성된 테스트 티켓입니다.',
    category: 'TEST',
    priority: 'LOW',
    channel: 'ONLINE',
    requestedDueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    projectId: firstTicket?.projectId,
    requesterId: firstTicket?.requesterId,
  };
  const created = await api('POST', '/api/tickets', customer.jar, createBody);
  log('T08', 'POST /api/tickets (등록)', created.status === 201, created.status);
  const tid = created.data?.data?.id;

  const detail = tid ? await api('GET', `/api/tickets/${tid}`, agent.jar) : { status: 0 };
  log('T09', 'GET /api/tickets/:id (상세)', detail.status === 200, detail.status,
    detail.data?.data?.status);

  // ── GROUP 4: 상태 전환 ───────────────────────────
  console.log('\n[GROUP 4] 상태 전환 (State Machine)');
  const dueDate = new Date(Date.now() + 5 * 86400000).toISOString();

  const acceptRes = tid ? await api('POST', `/api/tickets/${tid}/accept`, agent.jar, {
    actionPlan: '통합테스트 처리계획',
    plannedDueDate: dueDate,
  }) : { status: 0 };
  log('T10', 'ACCEPT (REGISTERED→IN_PROGRESS)', acceptRes.status === 200, acceptRes.status);

  const afterAccept = tid ? await api('GET', `/api/tickets/${tid}`, agent.jar) : { status: 0 };
  log('T11', '상태 확인 → IN_PROGRESS',
    afterAccept.data?.data?.status === 'IN_PROGRESS', afterAccept.status,
    afterAccept.data?.data?.status);

  const completeRes = tid ? await api('POST', `/api/tickets/${tid}/complete`, agent.jar) : { status: 0 };
  log('T12', 'COMPLETE (→COMPLETION_REQUESTED)', completeRes.status === 200, completeRes.status);

  const approveRes = tid ? await api('POST', `/api/tickets/${tid}/approve`, customer.jar) : { status: 0 };
  log('T13', 'APPROVE (→APPROVED)', approveRes.status === 200, approveRes.status);

  const csatRes = tid ? await api('POST', `/api/tickets/${tid}/csat`, customer.jar, {
    rating: 5, feedback: '통합테스트 CSAT — 매우 만족',
  }) : { status: 0 };
  log('T14', 'CSAT (→CLOSED)', csatRes.status === 201, csatRes.status);

  const finalState = tid ? await api('GET', `/api/tickets/${tid}`, agent.jar) : { status: 0 };
  log('T15', '최종 상태 → CLOSED',
    finalState.data?.data?.status === 'CLOSED', finalState.status,
    finalState.data?.data?.status);

  // ── GROUP 5: 연기 3중 가드 ──────────────────────
  console.log('\n[GROUP 5] 연기 3중 가드 (Postponement Guard)');
  const t2 = await api('POST', '/api/tickets', customer.jar, {
    ...createBody,
    title: '연기 가드 테스트 ' + Date.now(),
    requestedDueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
  });
  const t2id = t2.data?.data?.id;

  if (t2id) {
    await api('POST', `/api/tickets/${t2id}/accept`, agent.jar, {
      actionPlan: '연기 테스트용',
      plannedDueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    });
  }

  const postpone1 = t2id ? await api('POST', `/api/tickets/${t2id}/postpone`, agent.jar, {
    requestedDueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    reason: '1회차 연기 사유',
  }) : { status: 0 };
  log('T16', '정상 연기 1회차 → 200', postpone1.status === 200, postpone1.status);

  const postpone2 = t2id ? await api('POST', `/api/tickets/${t2id}/postpone`, agent.jar, {
    requestedDueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    reason: '2회차 연기 시도',
  }) : { status: 0 };
  log('T17', '2회차 연기 → POSTPONEMENT_LIMIT_EXCEEDED',
    postpone2.status === 400 && postpone2.data?.error?.code === 'POSTPONEMENT_LIMIT_EXCEEDED',
    postpone2.status, postpone2.data?.error?.code || '');

  // ── GROUP 6: 댓글 & 이력 ────────────────────────
  console.log('\n[GROUP 6] 댓글 & 이력');
  const commentRes = firstTicket?.id ? await api('POST', `/api/tickets/${firstTicket.id}/comments`, agent.jar, {
    content: '통합테스트 댓글', isInternal: false,
  }) : { status: 0 };
  log('T18', 'POST /comments (고객 댓글)', commentRes.status === 201, commentRes.status);

  const internalRes = firstTicket?.id ? await api('POST', `/api/tickets/${firstTicket.id}/comments`, agent.jar, {
    content: '내부 메모 테스트', isInternal: true,
  }) : { status: 0 };
  log('T19', 'POST /comments (내부 메모)', internalRes.status === 201, internalRes.status);

  const historyRes = firstTicket?.id ? await api('GET', `/api/tickets/${firstTicket.id}/history`, agent.jar) : { status: 0 };
  log('T20', 'GET /history (상태 이력)', historyRes.status === 200, historyRes.status,
    historyRes.data?.data ? `${historyRes.data.data.length}건` : '');

  // ── GROUP 7: 관리자 API ──────────────────────────
  console.log('\n[GROUP 7] 관리자 API');
  const clients  = await api('GET', '/api/clients', admin.jar);
  log('T21', 'GET /api/clients',      clients.status === 200,  clients.status,  clients.data?.data?.length + '건');
  const projects = await api('GET', '/api/projects', admin.jar);
  log('T22', 'GET /api/projects',     projects.status === 200, projects.status, projects.data?.data?.length + '건');
  const teams    = await api('GET', '/api/teams', admin.jar);
  log('T23', 'GET /api/teams',        teams.status === 200,    teams.status,    teams.data?.data?.length + '건');
  const users    = await api('GET', '/api/users', admin.jar);
  log('T24', 'GET /api/users',        users.status === 200,    users.status,    users.data?.data?.length + '건');
  const slaPols  = await api('GET', '/api/sla-policies', admin.jar);
  log('T25', 'GET /api/sla-policies', slaPols.status === 200,  slaPols.status,  slaPols.data?.data?.length + '건');

  // ── GROUP 8: 대시보드 ────────────────────────────
  console.log('\n[GROUP 8] 대시보드 & 리포트');
  const agentDash = await api('GET', '/api/dashboard/agent', agent.jar);
  log('T26', 'GET /api/dashboard/agent',   agentDash.status === 200,  agentDash.status);
  const mgrDash   = await api('GET', '/api/dashboard/manager', manager.jar);
  log('T27', 'GET /api/dashboard/manager', mgrDash.status === 200,    mgrDash.status);
  const slaRep    = await api('GET', '/api/reports/sla', admin.jar);
  log('T28', 'GET /api/reports/sla',       slaRep.status === 200,     slaRep.status);

  // ── GROUP 9: 세션 & 사용자 ───────────────────────
  console.log('\n[GROUP 9] 세션 & 사용자 프로필');
  const session = await api('GET', '/api/auth/session', agent.jar);
  log('T29', 'GET /api/auth/session', session.status === 200 && !!session.data?.user, session.status,
    session.data?.user?.role);

  const meRes = await api('GET', '/api/users/me', agent.jar);
  log('T30', 'GET /api/users/me', meRes.status === 200, meRes.status, meRes.data?.data?.name);

  // ── 결과 요약 ────────────────────────────────────
  const rate = Math.round(passed / (passed + failed) * 100);
  console.log('\n╔══════════════════════════════════════════╗');
  console.log(`║  결과: ${passed} PASS / ${failed} FAIL / 총 ${passed + failed}건       `.padEnd(44) + '║');
  console.log(`║  Match Rate: ${rate}%`.padEnd(44) + '║');
  console.log('╚══════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\n[실패 목록]');
    results.filter(r => !r.ok).forEach(r =>
      console.log(`  ✗ ${r.id} ${r.name} — HTTP ${r.status} ${r.detail}`));
  } else {
    console.log('\n모든 테스트 통과!');
  }

  fs.writeFileSync('test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    passed, failed, total: passed + failed, rate: rate + '%', results,
  }, null, 2));
  console.log('\n결과 저장: test-results.json');
})();
