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
	sqlFile := "internal/db/migrator/sql/proc/create_dashboard_proc.sql"
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
