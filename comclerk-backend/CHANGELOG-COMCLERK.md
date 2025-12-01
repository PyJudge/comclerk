# ComClerk 변경 로그

OpenCode에서 fork된 이후의 변경 사항을 기록합니다.

## 2024-12-01

### 프로젝트 리브랜딩
- **변경 내용**: OpenLaw → ComClerk로 프로젝트명 변경
- 폴더명: `openlaw-backend` → `comclerk-backend`, `openlaw-web` → `comclerk-web`
- 모든 참조 파일 업데이트

### anthropic.txt 시스템 프롬프트 재작성
- **파일**: `packages/opencode/src/session/prompt/anthropic.txt`
- **변경 내용**:
  - 법률 문서 분석용 AI 에이전트 프롬프트로 완전 재작성
  - 기본 원칙 6개 정의 (기록성, 출처 표기, 정확성, 인용 우선, 평가 금지, 균형 유지)
  - `<example>` 블록 4개 추가 (출처표기, 균형유지, 간결성, 구체성)
- **백업**: `anthropic-backup.txt`에 원본 보관

---

## comclerk-web 변경 사항

### 2024-12-01

#### 앱 실행 시 자동 새 세션 생성
- **파일**: `app/dashboard/page.tsx`
- **변경 내용**: `/dashboard` 접속 시 자동으로 새 세션 생성 후 해당 세션으로 리다이렉트
- **추가 파일**: `app/dashboard/sessions/page.tsx` - 기존 세션 목록 화면

#### 사이드바 Sessions 링크 변경
- **파일**: `components/layout/sidebar.tsx`
- **변경 내용**: Sessions 링크를 `/dashboard`에서 `/dashboard/sessions`로 변경
