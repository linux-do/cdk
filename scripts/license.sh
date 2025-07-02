#!/bin/bash

# simple_license_check.sh - 简化版本

LICENSE_FILE="LICENSE"
FAILED_FILES=()

# 检查 LICENSE 文件是否存在
if [ ! -f "$LICENSE_FILE" ]; then
    echo "错误: LICENSE 文件不存在"
    exit 1
fi

echo "检查 Go 文件是否包含 LICENSE 内容..."

# 查找所有 Go 文件（排除 vendor 目录和测试文件）
for file in $(find . -name "*.go" -not -path "./vendor/*" -not -name "*_test.go"); do
    echo -n "检查 $file ... "

    # 检查文件前20行是否包含 license 相关关键词
    if head -n 20 "$file" | grep -qi "license\|copyright\|©"; then
        echo "✓"
    else
        echo "✗ 缺少 license"
        FAILED_FILES+=("$file")
    fi
done

# 显示结果
echo
if [ ${#FAILED_FILES[@]} -eq 0 ]; then
    echo "✅ 所有文件都包含 license 头部"
    exit 0
else
    echo "❌ 以下文件缺少 license 头部:"
    printf '%s\n' "${FAILED_FILES[@]}"
    exit 1
fi