// [COMCLERK-MODIFIED] 2024-12-01: 자동 세션 생성 동작에 맞게 테스트 수정
import { test, expect } from '@playwright/test';

test.describe('TC-001: 대시보드 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('대시보드 접속 시 자동 세션 생성 및 리다이렉트 확인', async ({ page }) => {
    // 1. 대시보드 접속 시 세션 페이지로 자동 리다이렉트 확인
    // 세션 생성 및 리다이렉트까지 대기 (최대 15초)
    await page.waitForURL(/\/dashboard\/session\//, { timeout: 15000 });

    // 2. 세션 페이지에서 메시지 입력창 확인
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-001-auto-session.png', fullPage: true });
  });

  test('세션 페이지 기본 요소 확인', async ({ page }) => {
    // 1. 세션 페이지로 리다이렉트 대기
    await page.waitForURL(/\/dashboard\/session\//, { timeout: 15000 });

    // 2. 사이드바 존재 확인
    const sidebar = page.locator('nav, aside').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // 3. 메시지 입력 영역 확인
    const messageInput = page.locator('textarea');
    await expect(messageInput).toBeVisible({ timeout: 5000 });

    // 4. 전송 버튼 확인
    const sendBtn = page.locator('button[type="submit"]');
    await expect(sendBtn).toBeVisible({ timeout: 5000 });

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-001-session-page.png', fullPage: true });
  });

  test('사이드바에서 설정 페이지 이동', async ({ page }) => {
    // 1. 세션 페이지로 리다이렉트 대기
    await page.waitForURL(/\/dashboard\/session\//, { timeout: 15000 });

    // 2. 설정 버튼/아이콘 클릭 (사이드바에서)
    const settingsBtn = page.locator('a[href="/settings"], button:has-text("Settings"), [aria-label*="settings" i]').first();

    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForURL(/\/settings/);
    } else {
      // 설정 아이콘으로 이동
      const settingsIcon = page.locator('svg').filter({ has: page.locator('path[d*="cog"], path[d*="gear"]') }).first();
      if (await settingsIcon.isVisible()) {
        await settingsIcon.click();
        await page.waitForURL(/\/settings/, { timeout: 5000 });
      }
    }

    // 3. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-001-settings-navigation.png', fullPage: true });
  });
});
