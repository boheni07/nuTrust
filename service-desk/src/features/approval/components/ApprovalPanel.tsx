// M-1: 승인/반려 패널 (TicketDetail에서 분리)

'use client';

import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface ApprovalPanelProps {
  ticketId: string;
  status: string;
  onAction: (action: string, body?: any) => void;
}

export function ApprovalPanel({ ticketId, status, onAction }: ApprovalPanelProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  if (status !== 'COMPLETION_REQUESTED' && status !== 'POSTPONEMENT_REQUESTED') return null;

  return (
    <>
      <div className="flex gap-2">
        {status === 'COMPLETION_REQUESTED' && (
          <>
            <Button variant="approve" onClick={() => onAction('approve')}>승인</Button>
            <Button variant="danger" onClick={() => setShowRejectModal(true)}>반려</Button>
          </>
        )}
        {status === 'POSTPONEMENT_REQUESTED' && (
          <>
            <Button variant="approve" onClick={() => onAction('approve-postponement')}>연기 승인</Button>
            <Button variant="danger" onClick={() => onAction('reject-postponement')}>연기 반려</Button>
          </>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="font-semibold text-slate-900 mb-3">반려 사유 입력</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력해 주세요 (필수)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-4" rows={3} />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>취소</Button>
              <Button variant="danger" onClick={() => { onAction('reject', { reason: rejectReason }); setShowRejectModal(false); setRejectReason(''); }} disabled={!rejectReason.trim()}>반려</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
