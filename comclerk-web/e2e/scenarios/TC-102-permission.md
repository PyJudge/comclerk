# TC-102: Permission 시스템 테스트

## 개요
Write/Edit tool 호출 시 permission 승인 UI가 올바르게 동작하는지 확인합니다.

## 전제조건
- Backend 서버 실행 중
- Frontend 서버 실행 중
- 세션 생성 가능

## 테스트 케이스

### TC-102-01: Write tool 호출 시 permission UI 표시
**목적**: Write tool 호출 시 permission 승인 UI가 표시되는지 확인

**단계**:
1. 메시지 입력창에 파일 쓰기 요청 입력
2. Enter로 전송
3. Permission UI 표시 확인
4. 버튼들(한 번만, 항상 허용, 거부) 확인

**예상 결과**: Permission UI가 표시되고 3개의 버튼이 보임

---

### TC-102-02: Permission "한 번만" 응답
**목적**: "한 번만" 버튼 클릭 시 정상 동작 확인

**단계**:
1. Write 요청 전송
2. Permission UI 대기
3. "한 번만" 클릭
4. Permission UI 사라짐 확인
5. Tool 실행 완료 확인

**예상 결과**: Permission UI가 사라지고 파일이 정상적으로 생성됨

---

### TC-102-03: 키보드 단축키 테스트
**목적**: 키보드 단축키(1/2/3)로 permission 응답 가능 확인

**단계**:
1. Write 요청 전송
2. Permission UI 대기
3. 키보드 "1" 입력 (한 번만)
4. Permission UI 사라짐 확인

**예상 결과**: 키보드 단축키로도 permission 응답 가능

| 키 | 동작 |
|----|------|
| 1 | 한 번만 (once) |
| 2 | 항상 (always) |
| 3 | 거부 (reject) |

---

### TC-102-04: 세션 간 Permission 격리 확인
**목적**: 한 세션의 "항상 허용"이 다른 세션에 영향을 미치지 않는지 확인

**단계**:
1. 첫 번째 세션에서 Write 요청
2. Permission UI에서 "항상 허용" 클릭
3. 같은 세션에서 다시 Write 요청 (자동 승인 확인)
4. 새 세션 생성
5. 두 번째 세션에서 같은 종류의 Write 요청
6. 두 번째 세션에서도 Permission UI 표시 확인 (격리 확인)

**예상 결과**: 세션 1의 "항상 허용"이 세션 2에 적용되지 않음

---

### TC-102-05: 세션 전환 시 이전 Permission 초기화
**목적**: 세션 전환 시 이전 세션의 pending permission이 새 세션에 표시되지 않는지 확인

**단계**:
1. 첫 번째 세션에서 Permission 요청 발생
2. 응답하지 않고 새 세션으로 전환
3. 새 세션에서 이전 Permission UI가 보이지 않는지 확인

**예상 결과**: 새 세션에서는 이전 세션의 Permission UI가 표시되지 않음

---

### TC-102-06: Permission "거부" 응답
**목적**: "거부" 버튼 클릭 시 정상 동작 확인

**단계**:
1. Write 요청 전송
2. Permission UI 대기
3. "거부" 클릭
4. Permission UI 사라짐 확인
5. 에러 메시지 또는 거부 표시 확인

**예상 결과**: Permission이 거부되고 tool이 실행되지 않음

---

## 버그 수정 내역 (2025-12-05)

### 수정된 문제
1. **`setCurrentPermission(null)` 미정의**: 정의되지 않은 함수 호출로 인한 에러
2. **SSE 이벤트 미활용**: permission.updated 이벤트가 즉시 UI에 반영되지 않음
3. **세션 격리 문제**: 세션 전환 시 이전 세션의 permission 상태가 남아있음
4. **sessionId 검증 누락**: 다른 세션의 permission에 응답할 수 있는 버그

### 수정 파일
- `comclerk-web/components/chat/chat-container.tsx`
- `comclerk-web/components/permission/permission-inline.tsx` (data-testid 추가)
