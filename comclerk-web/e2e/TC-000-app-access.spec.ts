import { test, expect } from '@playwright/test';

test.describe('TC-000: 앱 기본 접속', () => {
  test('메인 페이지 로드 및 컴연권 타이틀 확인', async ({ page, baseURL }) => {
    // 1. Navigate to the app
    await page.goto('/');

    // 2. Verify page redirects to workspace
    await expect(page).toHaveURL(baseURL + '/workspace');

    // 3. Verify title contains "컴연권"
    await expect(page).toHaveTitle(/컴연권/);

    // 4. Take screenshot for verification
    await page.screenshot({ path: 'e2e/screenshots/TC-000-app-access.png', fullPage: true });
  });
});
