#!/bin/bash
#
# ComClerk 개발 서버 실행 스크립트
# - comclerk-backend: OpenCode API 서버 (port 4096)
# - comclerk-web: Next.js 프론트엔드 (port 4000)
# - 작업 디렉토리: pdfs/ (모든 서버가 이 폴더를 프로젝트로 인식)
#
# 사용법:
#   ./start.sh              # 전체 실행
#   ./start.sh backend      # 백엔드만
#   ./start.sh web          # 프론트엔드만
#

set -e

# 스크립트 위치 기준으로 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/comclerk-backend"
WEB_DIR="$SCRIPT_DIR/comclerk-web"
PDF_DIR="$SCRIPT_DIR/pdfs"

# 포트 설정
BACKEND_PORT=4096
WEB_PORT=4000

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PID 저장용
BACKEND_PID=""
WEB_PID=""

# 종료 시 프로세스 정리
cleanup() {
    echo -e "\n${YELLOW}[ComClerk] 서버를 종료합니다...${NC}"

    [ -n "$WEB_PID" ] && kill $WEB_PID 2>/dev/null
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null

    echo -e "${GREEN}[ComClerk] 종료 완료${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 의존성 확인
check_dependencies() {
    if ! command -v bun &> /dev/null; then
        echo -e "${RED}[Error] Bun이 설치되어 있지 않습니다.${NC}"
        echo "설치: curl -fsSL https://bun.sh/install | bash"
        exit 1
    fi
}

# 포트 사용 중인 프로세스 종료
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}[ComClerk] 포트 $port 사용 중인 프로세스(PID: $pid) 종료 중...${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}[ComClerk] 포트 $port 해제됨${NC}"
    fi
}

# 백엔드 서버 시작 (API 서버)
start_backend() {
    kill_port $BACKEND_PORT
    echo -e "${BLUE}[Backend] comclerk-backend API 서버 시작 중 (port $BACKEND_PORT)...${NC}"
    echo -e "${BLUE}[Backend] 프로젝트 디렉토리: $PDF_DIR${NC}"

    # 백엔드 디렉토리에서 실행하되, --directory로 pdfs를 프로젝트로 지정
    cd "$BACKEND_DIR"
    bun run --cwd packages/opencode src/index.ts serve --port $BACKEND_PORT --directory "$PDF_DIR" &
    BACKEND_PID=$!
    echo -e "${GREEN}[Backend] PID: $BACKEND_PID (http://localhost:$BACKEND_PORT)${NC}"
}

# 프론트엔드 시작
start_web() {
    kill_port $WEB_PORT
    echo -e "${BLUE}[Web] comclerk-web 시작 중 (port $WEB_PORT)...${NC}"

    cd "$WEB_DIR"
    NEXT_PUBLIC_OPENCODE_API_URL="http://localhost:$BACKEND_PORT" bun dev --port $WEB_PORT &
    WEB_PID=$!
    echo -e "${GREEN}[Web] PID: $WEB_PID (http://localhost:$WEB_PORT)${NC}"
}

# 메인
main() {
    local mode="${1:-all}"

    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════╗"
    echo "║         ComClerk 개발 서버            ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${NC}"

    check_dependencies

    # PDF 작업 폴더 확인
    if [ ! -d "$PDF_DIR" ]; then
        echo -e "${RED}[Error] PDF 작업 폴더가 없습니다: $PDF_DIR${NC}"
        exit 1
    fi

    echo -e "${YELLOW}[ComClerk] 프로젝트 디렉토리: $PDF_DIR${NC}"
    echo ""

    case "$mode" in
        backend)
            start_backend
            ;;
        web)
            start_web
            ;;
        all|*)
            start_backend
            sleep 3  # 백엔드 서버가 준비될 때까지 대기
            start_web
            ;;
    esac

    echo ""
    echo -e "${GREEN}[ComClerk] 서버가 시작되었습니다.${NC}"
    echo -e "${BLUE}  Backend API: http://localhost:$BACKEND_PORT${NC}"
    echo -e "${BLUE}  Web UI:      http://localhost:$WEB_PORT (3패널 워크스페이스)${NC}"
    echo -e "${BLUE}  Dashboard:   http://localhost:$WEB_PORT/dashboard${NC}"
    echo -e "${BLUE}  프로젝트:    $PDF_DIR${NC}"
    echo -e "${YELLOW}종료하려면 Ctrl+C를 누르세요.${NC}"
    echo ""

    # 프로세스 대기
    wait
}

main "$@"
