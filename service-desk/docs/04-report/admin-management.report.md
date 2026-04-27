# Report: 관리자 CRUD 관리 기능 (admin-management)

**Feature**: admin-management  
**Phase**: Completed  
**Date**: 2026-04-08  
**Match Rate**: 100%  
**Iteration Count**: 1 (G-01 수정)

---

## Executive Summary

| 관점 | 계획 | 결과 |
|------|------|------|
| **Problem** | 고객사·프로젝트 목록이 읽기 전용으로, 관리자가 DB 직접 접근 필요 | 5개 도메인 전부 브라우저에서 완전 관리 가능 상태로 전환 |
| **Solution** | 모달 기반 CRUD UI + 공통 컴포넌트 + DELETE API 추가 | 계획대로 13개 파일 생성/확장, 성공 기준 8/8 달성 |
| **Functional UX** | 관리자가 탭 모달에서 부서·담당자·에이전트 배정까지 처리 | ClientList 탭 모달, ProjectList 배정 탭, 팀원 배정/해제 모두 구현 |
| **Core Value** | 리스크 최소 — API 계층은 이미 완성이므로 UI만 추가 | 신규 API 6개 추가(DELETE)로 완전한 CRUD 루프 완성 |

### 1.3 Value Delivered

| 지표 | 목표 | 결과 |
|------|------|------|
| 관리 가능 도메인 | 5개 | 5개 (고객사/프로젝트/팀/사용자/SLA) |
| 성공 기준 달성 | 8/8 | 8/8 (100%) |
| 신규 삭제 API | 6개 | 6개 (모두 404/409 처리 포함) |
| TypeScript 오류 | 0 | 0 |
| Match Rate | ≥90% | 100% |

---

## 2. Journey: PRD → Code

### 2.1 Phase 흐름

```
[Plan] 2026-04-08  →  [Design] 2026-04-08  →  [Do ×4] 2026-04-08  →  [Check] 2026-04-08
  8 FRs, 8 SCs          Option C 선택          module-1~4 순차 구현       G-01 발견·수정
```

### 2.2 Implementation Sessions

| 세션 | 범위 | 결과 |
|------|------|------|
| module-1,2 | 공통 UI (Modal/ConfirmDialog) + DELETE API 6개 + ClientList 전면 재구성 | ✅ |
| module-3,4 | ProjectList 재구성 + admin-teams/users/sla 페이지 확장 | ✅ |
| G-01 fix | clients/projects/teams DELETE에 findUnique 404 추가 | ✅ |

---

## 3. Key Decisions & Outcomes

| 결정 | 선택 | 결과 |
|------|------|------|
| 아키텍처 | Option C (Pragmatic Balance) | 기존 파일 확장 + 공통 컴포넌트 2개 — 균형 달성 |
| 모달 패턴 | 공통 Modal.tsx + ConfirmDialog.tsx | 모든 도메인에서 재사용, 코드 중복 없음 |
| 고객사 모달 구조 | 탭 내장 (기본정보/부서/담당자) | 단일 모달에서 하위 자원까지 관리 — UX 단순화 |
| 삭제 차단 | 409 응답 + UI 에러 배너 | 연결 데이터 보호, 사용자에게 명확한 메시지 |
| DELETE 404 처리 | findUnique 선제 체크 | P2025 Prisma 오류 노출 방지, 일관된 404 반환 |
| 팀원 관리 방식 | PUT /api/users/:id { teamId } 재사용 | 별도 팀원 API 없이 기존 PUT 확장으로 처리 |

---

## 4. Success Criteria Final Status

| SC | 기준 | 상태 | 증거 |
|----|------|------|------|
| SC-1 | 고객사 등록/수정/삭제 모달 | ✅ Met | `ClientList.tsx` — 3종 모달 |
| SC-2 | 부서/담당자 탭 CRUD | ✅ Met | `DepartmentsTab`, `ContactsTab` |
| SC-3 | 프로젝트 등록/수정/삭제 모달 | ✅ Met | `ProjectList.tsx` |
| SC-4 | 프로젝트 에이전트 배정/해제 | ✅ Met | `AssignmentsTab` |
| SC-5 | 삭제 차단 + 에러 메시지 | ✅ Met | 409 → 에러 배너 |
| SC-6 | 팀 수정/삭제 + 팀원 관리 | ✅ Met | `admin-teams/page.tsx` |
| SC-7 | 사용자 수정(이름/역할/팀) | ✅ Met | `admin-users/page.tsx` |
| SC-8 | SLA 정책 수정/삭제 | ✅ Met | `admin-sla/page.tsx` |

