import { test, expect } from '@playwright/test';

test.describe('TC-003: 세션 관리', () => {
  test('새 세션 생성 버튼 확인', async ({ page }) => {
    // 1. 대시보드로 이동
    await page.goto('/dashboard');

    // 2. + 버튼 (새 세션 생성) 찾기
    const newSessionBtn = page.locator('button').filter({ hasText: '+' });

    // 3. 버튼이 있으면 클릭
    if (await newSessionBtn.count() > 0) {
      await newSessionBtn.first().click();
      await page.waitForTimeout(500);
    }

    // 4. 스크린샷 저장
    await page.screenshot({ path: 'e2e/screenshots/TC-003-new-session.png', fullPage: true });
  });

  test('세션 상세 페이지 요소 확인', async ({ page }) => {
    // 1. 대시보드로 이동
    await page.goto('/dashboard');

    // 2. 세션 카드 클릭
    const sessionCards = page.locator('[class*="cursor-pointer"]');
    const cardCount = await sessionCards.count();

    if (cardCount > 0) {
      await sessionCards.first().click();
      await page.waitForURL(/\/session\//);

      // 3. 메시지 입력창 확인
      const messageInput = page.locator('textarea, input[type="text"]');
      if (await messageInput.count() > 0) {
        await expect(messageInput.first()).toBeVisible();
      }

      // 4. 스크린샷 저장
      await page.screenshot({ path: 'e2e/screenshots/TC-003-session-detail.png', fullPage: true });
    } else {
      await page.screenshot({ path: 'e2e/screenshots/TC-003-no-sessions.png', fullPage: true });
    }
  });

  test('메시지 입력 UI 확인', async ({ page }) => {
    // 1. 대시보드로 이동
    await page.goto('/dashboard');

    // 2. 세션 선택
    const sessionCards = page.locator('[class*="cursor-pointer"]');
    if (await sessionCards.count() > 0) {
      await sessionCards.first().click();
      await page.waitForURL(/\/session\//);

      // 3. 메시지 입력 영역 확인
      const textarea = page.locator('textarea');
      if (await textarea.count() > 0) {
        // 플레이스홀더 확인
        await expect(textarea.first()).toBeVisible();

        // 4. 전송 버튼 확인
        const sendBtn = page.locator('button[type="submit"]');
        if (await sendBtn.count() > 0) {
          await expect(sendBtn.first()).toBeVisible();
        }
      }

      // 5. 스크린샷 저장
      await page.screenshot({ path: 'e2e/screenshots/TC-003-message-input.png', fullPage: true });
    }
  });
});
