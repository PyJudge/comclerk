// [COMCLERK-ADDED] 2024-12-01: Config file watcher for hot-reload
// 목적: .opencode/agent/*.md 및 opencode.json 파일 변경 시 자동으로 캐시 무효화
// FileWatcher 대신 fs.watch 사용 (ESM 환경에서 @parcel/watcher 로딩 문제 회피)
import fs from "fs"
import path from "path"
import { Instance } from "../project/instance"
import { Log } from "../util/log"

export namespace ConfigWatcher {
  const log = Log.create({ service: "config.watcher" })
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const DEBOUNCE_MS = 300

  function shouldReload(filename: string): boolean {
    // 감시 대상:
    // 1. .opencode/agent/*.md, mode/*.md, command/*.md 파일
    // 2. opencode.json, opencode.jsonc 파일
    if (filename.endsWith(".md")) return true
    if (filename === "opencode.json" || filename === "opencode.jsonc") return true
    return false
  }

  function handleChange(eventType: string, filename: string | null, watchPath: string) {
    if (!filename || !shouldReload(filename)) return

    const fullPath = path.join(watchPath, filename)
    log.info("config file changed", { file: fullPath, event: eventType })

    // Debounce: 여러 파일 동시 변경 시 한 번만 dispose
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      log.info("disposing instance due to config change")
      await Instance.dispose()
    }, DEBOUNCE_MS)
  }

  const state = Instance.state(
    async () => {
      log.info("init", { directory: Instance.directory })

      const watchers: fs.FSWatcher[] = []

      // .opencode 디렉토리 감시
      const opencodeDir = path.join(Instance.directory, ".opencode")
      const agentDir = path.join(opencodeDir, "agent")
      const modeDir = path.join(opencodeDir, "mode")
      const commandDir = path.join(opencodeDir, "command")

      // 디렉토리가 존재하면 감시 시작
      for (const dir of [agentDir, modeDir, commandDir]) {
        try {
          if (fs.existsSync(dir)) {
            const watcher = fs.watch(dir, { persistent: false }, (eventType, filename) => {
              handleChange(eventType, filename, dir)
            })
            watchers.push(watcher)
            log.info("watching directory", { dir })
          }
        } catch (err) {
          log.warn("failed to watch directory", { dir, error: err })
        }
      }

      // opencode.json, opencode.jsonc 파일 감시
      for (const configFile of ["opencode.json", "opencode.jsonc"]) {
        const configPath = path.join(Instance.directory, configFile)
        try {
          if (fs.existsSync(configPath)) {
            const watcher = fs.watch(configPath, { persistent: false }, (eventType) => {
              handleChange(eventType, configFile, Instance.directory)
            })
            watchers.push(watcher)
            log.info("watching file", { file: configPath })
          }
        } catch (err) {
          // 파일이 없으면 무시
        }
      }

      return { watchers }
    },
    async (state) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      for (const watcher of state.watchers) {
        watcher.close()
      }
    },
  )

  export function init() {
    state()
  }
}
