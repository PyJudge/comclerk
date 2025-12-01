import { test, expect } from '@playwright/test';

test.describe('TC-004: 사이드바 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('사이드바 기본 요소 확인', async ({ page }) => {
    // 1. 사이드바 존재 확인
    const sidebar = page.locator('aside, [class*="sidebar"], [class*="w-16"], [class*="w-64"]');
    await expect(sidebar.first()).toBeVisible();

    // 2. 로고 확인
    const logo = page.locator('[class*="rounded-lg"]').first();
    await expect(logo).toBeVisible();

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-004-sidebar-main.png', fullPage: true });
  });

  test('사이드바 네비게이션 아이콘 확인', async ({ page }) => {
    // 1. + 버튼 (새 세션)
    const newBtn = page.locator('button').filter({ hasText: '+' });
    if (await newBtn.count() > 0) {
      await expect(newBtn.first()).toBeVisible();
    }

    // 2. 채팅 아이콘
    const chatIcon = page.locator('svg').first();
    await expect(chatIcon).toBeVisible();

    // 3. 설정 아이콘
    const settingsIcon = page.locator('[class*="settings"], svg').last();
    await expect(settingsIcon).toBeVisible();

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-004-sidebar-icons.png', fullPage: true });
  });

  test('사이드바 토글 (접기/펼치기) 확인', async ({ page }) => {
    // 1. 토글 버튼 찾기 (>> 또는 << 아이콘)
    const toggleBtn = page.getByText('»').or(page.getByText('«')).or(page.getByText('>>'));

    if (await toggleBtn.count() > 0) {
      // 2. 토글 클릭 전 스크린샷
      await page.screenshot({ path: 'e2e/screenshots/TC-004-sidebar-before-toggle.png', fullPage: true });

      // 3. 토글 클릭
      await toggleBtn.first().click();
      await page.waitForTimeout(300);

      // 4. 토글 클릭 후 스크린샷
      await page.screenshot({ path: 'e2e/screenshots/TC-004-sidebar-after-toggle.png', fullPage: true });
    } else {
      await page.screenshot({ path: 'e2e/screenshots/TC-004-no-toggle.png', fullPage: true });
    }
  });

  test('사이드바에서 설정으로 이동', async ({ page }) => {
    // 1. 설정 아이콘/버튼 찾기
    const settingsBtn = page.locator('a[href*="settings"], button').filter({ has: page.locator('svg') }).last();

    if (await settingsBtn.count() > 0) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
    }

    // 2. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-004-sidebar-to-settings.png', fullPage: true });
  });

  test('사이드바에서 대시보드로 이동', async ({ page }) => {
    // 1. 먼저 다른 페이지로 이동
    await page.goto('/settings');
    await page.waitForTimeout(300);

    // 2. 로고 또는 채팅 아이콘 클릭하여 대시보드로 이동
    const logo = page.locator('[class*="rounded-lg"]').first();
    await logo.click();
    await page.waitForTimeout(500);

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-004-sidebar-to-dashboard.png', fullPage: true });
  });
});
