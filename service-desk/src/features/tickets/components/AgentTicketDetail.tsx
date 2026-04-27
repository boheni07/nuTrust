// 담당자 티켓 상세 — 정보존 분리 + 댓글(좌)/이력(우) + 내부메모 지원

'use client';

import { useTicketDetail, useTicketAction } from '../hooks/useTickets';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { Clock, Paperclip, MessageSquare, Download, X } from 'lucide-react';

const CHANNEL_LABELS: Record<string, string> = { ONLINE: '온라인', PHONE: '전화', EMAIL: '이메일', OTHER: '기타' };

function AttachmentLink({ att }: { att: any }) {
  const handleDownload = async () => {
    const res = await fetch(`/api/attachments/${att.id}/download`);
    const { data } = await res.json();
    if (data?.downloadUrl && data.downloadUrl !== '#') window.open(data.downloadUrl, '_blank');
    else alert(`${att.fileName} — 개발 모드에서는 다운로드가 지원되지 않습니다.`);
  };
  return (
    <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
      <Download className="h-3.5 w-3.5" />{att.fileName} <span className="text-slate-400 text-xs">({(att.fileSize / 1024).toFixed(0)}KB)</span>
    </button>
  );
}

export function AgentTicketDetail({ ticketId }: { ticketId: string }) {
  const { data, isLoading, refetch } = useTicketDetail(ticketId);
  const action = useTicketAction();
  const [comment, setComment] = useState('');
  const [commentType, setCommentType] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  const [commentFiles, setCommentFiles] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [postponeForm, setPostponeForm] = useState(false);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeReason, setPostponeReason] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <div className="text-slate-400 py-8 text-center">로딩 중...</div>;
  const ticket = data?.data;
  if (!ticket) return <div className="text-slate-400 py-8 text-center">티켓을 찾을 수 없습니다.</div>;

  const handleCommentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    for (const file of Array.from(e.target.files)) {
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type }) });
      if (res.ok) { const { data } = await res.json(); setCommentFiles(prev => [...prev, { id: data.attachmentId, name: file.name }]); }
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await fetch(`/api/tickets/${ticketId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: comment, type: commentType, attachmentIds: commentFiles.map(f => f.id) }) });
    setComment(''); setCommentFiles([]); refetch();
  };

  const handlePostpone = () => {
    if (!postponeDate || !postponeReason.trim()) return;
    action.mutate({ ticketId, action: 'postpone', body: { requestedDueDate: new Date(postponeDate).toISOString(), reason: postponeReason } });
    setPostponeForm(false);
  };

  const sortedComments = [...(ticket.comments || [])].reverse();

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header + Actions */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-sm text-slate-500">{ticket.ticketNumber}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{ticket.title}</h1>
          <div className="flex gap-2 mt-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.postponementCount > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">연기 {ticket.postponementCount}/1</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {(ticket.status === 'REGISTERED' || ticket.status === 'ACCEPTED') && (
            <Button onClick={() => action.mutate({ ticketId, action: 'accept', body: { actionPlan: '처리 예정', plannedDueDate: ticket.requestedDueDate } })}>접수 및 처리시작</Button>
          )}
          {(ticket.status === 'IN_PROGRESS' || ticket.status === 'DELAYED') && (
            <>
              <Button variant="approve" onClick={() => action.mutate({ ticketId, action: 'complete' })}>완료요청</Button>
              {ticket.status === 'IN_PROGRESS' && ticket.postponementCount < 1 && (
                <Button variant="secondary" onClick={() => setPostponeForm(true)}>연기요청</Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Zone 1: 티켓 정보 */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">티켓 정보</h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <div><span className="text-slate-500">프로젝트</span><p className="font-medium">{ticket.project?.name}</p></div>
          <div><span className="text-slate-500">고객사</span><p className="font-medium">{ticket.project?.client?.name}</p></div>
          <div><span className="text-slate-500">카테고리</span><p className="font-medium">{ticket.category}</p></div>
        </div>
      </div>

      {/* Zone 2: 등록 정보 */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">등록 정보</h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <div><span className="text-slate-500">요청자</span><p className="font-medium">{ticket.requester?.name} ({ticket.requester?.department?.name})</p></div>
          <div><span className="text-slate-500">등록 채널</span><p className="font-medium">{CHANNEL_LABELS[ticket.channel]}</p></div>
          <div><span className="text-slate-500">처리희망일</span><p className="font-medium">{format(new Date(ticket.requestedDueDate), 'yyyy-MM-dd')}</p></div>
        </div>
        <div className="mt-4">
          <span className="text-sm text-slate-500">설명</span>
          <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1 bg-slate-50 rounded-lg p-4">{ticket.description}</p>
        </div>
        {ticket.attachments?.length > 0 && (
          <div className="mt-3 space-y-1">
            {ticket.attachments.map((att: any) => <AttachmentLink key={att.id} att={att} />)}
          </div>
        )}
      </div>

      {/* Zone 3: 접수/처리계획 */}
      {ticket.acceptedAt && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">접수 / 처리계획</h3>
          <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
            <div><span className="text-slate-500">담당자</span><p className="font-medium">{ticket.assignee?.name}</p></div>
            <div><span className="text-slate-500">접수일시</span><p className="font-medium">{format(new Date(ticket.acceptedAt), 'yyyy-MM-dd HH:mm')}</p></div>
            <div><span className="text-slate-500">완료예정일</span><p className="font-medium">{ticket.plannedDueDate ? format(new Date(ticket.plannedDueDate), 'yyyy-MM-dd') : '-'}</p></div>
          </div>
          {ticket.actionPlan && (
            <div className="mt-4">
              <span className="text-sm text-slate-500">처리계획</span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1 bg-blue-50 rounded-lg p-4 border border-blue-100">{ticket.actionPlan}</p>
            </div>
          )}
        </div>
      )}

      {/* 2컬럼: 좌(댓글) / 우(이력) */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left: Comments */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4" />소통</h3>

          {/* Comment Input */}
          <div className="border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setCommentType('PUBLIC')} className={`px-3 py-1 text-xs rounded-full ${commentType === 'PUBLIC' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>공개 댓글</button>
              <button onClick={() => setCommentType('INTERNAL')} className={`px-3 py-1 text-xs rounded-full ${commentType === 'INTERNAL' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>내부 메모</button>
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder={commentType === 'PUBLIC' ? '고객에게 공개되는 댓글...' : '내부 팀원만 볼 수 있는 메모...'}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white" rows={3} />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50">
                  <Paperclip className="h-3.5 w-3.5" />{uploading ? '업로드 중...' : '파일 첨부'}
                </button>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleCommentFileUpload} />
                {commentFiles.map(f => (
                  <span key={f.id} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {f.name}<button onClick={() => setCommentFiles(prev => prev.filter(x => x.id !== f.id))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <Button size="sm" onClick={handleComment} disabled={!comment.trim()}>
                {commentType === 'PUBLIC' ? '댓글 등록' : '메모 등록'}
              </Button>
            </div>
          </div>

          {/* Comment List (최신 상단) */}
          <div className="space-y-4">
            {sortedComments.length === 0 && <p className="text-sm text-slate-400">댓글이 없습니다.</p>}
            {sortedComments.map((c: any) => (
              <div key={c.id} className={`border-l-2 pl-4 ${c.type === 'INTERNAL' ? 'border-amber-300 bg-amber-50 rounded-r-lg p-3' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-slate-900">{c.author?.name}</span>
                  <span className="text-xs text-slate-400">{format(new Date(c.createdAt), 'MM-dd HH:mm')}</span>
                  {c.type === 'INTERNAL' && <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">내부 메모</span>}
                </div>
                <p className="text-sm text-slate-700 mt-1">{c.content}</p>
                {c.attachments?.length > 0 && (
                  <div className="mt-1 space-y-1">{c.attachments.map((att: any) => <AttachmentLink key={att.id} att={att} />)}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Status History */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock className="h-4 w-4" />상태 이력</h3>
          <div className="space-y-0">
            {ticket.statusHistory?.map((h: any, i: number) => (
              <div key={h.id} className="relative pl-6 pb-4 last:pb-0">
                {i < ticket.statusHistory.length - 1 && <div className="absolute left-[9px] top-3 bottom-0 w-px bg-slate-200" />}
                <div className="absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full border-2 border-blue-400 bg-white flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {h.fromStatus && <><StatusBadge status={h.fromStatus} /><span className="text-slate-400 text-xs mx-0.5">→</span></>}
                    <StatusBadge status={h.toStatus} />
                  </div>
                  {h.reason && <p className="text-xs text-slate-500 mt-0.5">{h.reason}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{format(new Date(h.createdAt), 'MM-dd HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Postpone Modal */}
      {postponeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-slate-900 mb-3">연기 요청</h3>
            <p className="text-sm text-slate-500 mb-4">연기는 1회만 가능하며, 완료예정일 전에만 신청할 수 있습니다.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">새 완료예정일 *</label>
                <input type="date" value={postponeDate} onChange={(e) => setPostponeDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">연기 사유 *</label>
                <textarea value={postponeReason} onChange={(e) => setPostponeReason(e.target.value)} placeholder="연기 사유를 입력해 주세요" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={3} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="secondary" onClick={() => setPostponeForm(false)}>취소</Button>
              <Button onClick={handlePostpone} disabled={!postponeDate || !postponeReason.trim()}>연기 요청</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
