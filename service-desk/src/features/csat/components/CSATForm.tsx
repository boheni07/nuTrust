// M-2: CSAT 폼 (TicketDetail에서 분리)

'use client';

import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface CSATFormProps {
  onSubmit: (rating: number, feedback?: string) => void;
}

export function CSATForm({ onSubmit }: CSATFormProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
      <h3 className="font-semibold text-blue-900 mb-3">만족도 평가</h3>
      <div className="flex gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)}
            className={`w-10 h-10 rounded-full text-lg font-bold transition-colors ${rating >= n ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-400'}`}
          >{n}</button>
        ))}
      </div>
      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
        placeholder="의견을 남겨주세요 (선택)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm mb-3" rows={2} />
      <Button onClick={() => onSubmit(rating, feedback || undefined)} disabled={rating === 0}>평가 제출</Button>
    </div>
  );
}

export function CSATDisplay({ rating, feedback }: { rating: number; feedback?: string }) {
  return (
    <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4 flex items-center gap-3">
      <div className="flex gap-1">{[1,2,3,4,5].map(n => <span key={n} className={`text-lg ${n <= rating ? 'text-amber-400' : 'text-slate-300'}`}>&#9733;</span>)}</div>
      <span className="text-sm text-emerald-800 font-medium">{rating}/5</span>
      {feedback && <span className="text-sm text-emerald-700">— {feedback}</span>}
    </div>
  );
}
