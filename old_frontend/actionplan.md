# ComClerk (컴퓨터 법률 서기) 액션 플랜 - UPDATED

## 🎯 프로젝트 목표
법적 절차 문서(dockets)를 클라이언트에서 직접 처리할 수 있는 웹앱 개발
- 폴더 단위 PDF 파일 선택 및 뷰어
- PDF 문서와 대화 기능
- 완전한 클라이언트 기반 처리 (서버 업로드 없음)

## 🏗️ 아키텍처 설계

### UI 레이아웃 (3단 구조)
```
┌─────────────┬──────────────────┬─────────────────┐
│             │                  │                 │
│  PDF 목록   │   PDF 뷰어       │   채팅 패널     │
│  사이드바   │   (중앙)         │   (오른쪽)      │
│             │                  │                 │
└─────────────┴──────────────────┴─────────────────┘
```

### 기술 스택
- **프레임워크**: Next.js 15.5.3 (App Router + Turbopack)
- **UI**: shadcn/ui + Tailwind CSS v4
- **PDF 처리**: PDF.js (클라이언트 렌더링)
- **데이터 저장**: 브라우저 메모리 (ArrayBuffer)
- **파일 선택**: Directory API (webkitdirectory)
- **채팅**: 메모리 기반 (세션 단위)
- **스트리밍**: Server-Sent Events

## 📁 프로젝트 구조

```
comclerk/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 메인 페이지 (3단 레이아웃)
│   │   ├── api/                # API 라우트 (최소화)
│   │   │   └── stream/         # LLM 스트리밍
│   │   │       └── route.ts
│   │   ├── test-upload/        # 테스트 페이지
│   │   │   └── page.tsx
│   │   └── globals.css         # 글로벌 스타일
│   ├── components/             # 컴포넌트들
│   │   ├── ui/                 # shadcn 기본 컴포넌트
│   │   ├── FileUpload.tsx      # 폴더 선택 컴포넌트
│   │   ├── PDFViewer.tsx       # PDF.js 뷰어 (ArrayBuffer 지원)
│   │   └── ChatPanel.tsx       # 오른쪽 채팅 패널
│   ├── lib/                    # 유틸리티
│   │   └── utils.ts
│   └── types/                  # TypeScript 타입
│       └── chat.ts
├── public/                     # 정적 파일
│   ├── pdf.worker.min.js      # PDF.js worker
│   └── pdf.worker.min.mjs     # PDF.js worker (ESM)
├── components.json            # shadcn/ui 설정
├── next.config.js
├── package.json
└── tailwind.config.js
```

## 🔧 핵심 기능 설계

### 1. 클라이언트 기반 PDF 관리
```typescript
// 폴더 선택으로 PDF 파일들을 ArrayBuffer로 로드
// File API와 Directory API 활용
// webkitRelativePath로 폴더 구조 파악

interface PDFFileData {
  name: string;
  size: number;
  data: ArrayBuffer;  // 클라이언트 메모리에 저장
  path: string;
}
```

### 2. 폴더 선택 및 PDF 필터링
```typescript
// 선택된 폴더의 직계 PDF 파일만 필터링 (재귀 없음)
const folderFiles = Array.from(files).filter(file => {
  const pathParts = file.webkitRelativePath.split('/');
  return pathParts.length === 2 && // 폴더/파일.pdf 구조만
         file.type === "application/pdf";
});
```

### 3. ArrayBuffer 기반 PDF 렌더링
```typescript
// PDF.js가 ArrayBuffer를 직접 받아서 렌더링
const loadingTask = pdfjsLib.getDocument(arrayBuffer);
const pdfDocument = await loadingTask.promise;
```

## 📋 구현 상태

### ✅ Phase 1: 기본 설정 (완료)
- ✅ Next.js 15.5.3 프로젝트 초기화
- ✅ shadcn/ui 설정 및 기본 컴포넌트 설치
- ✅ 3단 레이아웃 구현
- ✅ 기본 라우팅 설정

### ✅ Phase 2: PDF 기능 (완료)
- ✅ 폴더 선택 UI 구현 (webkitdirectory)
- ✅ PDF 파일 필터링 로직
- ✅ ArrayBuffer 기반 파일 처리
- ✅ PDF.js 뷰어 ArrayBuffer 지원
- ✅ 진행률 표시 기능

### ✅ Phase 3: 통합 (완료)
- ✅ 로컬 상태 관리로 전환
- ✅ 서버 의존성 제거
- ✅ 메인 페이지 통합
- ✅ 파일 선택 → PDF 표시 플로우

### 🔄 Phase 4: 채팅 시스템 (진행 중)
- ✅ 오른쪽 채팅 패널 UI
- ✅ 메시지 입력/표시 컴포넌트
- ✅ 메모리 기반 채팅 상태 관리
- ✅ LLM 스트리밍 모의 구현
- 🔄 실제 LLM 통합 준비

## 🚀 핵심 개선사항

### 서버 의존성 제거
- **Before**: 파일을 서버에 업로드 → 서버에서 읽기
- **After**: 클라이언트에서 직접 처리 → 즉시 표시

### 성능 최적화
- **속도**: 네트워크 업로드 시간 제거
- **프라이버시**: 파일이 서버에 저장되지 않음
- **효율성**: 폴더 단위 일괄 처리

### 사용성 개선
- **간편함**: 폴더 하나 선택으로 모든 PDF 처리
- **직관적**: 드래그&드롭 지원
- **실시간**: 선택 즉시 PDF 표시

## 🧪 테스트 필요 항목

### 기능 테스트
- [ ] 큰 폴더 (100+ PDF) 선택 시 성능
- [ ] 대용량 PDF (50MB+) 처리
- [ ] 여러 폴더 연속 선택
- [ ] 브라우저 메모리 사용량 모니터링

### 호환성 테스트
- [ ] Chrome/Edge (webkitdirectory 지원)
- [ ] Firefox (webkitdirectory 지원)
- [ ] Safari (webkitdirectory 지원)
- [ ] 모바일 브라우저 (제한적)

### 엣지 케이스
- [ ] 빈 폴더 선택
- [ ] PDF가 없는 폴더
- [ ] 손상된 PDF 파일
- [ ] 암호화된 PDF 파일

## 📅 완료 현황
- **Phase 1-3**: ✅ 완료
- **클라이언트 전환**: ✅ 완료
- **폴더 선택 기능**: ✅ 완료
- **ArrayBuffer 처리**: ✅ 완료
- **LLM 통합**: 🔄 준비 중

## 🐛 알려진 이슈 및 개선사항

### 현재 이슈
1. **메모리 관리**: 많은 PDF 로드 시 브라우저 메모리 증가
2. **세션 지속성**: 페이지 새로고침 시 파일 목록 초기화
3. **폴더 구조**: 재귀적 하위 폴더 미지원 (의도적)

### 개선 필요사항
1. **지연 로딩**: 선택된 PDF만 ArrayBuffer 로드
2. **IndexedDB**: 선택적 로컬 캐싱
3. **가상 스크롤**: 긴 파일 목록 최적화
4. **PDF 텍스트 추출**: OCR 또는 텍스트 레이어 활용