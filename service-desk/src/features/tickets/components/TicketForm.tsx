// Design Ref: §5.4 — 고객 포털 티켓 등록 UI Checklist
// Gap Fix: I-2 (파일 업로드 UI), I-3 (프로젝트/요청자 드롭다운)

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createTicketSchema } from '@/lib/validations/ticket';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Paperclip, X } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'ACCESS_REQUEST', label: '접근 권한 요청' },
  { value: 'INCIDENT', label: '장애/오류' },
  { value: 'SERVICE_REQUEST', label: '서비스 요청' },
  { value: 'INQUIRY', label: '문의' },
  { value: 'CHANGE_REQUEST', label: '변경 요청' },
  { value: 'OTHER', label: '기타' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
  { value: 'URGENT', label: '긴급' },
];

export function TicketForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [files, setFiles] = useState<{ id: string; name: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch projects for dropdown (I-3)
  const { data: projectsData } = useQuery({
    queryKey: ['projects-select'],
    queryFn: async () => { const r = await fetch('/api/projects?limit=100'); return r.json(); },
  });
  const projectOptions = (projectsData?.data ?? []).map((p: any) => ({
    value: p.id, label: `${p.client?.name} — ${p.name}`,
  }));

  // Fetch contacts based on selected project (I-3)
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const selectedProject = (projectsData?.data ?? []).find((p: any) => p.id === selectedProjectId);
  const clientId = selectedProject?.client?.id;

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-select', clientId],
    queryFn: async () => { const r = await fetch(`/api/clients/${clientId}/contacts`); return r.json(); },
    enabled: !!clientId,
  });
  const contactOptions = (contactsData?.data ?? []).map((c: any) => ({
    value: c.id, label: `${c.name} (${c.department?.name ?? ''})`,
  }));

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { projectId: '', requesterId: '', title: '', description: '', category: '', priority: 'MEDIUM' as const, channel: 'ONLINE' as const, requestedDueDate: '', attachmentIds: [] as string[] },
  });

  // File upload handler (I-2)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        if (files.length >= 10) break;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type }),
        });
        if (res.ok) {
          const { data } = await res.json();
          setFiles((prev) => [...prev, { id: data.attachmentId, name: file.name, size: file.size }]);
        }
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, attachmentIds: files.map((f) => f.id) }),
      });
      if (!res.ok) {
        const err = await res.json();
        setServerError(err.error?.message ?? '등록에 실패했습니다.');
        return;
      }
      const result = await res.json();
      router.push(`/tickets/${result.data.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">새 티켓 등록</h1>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{serverError}</div>
      )}

      {/* I-3: Project dropdown */}
      <Select
        label="프로젝트 *"
        options={projectOptions}
        {...register('projectId', {
          onChange: (e) => setSelectedProjectId(e.target.value),
        })}
        error={errors.projectId?.message}
      />

      {/* I-3: Contact dropdown (filtered by project's client) */}
      <Select
        label="요청자 *"
        options={contactOptions}
        {...register('requesterId')}
        error={errors.requesterId?.message}
      />

      <Input
        label="제목 *"
        placeholder="티켓 제목을 입력해 주세요"
        {...register('title')}
        error={errors.title?.message}
      />

      <Textarea
        label="설명 *"
        placeholder="요청 내용을 상세히 입력해 주세요"
        {...register('description')}
        error={errors.description?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="카테고리 *"
          options={CATEGORY_OPTIONS}
          {...register('category')}
          error={errors.category?.message}
        />
        <Select
          label="우선순위"
          options={PRIORITY_OPTIONS}
          {...register('priority')}
          error={errors.priority?.message}
        />
      </div>

      <Input
        label="처리희망일 *"
        type="date"
        {...register('requestedDueDate')}
        error={errors.requestedDueDate?.message}
      />

      {/* I-2: File upload UI */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">첨부파일 (최대 10개, 50MB/파일)</label>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <Paperclip className="h-4 w-4" />
            {uploading ? '업로드 중...' : '파일 선택'}
            <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading || files.length >= 10} />
          </label>
          <span className="text-xs text-slate-400">{files.length}/10</span>
        </div>
        {files.length > 0 && (
          <div className="space-y-1">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded">
                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                <span className="flex-1">{f.name}</span>
                <span className="text-slate-400 text-xs">{(f.size / 1024).toFixed(0)}KB</span>
                <button type="button" onClick={() => removeFile(f.id)} className="text-slate-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? '등록 중...' : '등록'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </form>
  );
}
