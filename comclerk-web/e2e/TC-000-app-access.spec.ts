import { test, expect } from '@playwright/test';

test.describe('TC-000: 앱 기본 접속', () => {
  test('should load the main page with OpenCode title', async ({ page, baseURL }) => {
    // 1. Navigate to the app
    await page.goto('/');

    // 2. Verify page redirects to dashboard
    await expect(page).toHaveURL(baseURL + '/dashboard');

    // 3. Verify title contains "OpenCode"
    await expect(page).toHaveTitle(/OpenCode/);

    // 4. Take screenshot for verification
    await page.screenshot({ path: 'e2e/screenshots/TC-000-app-access.png', fullPage: true });
  });
});
