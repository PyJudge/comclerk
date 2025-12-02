# TC-102: Agent 설정 기능 E2E 테스트

## 개요
Agent 설정 페이지에서 Custom Agent를 생성, 수정, 삭제하고 Built-in Agent를 확인하는 기능 테스트

## 테스트 환경
- Frontend: http://localhost:3001
- Backend: http://localhost:4096
- Agent 파일 경로: pdfs/.opencode/agent/*.md
- 설정 파일: pdfs/opencode.json

## 사전 조건
- Backend 서버가 실행 중
- Frontend 서버가 실행 중
- pdfs/.opencode/agent/ 디렉토리가 존재

---

## TC-102-01: Agent 설정 페이지 접근
**목적**: /agents 페이지에 정상 접근되는지 확인

**단계**:
1. /agents 페이지로 이동
2. 페이지 로드 대기

**예상 결과**:
- "Agent Settings" 헤더가 표시됨
- "Back to Workspace" 링크가 표시됨
- "Create New Agent" 버튼이 표시됨

---

## TC-102-02: Built-in Agent 목록 확인
**목적**: Built-in Agent들이 올바르게 표시되는지 확인

**단계**:
1. /agents 페이지 로드
2. Built-in Agents 섹션 확인

**예상 결과**:
- "Built-in Agents" 헤더가 표시됨
- general, explore, build, plan 중 일부가 목록에 표시됨 (서버에 따라 다름)

---

## TC-102-03: Built-in Agent 선택 및 읽기 전용 확인
**목적**: Built-in Agent를 선택했을 때 수정할 수 없음을 확인

**단계**:
1. Built-in Agent 클릭 (예: general)
2. 편집기 확인

**예상 결과**:
- Agent 이름이 편집기 헤더에 표시됨
- "(Built-in)" 레이블이 표시됨
- "Built-in agents cannot be modified" 메시지 표시
- 모든 입력 필드가 비활성화됨 (disabled)
- Save 버튼이 표시되지 않음

---

## TC-102-04: 새 Agent 생성 폼 표시
**목적**: Create New Agent 버튼 클릭 시 빈 폼이 표시되는지 확인

**단계**:
1. "Create New Agent" 버튼 클릭

**예상 결과**:
- "Create New Agent" 헤더가 표시됨
- Name 입력 필드가 활성화되고 비어있음
- Description 입력 필드가 비어있음
- Mode 선택기가 표시됨 (Primary, Subagent, All)
- System Prompt 텍스트영역이 표시됨
- Color 선택기가 표시됨
- "Create Agent" 버튼이 표시됨

---

## TC-102-05: Agent 생성 - 필수 필드 검증
**목적**: Agent 이름 없이 생성 시도 시 에러 표시

**단계**:
1. Create New Agent 클릭
2. Name 입력 없이 Create Agent 버튼 클릭

**예상 결과**:
- "Agent name is required" 에러 토스트 표시
- Agent가 생성되지 않음

---

## TC-102-06: Agent 생성 - 성공
**목적**: 새로운 Custom Agent를 생성

**단계**:
1. Create New Agent 클릭
2. Name: "test-agent-e2e" 입력
3. Description: "E2E 테스트용 에이전트" 입력
4. Mode: "Primary" 선택
5. System Prompt: "This is a test agent for E2E testing." 입력
6. Create Agent 버튼 클릭

**예상 결과**:
- "Agent created" 토스트 표시
- 왼쪽 목록의 "Custom Agents" 섹션에 새 agent 표시
- 파일 시스템에 pdfs/.opencode/agent/test-agent-e2e.md 생성됨
- pdfs/opencode.json에 agent.custom.test-agent-e2e 추가됨

---

## TC-102-07: Custom Agent 선택 및 편집
**목적**: 생성한 Custom Agent를 수정

**단계**:
1. Custom Agents에서 "test-agent-e2e" 클릭
2. Description 변경: "수정된 설명"
3. Save Changes 버튼 클릭

**예상 결과**:
- "Agent updated" 토스트 표시
- 변경된 description이 .md 파일에 반영됨

---

## TC-102-08: Advanced Settings 토글
**목적**: Advanced Settings 섹션의 토글 기능 확인

**단계**:
1. Custom Agent 선택
2. "Advanced Settings" 클릭하여 열기
3. Temperature 슬라이더 확인
4. Top P 슬라이더 확인
5. Model Override 입력 필드 확인

**예상 결과**:
- Advanced Settings가 확장됨
- 모든 고급 설정 필드가 표시됨
- 다시 클릭 시 접힘

---

## TC-102-09: Agent 삭제
**목적**: Custom Agent 삭제 기능 확인

**단계**:
1. "test-agent-e2e" Agent 선택
2. 삭제 버튼 (휴지통 아이콘) 클릭
3. 확인 대화상자에서 확인

**예상 결과**:
- "Agent deleted" 토스트 표시
- 목록에서 agent 제거됨
- pdfs/.opencode/agent/test-agent-e2e.md 파일 삭제됨
- pdfs/opencode.json에서 agent.custom.test-agent-e2e 제거됨

---

## TC-102-10: 취소 버튼 동작
**목적**: Cancel 버튼 클릭 시 선택 해제

**단계**:
1. Create New Agent 클릭
2. Cancel 버튼 클릭

**예상 결과**:
- 편집기가 닫히고 "Select an agent to edit" 메시지 표시

---

## TC-102-11: API 직접 테스트 - GET /api/agent
**목적**: Custom agent 목록 API 동작 확인

**단계**:
1. curl -s http://localhost:3001/api/agent

**예상 결과**:
- JSON 배열 반환
- 각 agent 객체에 name, description 등 필드 포함

---

## TC-102-12: API 직접 테스트 - POST /api/agent
**목적**: Agent 생성 API 동작 확인

**단계**:
1. curl -X POST http://localhost:3001/api/agent \
   -H "Content-Type: application/json" \
   -d '{"name":"api-test","description":"API test"}'

**예상 결과**:
- 성공 응답 반환
- pdfs/.opencode/agent/api-test.md 생성됨

---

## TC-102-13: Sidebar Agent 설정 버튼
**목적**: Sidebar에서 Agent Settings 버튼 확인

**단계**:
1. /workspace 페이지 이동
2. Sidebar의 Agent Settings 버튼 클릭

**예상 결과**:
- /agents 페이지로 네비게이션됨

---

## TC-102-14: 파일 시스템 검증
**목적**: Agent CRUD 시 파일 시스템 상태 검증

**검증 항목**:
- pdfs/.opencode/agent/*.md 파일 존재
- YAML frontmatter 형식 확인
- opencode.json의 agent.custom 섹션 동기화

---

## 정리 (Cleanup)
테스트 후 다음 파일들이 남아있으면 삭제:
- pdfs/.opencode/agent/test-agent-e2e.md
- pdfs/.opencode/agent/api-test.md
- pdfs/opencode.json에서 해당 agent 엔트리
