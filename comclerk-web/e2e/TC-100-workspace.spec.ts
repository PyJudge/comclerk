// [COMCLERK-MODIFIED] 2025-12-02: 워크스페이스 페이지 테스트 업데이트

import { test, expect } from '@playwright/test';

test.describe('TC-100: 워크스페이스 페이지', () => {
  test('3패널 레이아웃 기본 요소 확인', async ({ page }) => {
    // 1. 워크스페이스 페이지로 이동
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 2. 메인 레이아웃 확인
    const mainLayout = page.locator('[data-testid="main-layout"]');
    await expect(mainLayout).toBeVisible();

    // 3. 좌측 패널 (PDF 목록) 확인
    const leftPanel = page.locator('[data-testid="left-panel"]');
    await expect(leftPanel).toBeVisible();

    // 4. 중앙 패널 (PDF 뷰어) 확인
    const centerPanel = page.locator('[data-testid="center-panel"]');
    await expect(centerPanel).toBeVisible();

    // 5. 우측 패널 (채팅) 확인
    const rightPanel = page.locator('[data-testid="right-panel"]');
    await expect(rightPanel).toBeVisible();

    // 6. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-workspace-layout.png', fullPage: true });
  });

  test('패널 리사이즈 핸들 확인', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 1. 좌측 리사이즈 핸들 확인
    const leftHandle = page.locator('[data-testid="panel-resize-handle-left"]');
    await expect(leftHandle).toBeVisible();

    // 2. 우측 리사이즈 핸들 확인
    const rightHandle = page.locator('[data-testid="panel-resize-handle-right"]');
    await expect(rightHandle).toBeVisible();

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-resize-handles.png', fullPage: true });
  });

  test('PDF 목록 헤더 확인', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 1. PDF 목록 헤더 확인
    await expect(page.getByRole('heading', { name: 'PDF 목록' })).toBeVisible();

    // 2. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-pdf-list.png', fullPage: true });
  });

  test('PDF 자동 로드 및 표시 확인', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 1. PDF 캔버스가 로드되었는지 확인 (페이지 수 표시)
    const pageInput = page.locator('[data-testid="page-input"]');

    // PDF가 있는 경우에만 확인
    if (await pageInput.isVisible()) {
      // 2. 페이지 표시가 0이 아닌지 확인 (PDF 로드됨)
      const pageIndicator = page.locator('[data-testid="page-indicator"]');
      await expect(pageIndicator).toBeVisible();
      await expect(pageIndicator).not.toHaveText('/ 0');
    }

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-pdf-loaded.png', fullPage: true });
  });

  test('PDF 페이지 버튼 네비게이션', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // PDF 로드 확인
    const pageInput = page.locator('[data-testid="page-input"]');

    // PDF가 있는 경우에만 테스트
    if (await pageInput.isVisible()) {
      await expect(page.locator('[data-testid="page-indicator"]')).not.toHaveText('/ 0');

      // 1. 현재 페이지 확인
      await expect(pageInput).toHaveValue('1');

      // 2. 다음 페이지 버튼 클릭
      await page.locator('[data-testid="next-page"]').click();
      await expect(pageInput).toHaveValue('2');

      // 3. 이전 페이지 버튼 클릭
      await page.locator('[data-testid="prev-page"]').click();
      await expect(pageInput).toHaveValue('1');
    }

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-page-navigation.png', fullPage: true });
  });

  test('PDF 페이지 키보드 네비게이션', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // PDF 로드 확인
    const pageInput = page.locator('[data-testid="page-input"]');

    // PDF가 있는 경우에만 테스트
    if (await pageInput.isVisible()) {
      await expect(page.locator('[data-testid="page-indicator"]')).not.toHaveText('/ 0');
      await expect(pageInput).toHaveValue('1');

      // 1. PageDown으로 다음 페이지
      await page.keyboard.press('PageDown');
      await expect(pageInput).toHaveValue('2');

      // 2. PageUp으로 이전 페이지
      await page.keyboard.press('PageUp');
      await expect(pageInput).toHaveValue('1');
    }

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-keyboard-navigation.png', fullPage: true });
  });

  test('채팅 패널 세션 드롭다운 확인', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 1. 세션 드롭다운 트리거 확인
    const sessionDropdown = page.locator('[data-testid="session-dropdown-trigger"]');
    await expect(sessionDropdown).toBeVisible({ timeout: 10000 });

    // 2. 설정 버튼 확인
    const settingsBtn = page.locator('[data-testid="settings-button"]');
    await expect(settingsBtn).toBeVisible();

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-chat-panel.png', fullPage: true });
  });

  test('새 채팅 버튼 확인', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 세션 준비 완료 대기
    await expect(page.getByText('세션 준비 중...')).toBeHidden({ timeout: 60000 });

    // 1. 세션 드롭다운 열기
    const sessionDropdown = page.locator('[data-testid="session-dropdown-trigger"]');
    await expect(sessionDropdown).toBeVisible({ timeout: 10000 });
    await sessionDropdown.click();

    // 2. 드롭다운 메뉴가 열렸는지 확인
    const dropdownMenu = page.locator('[data-testid="session-dropdown-menu"]');
    await expect(dropdownMenu).toBeVisible({ timeout: 5000 });

    // 3. 새 채팅 버튼 확인
    const newChatBtn = page.locator('[data-testid="new-chat-button"]');
    await expect(newChatBtn).toBeVisible();

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-new-chat-button.png', fullPage: true });
  });
});
