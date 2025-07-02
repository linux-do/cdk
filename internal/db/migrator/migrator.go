/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package migrator

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/apps/project"
	"github.com/linux-do/cdk/internal/db"
)

func Migrate() {
	if err := db.DB(context.Background()).AutoMigrate(
		&oauth.User{},
		&project.Project{},
		&project.ProjectItem{},
		&project.ProjectTag{},
	); err != nil {
		log.Fatalf("[MySQL] auto migrate failed: %v\n", err)
	}
	log.Printf("[MySQL] auto migrate success\n")

	// 创建存储过程
	if err := createStoredProcedures(); err != nil {
		log.Fatalf("[MySQL] create stored procedures failed: %v\n", err)
	}
}

// 创建存储过程
func createStoredProcedures() error {
	// 读取SQL文件
	sqlFile := "support-files/sql/create_dashboard_proc.sql"
	content, err := os.ReadFile(sqlFile)
	if err != nil {
		return err
	}

	// 处理SQL脚本，替换DELIMITER并分割成单独的语句
	sqlContent := string(content)
	// 移除DELIMITER声明行
	sqlContent = strings.Replace(sqlContent, "DELIMITER $$", "", -1)
	sqlContent = strings.Replace(sqlContent, "DELIMITER ;", "", -1)
	sqlContent = strings.Replace(sqlContent, "$$", ";", -1)

	// 执行SQL语句
	if err := db.DB(context.Background()).Exec(sqlContent).Error; err != nil {
		return err
	}

	return nil
}
