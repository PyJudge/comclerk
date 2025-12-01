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

  test('PDF 뷰어 빈 상태 확인', async ({ page }) => {
    await page.goto('/workspace');
    await page.waitForLoadState('networkidle');

    // 1. PDF 뷰어가 빈 상태 메시지 표시
    await expect(page.getByText('PDF 뷰어')).toBeVisible();
    await expect(page.getByText('폴더를 선택하여 PDF 내용을 확인하세요')).toBeVisible();

    // 2. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-100-pdf-viewer-empty.png', fullPage: true });
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
