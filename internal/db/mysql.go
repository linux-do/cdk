package db

import (
	"fmt"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/logger"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
	"log"
	"time"
)

var (
	DB *gorm.DB
)

func init() {
	var err error

	// 配置日志
	level := gormLogger.Info
	switch config.Config.Database.LogLevel {
	case "silent":
		level = gormLogger.Silent
	case "error":
		level = gormLogger.Error
	case "warn":
		level = gormLogger.Warn
	case "info":
		level = gormLogger.Info
	}

	// 创建自定义日志配置
	newLogger := gormLogger.New(
		log.New(logger.GetLogWriter(), "\r\n", log.LstdFlags),
		gormLogger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  level,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.Config.Database.Username,
		config.Config.Database.Password,
		config.Config.Database.Host,
		config.Config.Database.Port,
		config.Config.Database.Database,
	)
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: newLogger, DisableForeignKeyConstraintWhenMigrating: true})
	if err != nil {
		log.Fatalf("[MySQL] init connection failed: %v\n", err)
	}

	// 获取通用数据库对象
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("[MySQL] load sql db failed: %v\n", err)
	}

	// 设置连接池参数
	dbConfig := config.Config.Database
	sqlDB.SetMaxIdleConns(dbConfig.MaxIdleConn)
	sqlDB.SetMaxOpenConns(dbConfig.MaxOpenConn)
	sqlDB.SetConnMaxLifetime(time.Duration(dbConfig.ConnMaxLifetime) * time.Second)
}
