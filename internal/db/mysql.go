package db

import (
	"context"
	"fmt"
	"github.com/linux-do/cdk/internal/config"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/plugin/opentelemetry/tracing"
	"log"
	"time"
)

var (
	db *gorm.DB
)

func init() {
	var err error

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.Config.Database.Username,
		config.Config.Database.Password,
		config.Config.Database.Host,
		config.Config.Database.Port,
		config.Config.Database.Database,
	)
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{DisableForeignKeyConstraintWhenMigrating: true})
	if err != nil {
		log.Fatalf("[MySQL] init connection failed: %v\n", err)
	}

	// Trace 注入
	if err := db.Use(tracing.NewPlugin(tracing.WithoutMetrics())); err != nil {
		log.Fatalf("[MySQL] init trace failed: %v\n", err)
	}

	// 获取通用数据库对象
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[MySQL] load sql db failed: %v\n", err)
	}

	// 设置连接池参数
	dbConfig := config.Config.Database
	sqlDB.SetMaxIdleConns(dbConfig.MaxIdleConn)
	sqlDB.SetMaxOpenConns(dbConfig.MaxOpenConn)
	sqlDB.SetConnMaxLifetime(time.Duration(dbConfig.ConnMaxLifetime) * time.Second)
}

func DB(ctx context.Context) *gorm.DB {
	return db.WithContext(ctx)
}
