#!/bin/bash

set -e

# 配置变量
LICENSE_FILE="LICENSE"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LICENSE_HEADER_FILE="${SCRIPT_DIR}/.license_header"
GO_FILES_PATTERN="*.go"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示使用帮助
show_help() {
    cat << EOF
Usage: $0 [OPTIONS] [DIRECTORY]

检查并添加 LICENSE 注释到 Go 文件

OPTIONS:
    -l, --license FILE      指定 LICENSE 文件路径 (默认: ./LICENSE)
    -p, --pattern PATTERN   指定文件匹配模式 (默认: *.go)
    -d, --dry-run          只检查，不修改文件
    -v, --verbose          详细输出
    -h, --help             显示此帮助信息

EXAMPLES:
    $0                      # 检查当前目录及子目录的所有 Go 文件
    $0 ./src               # 检查 ./src 目录
    $0 -l MIT_LICENSE      # 使用指定的 LICENSE 文件
    $0 -d                  # 只检查，不修改文件

EOF
}

# 解析命令行参数
parse_arguments() {
    DRY_RUN=false
    VERBOSE=false
    TARGET_DIR="."

    while [[ $# -gt 0 ]]; do
        case $1 in
            -l|--license)
                LICENSE_FILE="$2"
                shift 2
                ;;
            -p|--pattern)
                GO_FILES_PATTERN="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -*)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                TARGET_DIR="$1"
                shift
                ;;
        esac
    done
}

# 检查 LICENSE 文件是否存在
check_license_file() {
    if [[ ! -f "$LICENSE_FILE" ]]; then
        print_error "LICENSE 文件不存在: $LICENSE_FILE"
        print_info "请确保 LICENSE 文件存在，或使用 -l 参数指定正确的路径"
        exit 1
    fi

    if [[ ! -s "$LICENSE_FILE" ]]; then
        print_error "LICENSE 文件为空: $LICENSE_FILE"
        exit 1
    fi

    print_info "使用 LICENSE 文件: $LICENSE_FILE"
}

# 生成 LICENSE 头部注释
generate_license_header() {
    echo "/*" > "$LICENSE_HEADER_FILE"

    # 读取 LICENSE 文件并添加注释格式
    while IFS= read -r line || [[ -n "$line" ]]; do
        if [[ -n "$line" ]]; then
            echo " * $line" >> "$LICENSE_HEADER_FILE"
        else
            echo " *" >> "$LICENSE_HEADER_FILE"
        fi
    done < "$LICENSE_FILE"

    echo " */" >> "$LICENSE_HEADER_FILE"
    echo "" >> "$LICENSE_HEADER_FILE"

    if [[ "$VERBOSE" == true ]]; then
        print_info "生成的 LICENSE 头部："
        cat "$LICENSE_HEADER_FILE"
    fi
}

# 检查文件是否已包含 LICENSE
has_license() {
    local file="$1"

    # 检查文件开头是否有多行注释
    if head -n 20 "$file" | grep -q "^/\*"; then
        # 提取前面的多行注释块
        local comment_block
        comment_block=$(sed -n '1,/^\*\//p' "$file" 2>/dev/null || echo "")

        # 检查注释块中是否包含 LICENSE 关键词
        if echo "$comment_block" | grep -i -q -E "(license|copyright|licensed|all rights reserved)"; then
            return 0  # 已包含 LICENSE
        fi
    fi

    return 1  # 未包含 LICENSE
}

# 添加 LICENSE 到文件开头
add_license_to_file() {
    local file="$1"
    local temp_file="${file}.tmp"

    if [[ "$DRY_RUN" == true ]]; then
        print_warning "[DRY-RUN] 需要添加 LICENSE: $file"
        return 0
    fi

    # 创建临时文件
    if ! cp "$file" "$temp_file"; then
        print_error "无法创建临时文件: $temp_file"
        return 1
    fi

    # 将 LICENSE 头部和原文件内容合并
    if cat "$LICENSE_HEADER_FILE" "$temp_file" > "$file"; then
        rm -f "$temp_file"
        print_success "已添加 LICENSE: $file"
        return 0
    else
        # 恢复原文件
        mv "$temp_file" "$file"
        print_error "添加 LICENSE 失败: $file"
        return 1
    fi
}

# 检查单个文件
check_single_file() {
    local file="$1"

    if [[ "$VERBOSE" == true ]]; then
        print_info "检查文件: $file"
    fi

    # 检查文件是否可读
    if [[ ! -r "$file" ]]; then
        print_warning "无法读取文件: $file"
        return 1
    fi

    # 检查是否为空文件
    if [[ ! -s "$file" ]]; then
        print_warning "跳过空文件: $file"
        return 0
    fi

    # 检查是否已有 LICENSE
    if has_license "$file"; then
        if [[ "$VERBOSE" == true ]]; then
            print_success "已有 LICENSE: $file"
        fi
        return 0
    fi

    # 添加 LICENSE
    add_license_to_file "$file"
    return $?
}

# 查找并处理所有 Go 文件
process_go_files() {
    local target_dir="$1"

    if [[ ! -d "$target_dir" ]]; then
        print_error "目录不存在: $target_dir"
        exit 1
    fi

    print_info "扫描目录: $target_dir"
    print_info "文件模式: $GO_FILES_PATTERN"

    local total_files=0
    local processed_files=0
    local added_files=0
    local failed_files=0

    # 使用 find 命令查找所有匹配的文件
    while IFS= read -r -d '' file; do
        ((total_files++))

        if check_single_file "$file"; then
            if [[ "$DRY_RUN" == true ]] && ! has_license "$file"; then
                ((added_files++))
            elif [[ "$DRY_RUN" == false ]] && has_license "$file"; then
                ((added_files++))
            fi
            ((processed_files++))
        else
            ((failed_files++))
        fi

    done < <(find "$target_dir" -name "$GO_FILES_PATTERN" -type f -print0 2>/dev/null)

    # 输出统计信息
    echo ""
    print_info "========== 处理完成 =========="
    print_info "总文件数: $total_files"
    print_info "处理成功: $processed_files"

    if [[ "$DRY_RUN" == true ]]; then
        print_info "需要添加 LICENSE: $added_files"
        print_warning "这是 DRY-RUN 模式，未实际修改文件"
    else
        print_info "添加 LICENSE: $added_files"
    fi

    if [[ $failed_files -gt 0 ]]; then
        print_warning "处理失败: $failed_files"
    fi

    if [[ $total_files -eq 0 ]]; then
        print_warning "未找到匹配的 Go 文件"
    fi
}

# 清理临时文件
cleanup() {
    if [[ -f "$LICENSE_HEADER_FILE" ]]; then
        rm -f "$LICENSE_HEADER_FILE"
    fi
}

# 主函数
main() {
    print_info "Go 文件 LICENSE 检查工具"
    print_info "========================="

    # 解析命令行参数
    parse_arguments "$@"

    # 设置清理函数
    trap cleanup EXIT

    # 检查 LICENSE 文件
    check_license_file

    # 生成 LICENSE 头部
    generate_license_header

    # 处理 Go 文件
    process_go_files "$TARGET_DIR"
}

# 运行主函数
main "$@"