#!/bin/bash
# Coolify 설치 스크립트 (로컬 서버 192.168.1.188 등에서 실행)
# 사용법: 서버에 SSH 접속한 뒤
#   curl -fsSL https://raw.githubusercontent.com/sawolsamsip/mongoori-rides/main/scripts/coolify-install-on-server.sh | sudo bash
# 또는 이 파일을 서버에 복사한 뒤: sudo bash coolify-install-on-server.sh

set -e

echo "=== Coolify 설치 전 확인 ==="
echo "서버 IP: $(hostname -I 2>/dev/null | awk '{print $1}')"
echo ""

# 포트 8000 사용 여부 (Coolify UI 기본 포트)
if command -v ss &>/dev/null; then
  if ss -tuln 2>/dev/null | grep -q ':8000 '; then
    echo "경고: 포트 8000이 이미 사용 중입니다. 기존 서비스를 중지하거나 Coolify 설치 후 포트를 변경하세요."
    read -p "계속하시겠습니까? (y/N): " cont
    [[ "$cont" != "y" && "$cont" != "Y" ]] && exit 1
  fi
elif command -v netstat &>/dev/null; then
  if netstat -tuln 2>/dev/null | grep -q ':8000 '; then
    echo "경고: 포트 8000이 이미 사용 중입니다."
    read -p "계속하시겠습니까? (y/N): " cont
    [[ "$cont" != "y" && "$cont" != "Y" ]] && exit 1
  fi
fi

# Docker 설치 여부 (스크립트가 알아서 설치함)
echo "Coolify 공식 설치 스크립트를 실행합니다 (Docker 24+ 자동 설치)..."
echo ""

curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash

echo ""
echo "=== 설치 완료 ==="
echo "브라우저에서 접속: http://192.168.1.188:8000  (또는 이 서버의 IP)"
echo "첫 접속 시 관리자 계정을 만드세요."
echo "이후 DEPLOY.md 1~3단계대로 mongoori-rides 백엔드/프론트를 추가하면 됩니다."
