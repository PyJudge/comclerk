// [COMCLERK-ADDED] 2024-12-01: ConfigWatcher integration test
// 이 테스트는 서버가 실행 중일 때 수동으로 실행해야 합니다.
// 실행 방법: ./start.sh backend 후 bun test test/config/watcher.test.ts
import { describe, test, expect, afterAll, beforeAll } from "bun:test"
import fs from "fs/promises"
import path from "path"

const SERVER_URL = "http://localhost:4096"
const TEST_DIR = "/Users/wonmyeongkwon/Desktop/Developer/comclerk/pdfs"

describe("ConfigWatcher Integration", () => {
  const agentDir = path.join(TEST_DIR, ".opencode/agent")
  const testAgentFile = path.join(agentDir, "test-watcher.md")
  const configFile = path.join(TEST_DIR, "opencode.json")

  beforeAll(async () => {
    // 서버가 실행 중인지 확인
    try {
      await fetch(`${SERVER_URL}/agent`)
    } catch {
      console.log("⚠️  서버가 실행 중이지 않습니다. ./start.sh backend 로 서버를 먼저 시작하세요.")
      process.exit(1)
    }

    // 테스트 디렉토리 생성
    await fs.mkdir(agentDir, { recursive: true })
  })

  afterAll(async () => {
    // 테스트 파일 정리
    await fs.rm(testAgentFile, { force: true })
    await fs.rm(configFile, { force: true })
  })

  test("agent 파일 생성 시 설정이 바로 반영됨", async () => {
    // 1. 현재 agent 목록 조회
    const beforeRes = await fetch(`${SERVER_URL}/agent`)
    const before = (await beforeRes.json()) as any[]
    const beforeNames = before.map((a) => a.name)
    expect(beforeNames.includes("test-watcher")).toBe(false)

    // 2. 새 agent 파일 생성
    await fs.writeFile(
      testAgentFile,
      `---
description: "Test watcher agent"
mode: primary
---
You are a test agent for config watcher.`,
    )

    // 3. debounce (300ms) + 여유 시간 대기
    await Bun.sleep(600)

    // 4. agent 목록에서 새 agent 확인
    const afterRes = await fetch(`${SERVER_URL}/agent`)
    const after = (await afterRes.json()) as any[]
    const afterNames = after.map((a) => a.name)
    expect(afterNames.includes("test-watcher")).toBe(true)
  })

  test("agent 파일 수정 시 설정이 바로 반영됨", async () => {
    // 1. agent 파일 수정
    await fs.writeFile(
      testAgentFile,
      `---
description: "Updated test agent"
mode: primary
---
You are an updated test agent.`,
    )

    // 2. 대기
    await Bun.sleep(600)

    // 3. description 변경 확인
    const res = await fetch(`${SERVER_URL}/agent`)
    const agents = (await res.json()) as any[]
    const testAgent = agents.find((a) => a.name === "test-watcher")
    expect(testAgent).toBeDefined()
    expect(testAgent?.description).toBe("Updated test agent")
  })

  test("opencode.json 수정 시 설정이 바로 반영됨", async () => {
    // 1. config 파일 생성
    const testValue = Date.now()
    await fs.writeFile(
      configFile,
      JSON.stringify(
        {
          $schema: "https://opencode.ai/config.json",
        },
        null,
        2,
      ),
    )

    // 2. 대기
    await Bun.sleep(600)

    // 3. 서버 로그에서 "disposing instance" 확인 필요 (수동)
    // config는 직접 API로 확인하기 어려우므로 로그로 확인
    console.log("✓ opencode.json 변경 후 dispose 호출 확인 필요 (서버 로그)")

    // 4. 정리
    await fs.rm(configFile, { force: true })
    await Bun.sleep(600)
  })

  test("agent 파일 삭제 시 설정이 바로 반영됨", async () => {
    // 1. 파일 삭제
    await fs.rm(testAgentFile, { force: true })

    // 2. 대기
    await Bun.sleep(600)

    // 3. agent가 사라졌는지 확인
    const res = await fetch(`${SERVER_URL}/agent`)
    const agents = (await res.json()) as any[]
    const testAgent = agents.find((a) => a.name === "test-watcher")
    expect(testAgent).toBeUndefined()
  })
})
