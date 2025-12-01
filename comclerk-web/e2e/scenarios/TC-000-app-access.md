# TC-000: 앱 기본 접속

## 사전 조건
- Next.js 개발 서버 실행 (npm run dev)
- 포트 3000 사용 가능

## 테스트 단계
1. http://localhost:3000 접속
2. 페이지 로드 확인
3. "OpenCode" 타이틀 확인

## 예상 결과
- 200 OK 응답
- 기본 레이아웃 렌더링
- 타이틀에 "OpenCode" 포함

## 검증 방법
- Playwright 스크린샷
