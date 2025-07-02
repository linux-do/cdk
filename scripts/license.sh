#!/bin/bash

# simple_license_check.sh - 支持多目录排除版本

LICENSE_FILE="LICENSE"
FAILED_FILES=()

# 要排除的目录列表
EXCLUDE_DIRS=("vendor" "docs" ".git" "node_modules" "build")

# 检查 LICENSE 文件是否存在
if [ ! -f "$LICENSE_FILE" ]; then
    echo "错误: LICENSE 文件不存在"
    exit 1
fi

echo "检查 Go 文件是否包含 LICENSE 内容..."

# 构建 find 命令的排除参数
exclude_args=""
for dir in "${EXCLUDE_DIRS[@]}"; do
    exclude_args="$exclude_args -not -path \"./$dir/*\""
done

# 查找所有 Go 文件（排除指定目录和测试文件）
eval "find . -name \"*.go\" $exclude_args -not -name \"*_test.go\"" | while read file; do
    echo -n "检查 $file ... "

    # 检查文件前20行是否包含 license 相关关键词
    if head -n 20 "$file" | grep -qi "license\|copyright\|©"; then
        echo "✓"
    else
        echo "✗ 缺少 license"
        FAILED_FILES+=("$file")
    fi
done

# 重新统计（因为管道会创建子shell）
FAILED_COUNT=0
echo
echo "最终检查结果："

eval "find . -name \"*.go\" $exclude_args -not -name \"*_test.go\"" | while read file; do
    if ! head -n 20 "$file" | grep -qi "license\|copyright\|©"; then
        echo "❌ $file 缺少 license"
        ((FAILED_COUNT++))
    fi
done

# 统计失败的文件数量
TOTAL_FAILED=$(eval "find . -name \"*.go\" $exclude_args -not -name \"*_test.go\"" | \
               while read file; do
                   if ! head -n 20 "$file" | grep -qi "license\|copyright\|©"; then
                       echo "$file"
                   fi
               done | wc -l)

if [ "$TOTAL_FAILED" -eq 0 ]; then
    echo "✅ 所有文件都包含 license 头部"
    exit 0
else
    echo "❌ 共有 $TOTAL_FAILED 个文件缺少 license 头部"
    exit 1
fi