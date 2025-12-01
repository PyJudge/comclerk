import { test, expect } from '@playwright/test';

test.describe('TC-001: 대시보드 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('대시보드 기본 요소 확인', async ({ page }) => {
    // 1. "All Sessions" 제목 확인
    await expect(page.getByRole('heading', { name: /All Sessions/i })).toBeVisible();

    // 2. Settings 버튼 확인
    await expect(page.getByText('Settings')).toBeVisible();

    // 3. New Session 버튼 확인
    await expect(page.getByText('New Session', { exact: true })).toBeVisible();

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-001-dashboard-main.png', fullPage: true });
  });

  test('세션 카드 클릭하여 세션 열기', async ({ page }) => {
    // 1. 첫 번째 세션 카드 찾기
    const sessionCards = page.locator('[class*="rounded-lg"][class*="border"]').filter({ hasText: /.+/ });
    const cardCount = await sessionCards.count();

    if (cardCount > 0) {
      // 2. 첫 번째 세션 카드 클릭
      await sessionCards.first().click();

      // 3. URL이 변경되었는지 확인 (세션 ID 포함)
      await page.waitForURL(/\/session\//);

      // 4. 스크린샷 저장
      await page.screenshot({ path: 'e2e/screenshots/TC-001-session-opened.png', fullPage: true });
    } else {
      // 세션이 없으면 스크린샷만 저장
      await page.screenshot({ path: 'e2e/screenshots/TC-001-no-sessions.png', fullPage: true });
    }
  });

  test('Settings 버튼 클릭하여 설정 페이지 이동', async ({ page }) => {
    // 1. Settings 버튼 클릭
    await page.getByText('Settings').click();

    // 2. 설정 페이지가 나타나는지 확인
    await page.waitForURL(/\/settings/);

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-001-settings-clicked.png', fullPage: true });
  });
});
