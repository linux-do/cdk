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

package db

import (
	"context"
	"fmt"
	"log"
	"net"
	"strconv"
	"time"

	"github.com/linux-do/cdk/internal/config"
	"go.opentelemetry.io/otel/attribute"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/plugin/opentelemetry/tracing"
)

var (
	db *gorm.DB
)

func init() {
	if !config.Config.Database.Enabled {
		log.Println("[MySQL] is disabled, skipping MySQL initialization")
		return
	}

	var err error
	dbConfig := config.Config.Database

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.Config.Database.Username,
		config.Config.Database.Password,
		config.Config.Database.Host,
		config.Config.Database.Port,
		config.Config.Database.Database,
	)
	db, err = gorm.Open(
		mysql.Open(dsn),
		&gorm.Config{
			DisableForeignKeyConstraintWhenMigrating: true,
			Logger: &gormZapLogger{
				logLevel:                  parseLogLevel(config.Config.Database.LogLevel),
				slowThreshold:             config.Config.Database.SlowThreshold,
				ignoreRecordNotFoundError: config.Config.Database.IgnoreRecordNotFoundError,
			},
		},
	)
	if err != nil {
		log.Fatalf("[MySQL] init connection failed: %v\n", err)
	}

	// Trace 注入
	if err = db.Use(
		tracing.NewPlugin(
			tracing.WithoutMetrics(),
			tracing.WithAttributes(
				attribute.String("db.instance", dbConfig.Database),
				attribute.String("db.ip", dbConfig.Host),
				attribute.String("server.address", net.JoinHostPort(dbConfig.Host, strconv.Itoa(dbConfig.Port))),
				attribute.String("db.system", "mysql"),
			),
		),
	); err != nil {
		log.Fatalf("[MySQL] init trace failed: %v\n", err)
	}

	// 获取通用数据库对象
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[MySQL] load sql db failed: %v\n", err)
	}

	// 设置连接池参数
	sqlDB.SetMaxIdleConns(dbConfig.MaxIdleConn)
	sqlDB.SetMaxOpenConns(dbConfig.MaxOpenConn)
	sqlDB.SetConnMaxLifetime(time.Duration(dbConfig.ConnMaxLifetime) * time.Second)
}

func DB(ctx context.Context) *gorm.DB {
	return db.WithContext(ctx)
}
