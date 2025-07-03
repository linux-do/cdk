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

package dashboard

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/linux-do/cdk/internal/db"
)

// DashboardData 仪表板数据结构
type DashboardData struct {
	UserGrowth      string `json:"userGrowth"`      // 用户增长趋势数据
	ActivityData    string `json:"activityData"`    // 领取活动趋势数据
	ProjectTags     string `json:"projectTags"`     // 项目标签分布数据
	DistributeModes string `json:"distributeModes"` // 分发模式统计数据
	HotProjects     string `json:"hotProjects"`     // 热门项目数据
	ActiveCreators  string `json:"activeCreators"`  // 活跃创建者
	ActiveReceivers string `json:"activeReceivers"` // 活跃接收者
	//ApplyStatus     ApplyStatus      `json:"applyStatus"`
	Summary string `json:"summary"` // 总结数据，包括总用户数、新用户数、总项目数、总领取数、最近领取数数据
}

// 获取仪表板所有数据，带 Redis 缓存机制
func GetAllDashboardData(ctx context.Context, days int) (*map[string]interface{}, error) {
	// 构造缓存键名，格式：dashboard:data:{天数}
	cacheKey := fmt.Sprintf("dashboard:data:%d", days)

	// 尝试从 Redis 获取缓存数据
	cachedData, redisErr := db.Redis.Get(ctx, cacheKey).Result()
	if redisErr == nil && cachedData != "" {
		// 缓存命中，解析 JSON 数据
		var result map[string]interface{}
		if err := json.Unmarshal([]byte(cachedData), &result); err == nil {
			// 成功解析缓存数据，直接返回
			return &result, nil
		}
		// 如果JSON解析失败，继续执行数据库查询
	}

	// 缓存未命中或解析失败，调用 MySQL 存储过程获取仪表板数据
	// 存储过程参数：天数范围、返回记录数限制(10条)
	query := "CALL get_dashboard_data(?,10)"

	// 存储查询结果的变量
	var rawResult map[string]interface{}

	// 执行原生SQL查询，调用存储过程
	if err := db.DB(ctx).Raw(query, days).Scan(&rawResult).Error; err != nil {
		// 数据库查询失败，返回错误
		return nil, err
	}

	// 将查询结果缓存到 Redis 中，并设置过期时间
	if jsonData, err := json.Marshal(rawResult); err == nil {
		// JSON 序列化成功，存入 Redis 并设置5分钟过期时间
		// 这样可以减轻数据库压力，提高响应速度
		db.Redis.Set(ctx, cacheKey, string(jsonData), 5*time.Minute)
	}
	// 如果JSON序列化失败，只记录但不影响返回结果

	// 返回从数据库获取的原始结果
	return &rawResult, nil
}
