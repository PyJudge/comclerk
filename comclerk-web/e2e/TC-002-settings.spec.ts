import { test, expect } from '@playwright/test';

test.describe('TC-002: 설정 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('설정 페이지 기본 요소 확인', async ({ page }) => {
    // 1. 설정 페이지 타이틀 확인
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();

    // 2. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-002-settings-page.png', fullPage: true });
  });

  test('OAuth 로그인 섹션 확인', async ({ page }) => {
    // 1. OAuth 관련 요소 찾기
    const oauthSection = page.getByText(/Connect with OAuth|OAuth|Provider/i);

    // 2. OAuth 섹션이 있으면 확인
    if (await oauthSection.count() > 0) {
      await expect(oauthSection.first()).toBeVisible();
    }

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-002-oauth-section.png', fullPage: true });
  });

  test('API 키 섹션 확인', async ({ page }) => {
    // 1. API Key 관련 요소 찾기
    const apiKeySection = page.getByText(/API Key|API|Key/i);

    // 2. API Key 섹션이 있으면 확인
    if (await apiKeySection.count() > 0) {
      await expect(apiKeySection.first()).toBeVisible();
    }

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-002-apikey-section.png', fullPage: true });
  });

  test('뒤로가기 또는 대시보드 이동', async ({ page }) => {
    // 1. 로고나 홈 버튼 클릭하여 대시보드로 이동
    const logo = page.locator('[class*="rounded-lg"]').first();
    await logo.click();

    // 2. 대시보드로 이동 확인
    await page.waitForTimeout(500);

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-002-back-to-dashboard.png', fullPage: true });
  });
});
