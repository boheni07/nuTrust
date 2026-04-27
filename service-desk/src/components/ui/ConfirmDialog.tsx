// Design Ref: §4.2 — 삭제 확인 다이얼로그

'use client';

import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = '삭제', isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="px-6 py-4 space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>취소</Button>
          <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? '처리 중...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
