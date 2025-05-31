package db

import (
	"log"
	"server/internal/plugin/common/config"
	"server/internal/plugin/common/utils"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	// DB 全局数据库连接实例
	DB *gorm.DB
)

// InitDB 初始化数据库连接
func InitDB() error {
	var err error

	// 配置日志
	var level logger.LogLevel
	switch config.AppConfig.Database.LogLevel {
	case "silent":
		level = logger.Silent
	case "error":
		level = logger.Error
	case "warn":
		level = logger.Warn
	case "info":
		level = logger.Info
	}

	// 创建自定义日志配置
	newLogger := logger.New(
		log.New(util.GetLogWriter(), "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold:             time.Second, // 慢SQL阈值
			LogLevel:                  level,       // 日志级别
			IgnoreRecordNotFoundError: true,        // 忽略记录未找到错误
			Colorful:                  false,       // 禁用彩色输出
		},
	)

	dsn := config.GetDSN()
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: newLogger,
	})

	if err != nil {
		return err
	}

	// 获取通用数据库对象
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	// 设置连接池参数
	dbConfig := config.AppConfig.Database
	sqlDB.SetMaxIdleConns(dbConfig.MaxIdleConns)
	sqlDB.SetMaxOpenConns(dbConfig.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Duration(dbConfig.ConnMaxLifetime) * time.Second)

	return nil
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return DB
}

// CloseDB 关闭数据库连接
func CloseDB() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}

// Paginate 分页查询辅助函数
func Paginate(page, pageSize int) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if page <= 0 {
			page = 1
		}

		switch {
		case pageSize > 100:
			pageSize = 100
		case pageSize <= 0:
			pageSize = 10
		}

		offset := (page - 1) * pageSize
		return db.Offset(offset).Limit(pageSize)
	}
}
