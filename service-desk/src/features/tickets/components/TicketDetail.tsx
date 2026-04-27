// 티켓 상세 — 정보존 분리 + 댓글(좌)/이력(우) 2컬럼 + 파일 다운로드

'use client';

import { useTicketDetail, useTicketAction } from '../hooks/useTickets';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { Clock, FileText, Paperclip, MessageSquare, Download, X } from 'lucide-react';

const CHANNEL_LABELS: Record<string, string> = {
  ONLINE: '온라인', PHONE: '전화', EMAIL: '이메일', OTHER: '기타',
};

function AttachmentLink({ att }: { att: any }) {
  const handleDownload = async () => {
    const res = await fetch(`/api/attachments/${att.id}/download`);
    const { data } = await res.json();
    if (data?.downloadUrl && data.downloadUrl !== '#') {
      window.open(data.downloadUrl, '_blank');
    } else {
      alert(`${att.fileName} — 개발 모드에서는 다운로드가 지원되지 않습니다.`);
    }
  };
  return (
    <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline">
      <Download className="h-3.5 w-3.5" />
      <span>{att.fileName}</span>
      <span className="text-slate-400 text-xs">({(att.fileSize / 1024).toFixed(0)}KB)</span>
    </button>
  );
}

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const { data, isLoading, refetch } = useTicketDetail(ticketId);
  const action = useTicketAction();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [csatRating, setCsatRating] = useState(0);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [comment, setComment] = useState('');
  const [commentFiles, setCommentFiles] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <div className="text-slate-400 py-8 text-center">로딩 중...</div>;
  const ticket = data?.data;
  if (!ticket) return <div className="text-slate-400 py-8 text-center">티켓을 찾을 수 없습니다.</div>;

  const handleApprove = () => { action.mutate({ ticketId, action: 'approve' }); };
  const handleReject = () => {
    if (!rejectReason.trim()) return;
    action.mutate({ ticketId, action: 'reject', body: { reason: rejectReason } });
    setShowRejectModal(false);
    setRejectReason('');
  };
  const handleApprovePostponement = () => { action.mutate({ ticketId, action: 'approve-postponement' }); };
  const handleRejectPostponement = () => { action.mutate({ ticketId, action: 'reject-postponement' }); };
  const handleCSAT = () => {
    if (csatRating === 0) return;
    action.mutate({ ticketId, action: 'csat', body: { rating: csatRating, feedback: csatFeedback || undefined } });
  };

  const handleCommentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    for (const file of Array.from(e.target.files)) {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setCommentFiles(prev => [...prev, { id: data.attachmentId, name: file.name }]);
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment, type: 'PUBLIC', attachmentIds: commentFiles.map(f => f.id) }),
    });
    setComment('');
    setCommentFiles([]);
    refetch();
  };

  const sortedComments = [...(ticket.comments || [])].reverse();

  return (
    <div className="max-w-6xl space-y-6">
      {/* ===== Header + Actions ===== */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-sm text-slate-500">{ticket.ticketNumber}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{ticket.title}</h1>
          <div className="flex gap-2 mt-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <div className="flex gap-2">
          {ticket.status === 'COMPLETION_REQUESTED' && (
            <>
              <Button variant="approve" onClick={handleApprove}>승인</Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)}>반려</Button>
            </>
          )}
          {ticket.status === 'POSTPONEMENT_REQUESTED' && (
            <>
              <Button variant="approve" onClick={handleApprovePostponement}>연기 승인</Button>
              <Button variant="danger" onClick={handleRejectPostponement}>연기 반려</Button>
            </>
          )}
        </div>
      </div>

      {/* ===== Zone 1: 티켓 전반 정보 ===== */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">티켓 정보</h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <div><span className="text-slate-500">프로젝트</span><p className="font-medium text-slate-900">{ticket.project?.name}</p></div>
          <div><span className="text-slate-500">고객사</span><p className="font-medium text-slate-900">{ticket.project?.client?.name}</p></div>
          <div><span className="text-slate-500">카테고리</span><p className="font-medium text-slate-900">{ticket.category}</p></div>
        </div>
      </div>

      {/* ===== Zone 2: 등록 정보 ===== */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">등록 정보</h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <div><span className="text-slate-500">요청자</span><p className="font-medium text-slate-900">{ticket.requester?.name} {ticket.requester?.department?.name && `(${ticket.requester.department.name})`}</p></div>
          <div><span className="text-slate-500">등록자</span><p className="font-medium text-slate-900">{ticket.registeredBy?.name}</p></div>
          <div><span className="text-slate-500">등록 채널</span><p className="font-medium text-slate-900">{CHANNEL_LABELS[ticket.channel] ?? ticket.channel}</p></div>
          <div><span className="text-slate-500">처리희망일</span><p className="font-medium text-slate-900">{format(new Date(ticket.requestedDueDate), 'yyyy-MM-dd')}</p></div>
          <div><span className="text-slate-500">등록일</span><p className="font-medium text-slate-900">{format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm')}</p></div>
        </div>
        <div className="mt-4">
          <span className="text-sm text-slate-500">설명</span>
          <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1 bg-slate-50 rounded-lg p-4">{ticket.description}</p>
        </div>
        {ticket.attachments?.length > 0 && (
          <div className="mt-3">
            <span className="text-sm text-slate-500 flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />첨부파일</span>
            <div className="mt-1 space-y-1">
              {ticket.attachments.map((att: any) => <AttachmentLink key={att.id} att={att} />)}
            </div>
          </div>
        )}
      </div>

      {/* ===== Zone 3: 접수/처리계획 정보 (접수 후 표시) ===== */}
      {ticket.acceptedAt && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">접수 / 처리계획</h3>
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
            <div><span className="text-slate-500">담당자</span><p className="font-medium text-slate-900">{ticket.assignee?.name ?? '미배정'}</p></div>
            <div><span className="text-slate-500">접수일시</span><p className="font-medium text-slate-900">{format(new Date(ticket.acceptedAt), 'yyyy-MM-dd HH:mm')}</p></div>
            <div><span className="text-slate-500">완료예정일</span><p className="font-medium text-slate-900">{ticket.plannedDueDate ? format(new Date(ticket.plannedDueDate), 'yyyy-MM-dd') : '-'}</p></div>
            {ticket.isAutoAccepted && (
              <div><span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">자동 접수</span></div>
            )}
          </div>
          {ticket.actionPlan && (
            <div className="mt-4">
              <span className="text-sm text-slate-500">처리계획</span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1 bg-blue-50 rounded-lg p-4 border border-blue-100">{ticket.actionPlan}</p>
            </div>
          )}
          {ticket.postponement && (
            <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-sm font-medium text-amber-800">연기 요청 ({ticket.postponement.status === 'PENDING' ? '대기중' : ticket.postponement.status === 'APPROVED' ? '승인됨' : '반려됨'})</p>
              <p className="text-sm text-amber-700 mt-1">사유: {ticket.postponement.reason}</p>
              <p className="text-sm text-amber-700">새 완료예정일: {format(new Date(ticket.postponement.requestedDueDate), 'yyyy-MM-dd')}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== CSAT (APPROVED 상태) ===== */}
      {ticket.status === 'APPROVED' && !ticket.csatRating && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-3">만족도 평가</h3>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setCsatRating(n)}
                className={`w-10 h-10 rounded-full text-lg font-bold transition-colors ${csatRating >= n ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-400'}`}
              >{n}</button>
            ))}
          </div>
          <textarea value={csatFeedback} onChange={(e) => setCsatFeedback(e.target.value)}
            placeholder="의견을 남겨주세요 (선택)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-3" rows={2} />
          <Button onClick={handleCSAT} disabled={csatRating === 0}>평가 제출</Button>
        </div>
      )}
      {ticket.csatRating && (
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4 flex items-center gap-3">
          <div className="flex gap-1">{[1,2,3,4,5].map(n => <span key={n} className={`text-lg ${n <= ticket.csatRating.rating ? 'text-amber-400' : 'text-slate-300'}`}>&#9733;</span>)}</div>
          <span className="text-sm text-emerald-800 font-medium">{ticket.csatRating.rating}/5</span>
          {ticket.csatRating.feedback && <span className="text-sm text-emerald-700">— {ticket.csatRating.feedback}</span>}
        </div>
      )}

      {/* ===== 2컬럼: 좌(댓글) / 우(상태이력) ===== */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left: Comments */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4" />댓글</h3>

          {/* Comment Input (상단) */}
          <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="댓글을 입력해 주세요..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white" rows={3} />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                  <Paperclip className="h-3.5 w-3.5" />{uploading ? '업로드 중...' : '파일 첨부'}
                </button>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleCommentFileUpload} />
                {commentFiles.map(f => (
                  <span key={f.id} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {f.name}
                    <button onClick={() => setCommentFiles(prev => prev.filter(x => x.id !== f.id))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <Button size="sm" onClick={handleComment} disabled={!comment.trim()}>등록</Button>
            </div>
          </div>

          {/* Comment List (최신 상단) */}
          <div className="space-y-4">
            {sortedComments.length === 0 && <p className="text-sm text-slate-400">댓글이 없습니다.</p>}
            {sortedComments.map((c: any) => (
              <div key={c.id} className={`border-l-2 pl-4 ${c.type === 'INTERNAL' ? 'border-amber-300 bg-amber-50 rounded-r-lg p-3' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-900">{c.author?.name}</span>
                  <span className="text-xs text-slate-400">{format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                  {c.type === 'INTERNAL' && <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">내부 메모</span>}
                </div>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{c.content}</p>
                {c.attachments?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {c.attachments.map((att: any) => <AttachmentLink key={att.id} att={att} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Status History (좁은 존) */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock className="h-4 w-4" />상태 이력</h3>
          <div className="space-y-0">
            {ticket.statusHistory?.map((h: any, i: number) => (
              <div key={h.id} className="relative pl-6 pb-4 last:pb-0">
                {/* Vertical line */}
                {i < ticket.statusHistory.length - 1 && (
                  <div className="absolute left-[9px] top-3 bottom-0 w-px bg-slate-200" />
                )}
                {/* Dot */}
                <div className="absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full border-2 border-blue-400 bg-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                {/* Content */}
                <div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {h.fromStatus && <><StatusBadge status={h.fromStatus} /><span className="text-slate-400 text-xs mx-0.5">→</span></>}
                    <StatusBadge status={h.toStatus} />
                  </div>
                  {h.reason && <p className="text-xs text-slate-500 mt-0.5">사유: {h.reason}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {format(new Date(h.createdAt), 'MM-dd HH:mm')}
                    {h.duration ? ` (${h.duration >= 3600 ? `${Math.floor(h.duration / 3600)}h` : `${Math.floor(h.duration / 60)}m`})` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Reject Modal ===== */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-slate-900 mb-3">반려 사유 입력</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력해 주세요 (필수)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-4" rows={3} />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>취소</Button>
              <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>반려</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
