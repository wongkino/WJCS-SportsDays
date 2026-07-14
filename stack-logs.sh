#!/bin/bash

echo "📋 運動會計分程式 Stack 日誌"
echo ""

# 檢查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 請先安裝 Docker Compose"
    exit 1
fi

# 顯示參數
SERVICE=""
FOLLOW=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW="-f"
            shift
            ;;
        -s|--service)
            SERVICE="$2"
            shift 2
            ;;
        *)
            echo "用法: $0 [-f|--follow] [-s|--service <service_name>]"
            echo "  -f, --follow     即時跟蹤日誌"
            echo "  -s, --service    指定服務名稱 (frontend|backend)"
            exit 1
            ;;
    esac
done

# 顯示日誌
if [ -n "$SERVICE" ]; then
    echo "📋 顯示 $SERVICE 服務日誌："
    if command -v docker-compose &> /dev/null; then
        docker-compose logs $FOLLOW $SERVICE
    else
        docker compose logs $FOLLOW $SERVICE
    fi
else
    echo "📋 顯示所有服務日誌："
    if command -v docker-compose &> /dev/null; then
        docker-compose logs $FOLLOW
    else
        docker compose logs $FOLLOW
    fi
fi
