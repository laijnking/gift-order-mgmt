#!/bin/bash

set -e

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
PROJECT_DIR=$(dirname "$SCRIPT_DIR")

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres123}"
DB_NAME="${DB_NAME:-postgres}"

export PGPASSWORD="$DB_PASSWORD"

echo "=============================================="
echo "  执行数据库迁移脚本"
echo "=============================================="
echo "数据库: $DB_HOST:$DB_PORT/$DB_NAME"
echo "用户: $DB_USER"
echo ""

MIGRATIONS_DIR="$PROJECT_DIR/supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "错误: 迁移目录不存在: $MIGRATIONS_DIR"
    exit 1
fi

MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" | sort)

if [ -z "$MIGRATION_FILES" ]; then
    echo "警告: 未找到迁移脚本"
    exit 0
fi

echo "找到以下迁移脚本:"
echo "$MIGRATION_FILES"
echo ""

for file in $MIGRATION_FILES; do
    echo "----------------------------------------------"
    echo "执行: $(basename "$file")"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" -q; then
        echo "✅ 成功"
    else
        echo "❌ 失败"
        exit 1
    fi
done

echo ""
echo "=============================================="
echo "  所有迁移脚本执行完成"
echo "=============================================="

unset PGPASSWORD