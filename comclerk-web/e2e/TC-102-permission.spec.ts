// [COMCLERK-ADDED] 2025-12-05: Permission 시스템 E2E 테스트

import { test, expect } from '@playwright/test';

test.describe('TC-102: Permission 시스템', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('domcontentloaded');

    // 에이전트와 모델 로드 대기 (세션이 준비됨을 의미)
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 60000 });
    const modelDisplay = page.locator('[data-testid="model-display"]');
    await expect(modelDisplay).not.toHaveText('로딩 중...', { timeout: 30000 });
  });

  test('TC-102-01: Write tool 호출 시 permission UI 표시', async ({ page }) => {
    // 1. 메시지 입력 (파일 쓰기 요청)
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('test-102-01.txt 파일에 "hello e2e" 내용을 써줘');
    await messageInput.press('Enter');

    // 2. Permission UI 표시 확인 (최대 60초 대기 - LLM 응답 시간 고려)
    const permissionUI = page.locator('[data-testid="permission-inline"]');
    await expect(permissionUI).toBeVisible({ timeout: 60000 });

    // 3. 버튼들 확인
    await expect(page.locator('[data-testid="permission-btn-once"]')).toBeVisible();
    await expect(page.locator('[data-testid="permission-btn-always"]')).toBeVisible();
    await expect(page.locator('[data-testid="permission-btn-reject"]')).toBeVisible();

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-102-01-permission-ui.png', fullPage: true });
  });

  test('TC-102-02: Permission "한 번만" 응답', async ({ page }) => {
    // 1. Write 요청
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('test-102-02.txt 파일에 "once test" 내용을 써줘');
    await messageInput.press('Enter');

    // 2. Permission UI 대기
    const permissionUI = page.locator('[data-testid="permission-inline"]');
    await expect(permissionUI).toBeVisible({ timeout: 60000 });

    // 3. "한 번만" 클릭
    await page.locator('[data-testid="permission-btn-once"]').click();

    // 4. Permission UI 사라짐 확인
    await expect(permissionUI).toBeHidden({ timeout: 10000 });

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-102-02-permission-once.png', fullPage: true });
  });

  test('TC-102-03: 키보드 단축키 테스트 (1=once)', async ({ page }) => {
    // 1. Write 요청
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('test-102-03.txt 파일에 "keyboard test" 내용을 써줘');
    await messageInput.press('Enter');

    // 2. Permission UI 대기
    const permissionUI = page.locator('[data-testid="permission-inline"]');
    await expect(permissionUI).toBeVisible({ timeout: 60000 });

    // 3. 키보드 단축키 "1" 입력 (한 번만)
    await page.keyboard.press('1');

    // 4. Permission UI 사라짐 확인
    await expect(permissionUI).toBeHidden({ timeout: 10000 });

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-102-03-keyboard-shortcut.png', fullPage: true });
  });

  test('TC-102-04: 세션 간 Permission 격리 확인', async ({ page }) => {
    // 1. 첫 번째 세션에서 "항상 허용"
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('session1-test.txt 파일에 "session1" 내용을 써줘');
    await messageInput.press('Enter');

    const permissionUI = page.locator('[data-testid="permission-inline"]');
    await expect(permissionUI).toBeVisible({ timeout: 60000 });
    await page.locator('[data-testid="permission-btn-always"]').click();
    await expect(permissionUI).toBeHidden({ timeout: 10000 });

    // 2. 같은 세션에서 다시 Write 요청 - 이번에는 자동 승인되어야 함
    await messageInput.fill('session1-test2.txt 파일에 "auto approved" 내용을 써줘');
    await messageInput.press('Enter');

    // 3. 새 세션 생성
    const sessionDropdown = page.locator('[data-testid="session-dropdown-trigger"]');
    await sessionDropdown.click();
    await page.locator('[data-testid="new-chat-button"]').click();

    // 4. 새 세션 준비 대기 (에이전트 셀렉터가 표시될 때까지)
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 60000 });

    // 5. 두 번째 세션에서 같은 종류의 Write 요청
    await messageInput.fill('session2-test.txt 파일에 "session2" 내용을 써줘');
    await messageInput.press('Enter');

    // 6. 두 번째 세션에서도 Permission UI가 표시되어야 함 (세션 격리)
    await expect(permissionUI).toBeVisible({ timeout: 60000 });

    // 7. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-102-04-session-isolation.png', fullPage: true });
  });

  test('TC-102-05: 세션 전환 시 이전 Permission 초기화', async ({ page }) => {
    // 1. 첫 번째 세션에서 Permission 요청 발생시키기
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('pending-test.txt 파일에 "pending" 내용을 써줘');
    await messageInput.press('Enter');

    const permissionUI = page.locator('[data-testid="permission-inline"]');
    await expect(permissionUI).toBeVisible({ timeout: 60000 });

    // 2. Permission에 응답하지 않고 새 세션으로 전환
    const sessionDropdown = page.locator('[data-testid="session-dropdown-trigger"]');
    await sessionDropdown.click();
    await page.locator('[data-testid="new-chat-button"]').click();

    // 새 세션 준비 대기
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 60000 });

    // 3. 새 세션에서는 이전 Permission UI가 보이지 않아야 함
    await expect(permissionUI).toBeHidden({ timeout: 10000 });

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-102-05-session-switch.png', fullPage: true });
  });

  test('TC-102-06: Permission "거부" 응답', async ({ page }) => {
    // 1. Write 요청
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('reject-test.txt 파일에 "will be rejected" 내용을 써줘');
    await messageInput.press('Enter');

    // 2. Permission UI 대기
    const permissionUI = page.locator('[data-testid="permission-inline"]');
    await expect(permissionUI).toBeVisible({ timeout: 60000 });

    // 3. "거부" 클릭
    await page.locator('[data-testid="permission-btn-reject"]').click();

    // 4. Permission UI 사라짐 확인
    await expect(permissionUI).toBeHidden({ timeout: 10000 });

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-102-06-permission-reject.png', fullPage: true });
  });
});
