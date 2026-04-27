// Design Ref: §4.1 — 이메일 알림 (FR-43)
// Plan SC: SC-6 (이메일 알림 발송)

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = 'ServiceDesk <noreply@servicedesk.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

async function send(params: EmailParams) {
  if (!resend) {
    console.log(`[EMAIL-DEV] To: ${params.to} | Subject: ${params.subject}`);
    return;
  }
  await resend.emails.send({ from: FROM, ...params });
}

export async function sendTicketRegistered(to: string, ticketNumber: string, title: string, ticketId: string) {
  await send({
    to,
    subject: `[ServiceDesk] 티켓 등록 완료 — ${ticketNumber}`,
    html: `
      <h2>티켓이 등록되었습니다</h2>
      <p><strong>${ticketNumber}</strong> — ${title}</p>
      <p>담당자 배정 후 처리가 시작됩니다.</p>
      <p><a href="${APP_URL}/tickets/${ticketId}">티켓 확인하기</a></p>
    `,
  });
}

export async function sendTicketAccepted(to: string, ticketNumber: string, assigneeName: string, actionPlan: string, ticketId: string) {
  await send({
    to,
    subject: `[ServiceDesk] 티켓 접수 — ${ticketNumber}`,
    html: `
      <h2>티켓이 접수되었습니다</h2>
      <p><strong>${ticketNumber}</strong></p>
      <p>담당자: ${assigneeName}</p>
      <p>처리계획: ${actionPlan}</p>
      <p><a href="${APP_URL}/tickets/${ticketId}">진행 상황 확인하기</a></p>
    `,
  });
}

export async function sendCompletionRequested(to: string, ticketNumber: string, title: string, ticketId: string) {
  await send({
    to,
    subject: `[ServiceDesk] 승인 요청 — ${ticketNumber}`,
    html: `
      <h2>처리가 완료되어 승인을 요청합니다</h2>
      <p><strong>${ticketNumber}</strong> — ${title}</p>
      <p>결과를 확인하시고 승인 또는 반려해 주세요.</p>
      <p><a href="${APP_URL}/tickets/${ticketId}">승인/반려하기</a></p>
    `,
  });
}

export async function sendPostponementRequested(to: string, ticketNumber: string, reason: string, newDate: string, ticketId: string) {
  await send({
    to,
    subject: `[ServiceDesk] 연기 요청 — ${ticketNumber}`,
    html: `
      <h2>완료예정일 연기 요청</h2>
      <p><strong>${ticketNumber}</strong></p>
      <p>사유: ${reason}</p>
      <p>새 완료예정일: ${newDate}</p>
      <p><a href="${APP_URL}/tickets/${ticketId}">승인/반려하기</a></p>
    `,
  });
}

export async function sendTicketApproved(to: string, ticketNumber: string, ticketId: string) {
  await send({
    to,
    subject: `[ServiceDesk] 승인 완료 — ${ticketNumber}`,
    html: `
      <h2>티켓이 승인되었습니다</h2>
      <p><strong>${ticketNumber}</strong></p>
      <p><a href="${APP_URL}/tickets/${ticketId}">상세 보기</a></p>
    `,
  });
}

export async function sendTicketRejected(to: string, ticketNumber: string, reason: string, ticketId: string) {
  await send({
    to,
    subject: `[ServiceDesk] 반려 — ${ticketNumber}`,
    html: `
      <h2>티켓이 반려되었습니다</h2>
      <p><strong>${ticketNumber}</strong></p>
      <p>사유: ${reason}</p>
      <p>추가 처리가 필요합니다.</p>
      <p><a href="${APP_URL}/tickets/${ticketId}">확인하기</a></p>
    `,
  });
}

export async function sendNewComment(to: string, ticketNumber: string, authorName: string, ticketId: string) {
  await send({
    to,
    subject: `[ServiceDesk] 새 댓글 — ${ticketNumber}`,
    html: `
      <h2>새 댓글이 등록되었습니다</h2>
      <p><strong>${ticketNumber}</strong></p>
      <p>작성자: ${authorName}</p>
      <p><a href="${APP_URL}/tickets/${ticketId}">확인하기</a></p>
    `,
  });
}
