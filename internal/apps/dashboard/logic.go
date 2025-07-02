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
	UserGrowth      string `json:"userGrowth"`
	ActivityData    string `json:"activityData"`
	ProjectTags     string `json:"projectTags"`
	DistributeModes string `json:"distributeModes"`
	HotProjects     string `json:"hotProjects"`
	ActiveCreators  string `json:"activeCreators"`
	ActiveReceivers string `json:"activeReceivers"`
	//ApplyStatus     ApplyStatus      `json:"applyStatus"`
	Summary string `json:"summary"`
}

// GetAllDashboardData get all data for dashboard
func GetAllDashboardData(ctx context.Context, days int) (*map[string]interface{}, error) {
	// 构造缓存键名
	cacheKey := fmt.Sprintf("dashboard:data:%d", days)

	// 尝试从Redis获取缓存
	cachedData, redisErr := db.Redis.Get(ctx, cacheKey).Result()
	if redisErr == nil && cachedData != "" {
		// 缓存命中，解析JSON
		var result map[string]interface{}
		if err := json.Unmarshal([]byte(cachedData), &result); err == nil {
			return &result, nil
		}
	}

	// 调用存储过程获取仪表板数据
	query := "CALL get_dashboard_data(?,10)"

	var rawResult map[string]interface{}
	if err := db.DB(ctx).Raw(query, days).Scan(&rawResult).Error; err != nil {
		return nil, err
	}

	// 将结果存入Redis并设置过期时间
	if jsonData, err := json.Marshal(rawResult); err == nil {
		// 设置5分钟过期时间
		db.Redis.Set(ctx, cacheKey, string(jsonData), 5*time.Minute)
	}

	return &rawResult, nil
}
