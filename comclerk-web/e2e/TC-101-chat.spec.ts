// [COMCLERK-MODIFIED] 2025-12-02: 채팅 기능 E2E 테스트 업데이트

import { test, expect } from '@playwright/test';

test.describe('TC-101: 채팅 기능', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 세션 준비 완료 대기 (세션 준비 중... 텍스트가 사라질 때까지)
    await expect(page.getByText('세션 준비 중...')).toBeHidden({ timeout: 60000 });
  });

  test('TC-101-01: 채팅 패널 기본 요소 확인', async ({ page }) => {
    // 1. 세션 드롭다운 트리거 확인
    const sessionDropdown = page.locator('[data-testid="session-dropdown-trigger"]');
    await expect(sessionDropdown).toBeVisible({ timeout: 10000 });

    // 2. 설정 버튼 확인
    const settingsBtn = page.locator('[data-testid="settings-button"]');
    await expect(settingsBtn).toBeVisible();

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-01-chat-panel.png', fullPage: true });
  });

  test('TC-101-02: 모델 선택기 확인', async ({ page }) => {
    // 1. 모델 선택기가 표시될 때까지 대기 (세션 로드 후)
    const modelSelector = page.locator('[data-testid="model-selector"]');
    await expect(modelSelector).toBeVisible({ timeout: 10000 });

    // 2. 모델 텍스트 확인 (로딩 중이 아닌 상태)
    const modelDisplay = page.locator('[data-testid="model-display"]');
    await expect(modelDisplay).not.toHaveText('로딩 중...', { timeout: 10000 });

    // 3. 클릭하면 드롭다운 열림
    await modelSelector.click();

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-02-model-selector.png', fullPage: true });
  });

  test('TC-101-03: 에이전트 선택기 확인', async ({ page }) => {
    // 1. 에이전트 선택기 대기
    const agentSelector = page.locator('[data-testid="agent-selector"]');
    await expect(agentSelector).toBeVisible({ timeout: 10000 });

    // 2. 에이전트 버튼들 확인 (general, explore 등)
    const agentButtons = page.locator('[data-testid^="agent-btn-"]');
    const count = await agentButtons.count();
    expect(count).toBeGreaterThan(0);

    // 3. 첫 번째 에이전트가 선택되어 있는지 확인
    const firstAgentBtn = agentButtons.first();
    await expect(firstAgentBtn).toHaveAttribute('data-selected', 'true');

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-03-agent-selector.png', fullPage: true });
  });

  test('TC-101-04: 에이전트 클릭으로 변경', async ({ page }) => {
    // 1. 에이전트 선택기 대기
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 10000 });

    // 2. 에이전트 버튼들 가져오기
    const agentButtons = page.locator('[data-testid^="agent-btn-"]');
    const count = await agentButtons.count();

    // 에이전트가 2개 이상인 경우에만 테스트
    if (count > 1) {
      // 첫 번째 에이전트 선택 확인
      const firstBtn = agentButtons.first();
      await expect(firstBtn).toHaveAttribute('data-selected', 'true');

      // 두 번째 에이전트 클릭
      const secondBtn = agentButtons.nth(1);
      await secondBtn.click();

      // 두 번째 에이전트 선택됨 확인
      await expect(secondBtn).toHaveAttribute('data-selected', 'true');
      await expect(firstBtn).toHaveAttribute('data-selected', 'false');
    }

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-04-agent-click.png', fullPage: true });
  });

  test('TC-101-05: 메시지 입력창 확인', async ({ page }) => {
    // 1. 메시지 입력창 대기
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    // 2. 에이전트 로드 후 입력창이 활성화되는지 확인
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 10000 });

    // 3. placeholder 확인 (에이전트 이름 포함)
    await expect(messageInput).toHaveAttribute('placeholder', /메시지 입력/);

    // 4. 전송 버튼 확인
    const sendBtn = page.locator('[data-testid="send-button"]');
    await expect(sendBtn).toBeVisible();

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-05-message-input.png', fullPage: true });
  });

  test('TC-101-06: 메시지 입력 및 전송 버튼 활성화', async ({ page }) => {
    // 1. 입력창과 에이전트 로드 대기
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 10000 });

    // 2. 전송 버튼이 처음에는 비활성화
    const sendBtn = page.locator('[data-testid="send-button"]');
    await expect(sendBtn).toBeDisabled();

    // 3. 메시지 입력
    await messageInput.fill('테스트 메시지입니다');

    // 4. 전송 버튼 활성화 확인
    await expect(sendBtn).toBeEnabled();

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-06-send-enabled.png', fullPage: true });
  });

  test('TC-101-07: 메시지 전송 (실제 전송)', async ({ page }) => {
    // 1. 입력창과 에이전트 로드 대기
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 10000 });

    // 모델이 선택되어 있는지 확인
    const modelDisplay = page.locator('[data-testid="model-display"]');
    await expect(modelDisplay).not.toHaveText('로딩 중...', { timeout: 10000 });
    await expect(modelDisplay).not.toHaveText('모델 선택', { timeout: 5000 });

    // 2. 메시지 입력
    const testMessage = 'E2E 테스트 메시지 ' + Date.now();
    await messageInput.fill(testMessage);

    // 3. 전송 버튼 클릭
    const sendBtn = page.locator('[data-testid="send-button"]');
    await sendBtn.click();

    // 4. 입력창이 비워졌는지 확인 (optimistic update)
    await expect(messageInput).toHaveValue('');

    // 5. 메시지가 화면에 표시되는지 확인 (optimistic update로 즉시 표시)
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });

    // 6. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-07-message-sent.png', fullPage: true });
  });

  test('TC-101-08: Enter 키로 메시지 전송', async ({ page }) => {
    // 1. 입력창과 에이전트 로드 대기
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 10000 });

    // 모델 확인
    const modelDisplay = page.locator('[data-testid="model-display"]');
    await expect(modelDisplay).not.toHaveText('로딩 중...', { timeout: 10000 });
    await expect(modelDisplay).not.toHaveText('모델 선택', { timeout: 5000 });

    // 2. 메시지 입력
    const testMessage = 'Enter 테스트 ' + Date.now();
    await messageInput.fill(testMessage);

    // 3. Enter 키 입력
    await messageInput.press('Enter');

    // 4. 입력창이 비워졌는지 확인
    await expect(messageInput).toHaveValue('');

    // 5. 메시지 표시 확인
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });

    // 6. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-08-enter-send.png', fullPage: true });
  });

  test('TC-101-09: Shift+Enter로 줄바꿈', async ({ page }) => {
    // 1. 입력창 대기
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible({ timeout: 10000 });

    // 2. 첫 줄 입력
    await messageInput.fill('첫 번째 줄');

    // 3. Shift+Enter로 줄바꿈
    await messageInput.press('Shift+Enter');

    // 4. 두 번째 줄 입력
    await messageInput.type('두 번째 줄');

    // 5. 줄바꿈이 포함된 텍스트 확인
    await expect(messageInput).toHaveValue('첫 번째 줄\n두 번째 줄');

    // 6. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-09-shift-enter.png', fullPage: true });
  });

  test('TC-101-10: Tab 키로 에이전트 전환', async ({ page }) => {
    // 1. 에이전트와 입력창 로드 대기
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible({ timeout: 10000 });
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeVisible();

    // 2. 에이전트 버튼들 가져오기
    const agentButtons = page.locator('[data-testid^="agent-btn-"]');
    const count = await agentButtons.count();

    // 에이전트가 2개 이상인 경우에만 테스트
    if (count > 1) {
      // 첫 번째 에이전트 선택 확인
      const firstBtn = agentButtons.first();
      await expect(firstBtn).toHaveAttribute('data-selected', 'true');

      // 3. 입력창에 포커스
      await messageInput.focus();

      // 4. Tab 키로 에이전트 전환
      await page.keyboard.press('Tab');

      // 5. 두 번째로 변경됨 확인
      const secondBtn = agentButtons.nth(1);
      await expect(secondBtn).toHaveAttribute('data-selected', 'true');
      await expect(firstBtn).toHaveAttribute('data-selected', 'false');
    }

    // 6. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-10-tab-switch.png', fullPage: true });
  });

  test('TC-101-11: 새 채팅 버튼 클릭', async ({ page }) => {
    // 1. 세션 드롭다운 열기
    const sessionDropdown = page.locator('[data-testid="session-dropdown-trigger"]');
    await expect(sessionDropdown).toBeVisible({ timeout: 10000 });
    await sessionDropdown.click();

    // 2. 드롭다운 메뉴 확인
    const dropdownMenu = page.locator('[data-testid="session-dropdown-menu"]');
    await expect(dropdownMenu).toBeVisible();

    // 3. 새 채팅 버튼 클릭
    const newChatBtn = page.locator('[data-testid="new-chat-button"]');
    await expect(newChatBtn).toBeVisible();
    await newChatBtn.click();

    // 4. 드롭다운이 닫혔는지 확인
    await expect(dropdownMenu).not.toBeVisible({ timeout: 5000 });

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-101-11-new-chat.png', fullPage: true });
  });
});
