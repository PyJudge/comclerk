// [COMCLERK-MODIFIED] 2024-12-01: --directory 옵션 추가
import { Server } from "../../server/server"
import { cmd } from "./cmd"

export const ServeCommand = cmd({
  command: "serve",
  builder: (yargs) =>
    yargs
      .option("port", {
        alias: ["p"],
        type: "number",
        describe: "port to listen on",
        default: 0,
      })
      .option("hostname", {
        type: "string",
        describe: "hostname to listen on",
        default: "127.0.0.1",
      })
      .option("directory", {
        alias: ["d"],
        type: "string",
        describe: "project directory to use",
        default: process.cwd(),
      }),
  describe: "starts a headless opencode server",
  handler: async (args) => {
    const hostname = args.hostname
    const port = args.port
    const directory = args.directory

    // 서버 시작 전에 작업 디렉토리 변경
    // 서버 미들웨어가 process.cwd()를 fallback으로 사용하기 때문
    process.chdir(directory)

    const server = Server.listen({
      port,
      hostname,
    })
    console.log(`opencode server listening on http://${server.hostname}:${server.port}`)
    console.log(`project directory: ${directory}`)
    await new Promise(() => {})
    await server.stop()
  },
})
