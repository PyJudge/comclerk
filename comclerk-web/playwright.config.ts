import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,  // 순차 실행으로 백엔드 부하 감소
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,  // 로컬에서도 1회 재시도
  workers: 1,  // 단일 워커로 세션 충돌 방지
  reporter: 'html',
  timeout: 120000,  // 테스트 타임아웃 120초 (세션 로딩 대기)
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'NEXT_PUBLIC_OPENCODE_API_URL=http://localhost:4096 bun dev --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
