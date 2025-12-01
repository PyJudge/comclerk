// [COMCLERK-ADDED] 2024-12-01: 워크스페이스 페이지 테스트

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

  test('PDF 자동 로드 및 표시 확인', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 1. PDF 목록에 파일이 표시되는지 확인
    await expect(page.getByRole('heading', { name: 'PDF 목록' })).toBeVisible();

    // 2. PDF 캔버스가 로드되었는지 확인 (페이지 수 표시)
    await expect(page.locator('[data-testid="page-input"]')).toBeVisible();

    // 3. 페이지 표시가 0이 아닌지 확인 (PDF 로드됨)
    const pageIndicator = page.locator('[data-testid="page-indicator"]');
    await expect(pageIndicator).toBeVisible();
    await expect(pageIndicator).not.toHaveText('/ 0');

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-pdf-loaded.png', fullPage: true });
  });

  test('PDF 페이지 버튼 네비게이션', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // PDF 로드 대기
    await expect(page.locator('[data-testid="page-indicator"]')).not.toHaveText('/ 0');

    // 1. 현재 페이지 확인
    const pageInput = page.locator('[data-testid="page-input"]');
    await expect(pageInput).toHaveValue('1');

    // 2. 다음 페이지 버튼 클릭
    await page.locator('[data-testid="next-page"]').click();
    await expect(pageInput).toHaveValue('2');

    // 3. 이전 페이지 버튼 클릭
    await page.locator('[data-testid="prev-page"]').click();
    await expect(pageInput).toHaveValue('1');

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-page-navigation.png', fullPage: true });
  });

  test('PDF 페이지 키보드 네비게이션', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // PDF 로드 대기
    await expect(page.locator('[data-testid="page-indicator"]')).not.toHaveText('/ 0');

    const pageInput = page.locator('[data-testid="page-input"]');
    await expect(pageInput).toHaveValue('1');

    // 1. PageDown으로 다음 페이지
    await page.keyboard.press('PageDown');
    await expect(pageInput).toHaveValue('2');

    // 2. PageUp으로 이전 페이지
    await page.keyboard.press('PageUp');
    await expect(pageInput).toHaveValue('1');

    // 3. ArrowDown으로 다음 페이지
    await page.keyboard.press('ArrowDown');
    await expect(pageInput).toHaveValue('2');

    // 4. ArrowUp으로 이전 페이지
    await page.keyboard.press('ArrowUp');
    await expect(pageInput).toHaveValue('1');

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-keyboard-navigation.png', fullPage: true });
  });

  test('PDF 확대/축소 비율 고정 확인', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // PDF 툴바가 나타날 때까지 대기 (로드 완료)
    await expect(page.locator('[data-testid="page-input"]')).toBeVisible({ timeout: 10000 });

    // PDF 페이지 로드 대기
    await expect(page.locator('[data-testid="page-indicator"]')).not.toHaveText('/ 0', { timeout: 10000 });

    // 1. 기본 확대 비율 100% 확인
    await expect(page.getByText('100%')).toBeVisible();

    // 2. 페이지 변경해도 비율 유지
    await page.keyboard.press('PageDown');
    await expect(page.getByText('100%')).toBeVisible();

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-zoom-fixed.png', fullPage: true });
  });

  test('채팅 패널 확인', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 1. 채팅 헤더 확인
    await expect(page.getByRole('heading', { name: '채팅' })).toBeVisible();

    // 2. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-chat-panel.png', fullPage: true });
  });
});