**Overall Success Rate: 8/8 (100%)**

---

## 5. 구현 산출물

### 5.1 신규 생성 파일

| 파일 | 역할 |
|------|------|
| `src/components/ui/Modal.tsx` | 공통 모달 래퍼 (ESC/백드롭 닫기, 사이즈 지원) |
| `src/components/ui/ConfirmDialog.tsx` | 삭제 확인 다이얼로그 |
| `src/app/api/clients/[id]/departments/[deptId]/route.ts` | 부서 DELETE (담당자 있으면 409) |
| `src/app/api/clients/[id]/contacts/[contactId]/route.ts` | 담당자 DELETE |
| `src/app/api/teams/[id]/route.ts` | 팀 PUT (이름 수정) + DELETE (멤버 있으면 409) |

### 5.2 확장 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/app/api/clients/[id]/route.ts` | +DELETE (프로젝트 있으면 409, 없으면 404) |
| `src/app/api/projects/[id]/route.ts` | +DELETE (티켓 있으면 409, 없으면 404) |
| `src/app/api/sla-policies/[id]/route.ts` | +DELETE (기본 정책 차단) |
| `src/lib/validations/project.ts` | `updateProjectSchema`에 status 필드 추가 |
| `src/features/clients/components/ClientList.tsx` | 전면 재구성 — 3종 모달 + 2종 탭 |
| `src/features/projects/components/ProjectList.tsx` | 전면 재구성 — 생성/수정/삭제 모달 + 배정 탭 |
| `src/app/(admin)/admin-teams/page.tsx` | 수정/삭제 + 팀원 배정/해제 추가 |
| `src/app/(admin)/admin-users/page.tsx` | 수정 모달(이름/역할/팀) 추가 |
| `src/app/(admin)/admin-sla/page.tsx` | SLAFormFields + 수정/삭제 추가 |

---

## 6. 갭 분석 요약

| ID | 심각도 | 내용 | 상태 |
|----|--------|------|------|
| G-01 | Minor | DELETE 존재하지 않는 ID → 500 (P2025 미처리) | ✅ 수정 완료 |

---

## 7. 학습사항 (Lessons Learned)

| 항목 | 내용 |
|------|------|
| Prisma P2025 | `delete()`는 레코드 없으면 P2025 예외를 던짐 — `withErrorHandler`는 이를 처리하지 않으므로 DELETE 라우트에서는 항상 `findUnique` 선제 체크가 필요 |
| 탭 모달 복잡도 | 고객사 모달처럼 하위 자원이 있는 경우 탭 내부에 별도 상태(`activeTab`)와 별도 mutation이 필요 — 공통 Modal 래퍼만으로는 부족, 도메인 로직은 기능 컴포넌트에 유지 |
| 팀원 API 재사용 | 별도 팀원 추가/제거 API 없이 `PUT /api/users/:id { teamId }` 재사용으로 충분 — API 설계 시 userId ↔ teamId 관계를 User 모델에서 관리하면 별도 매핑 테이블 불필요 |
| 기본 정책 삭제 차단 | `isDefault` 플래그 체크를 API+UI 양쪽에서 처리 — UI에서는 버튼 disable, API에서는 409 반환으로 이중 방어 |

---

## 8. Next Steps

- 통합 테스트(`test-integration.js`)에 DELETE 엔드포인트 테스트 케이스 추가 (T26+)
- 고객사 담당자(Contact) ↔ 사용자(User) 계정 연동 (Out of Scope였으나 향후 필요 가능성 있음)
- 프로젝트별 SLA 정책 연결 기능 (현재 Out of Scope)
