package dashboard

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/linux-do/cdk/internal/db"
	"time"
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

	query := fmt.Sprintf(`
SELECT 
  -- 用户增长
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'date', date_str,
        'value', count_val
      )
    )
    FROM (
      SELECT DATE_FORMAT(created_at, '%%m月%%d日') AS date_str, COUNT(*) AS count_val
      FROM users 
      WHERE created_at >= CURDATE() - INTERVAL %d DAY 
      GROUP BY DATE_FORMAT(created_at, '%%m月%%d日')
    ) AS tmp_user_growth
  ) AS userGrowth,

  -- 活跃数据
 (
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'date', date_str,
      'value', count_val
    )
  )
  FROM (
    SELECT DATE_FORMAT(received_at, '%%m月%%d日') AS date_str, COUNT(*) AS count_val
    FROM project_items 
    WHERE received_at >= CURDATE() - INTERVAL %d DAY 
    GROUP BY DATE_FORMAT(received_at, '%%m月%%d日')
  ) AS tmp_activity
) AS activityData,

  -- 项目标签
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT('name', tag, 'value', tag_count)
    )
    FROM (
      SELECT tag, COUNT(*) AS tag_count
      FROM project_tags
      GROUP BY tag
    ) AS tag_stats
  ) AS projectTags,

  -- 分发模式
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT('name', distribution_type, 'value', dist_count)
    )
    FROM (
      SELECT distribution_type, COUNT(*) AS dist_count
      FROM projects
      GROUP BY distribution_type
    ) AS dist_stats
  ) AS distributeModes,

  -- 热门项目
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT('name', name, 'tag', tag, 'receiveCount', receive_count)
    )
    FROM (
      SELECT p.name, JSON_ARRAYAGG(pt.tag) AS tag, COUNT(pi.id) AS receive_count
      FROM  projects p 
      JOIN project_items pi ON pi.project_id = p.id and pi.receiver_id IS NOT NULL
      LEFT JOIN project_tags pt ON pt.project_id = p.id
      GROUP BY p.id, p.name
      ORDER BY receive_count DESC
      LIMIT 5
    ) AS hot_stats
  ) AS hotProjects,

  -- 活跃创建者
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT('avatar', avatar_url, 'name', nickname, 'projectCount', project_count)
    )
    FROM (
      SELECT u.avatar_url, u.nickname, COUNT(p.id) AS project_count
      FROM projects p
      JOIN users u ON u.id = p.creator_id
      GROUP BY u.id, u.avatar_url, u.nickname
      ORDER BY project_count DESC
      LIMIT 5
    ) AS creator_stats
  ) AS activeCreators,

  -- 活跃领取者
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT('avatar', avatar_url, 'name', nickname, 'receiveCount', receive_count)
    )
    FROM (
      SELECT u.avatar_url, u.nickname, COUNT(pi.id) AS receive_count
      FROM project_items pi
      JOIN users u ON u.id = pi.receiver_id
      WHERE pi.receiver_id IS NOT NULL
      GROUP BY u.id, u.avatar_url, u.nickname
      ORDER BY receive_count DESC
      LIMIT 5
    ) AS receiver_stats
  ) AS activeReceivers,

  -- 汇总数据
  (
    SELECT JSON_OBJECT(
      'totalUsers', (SELECT COUNT(*) FROM users),
      'newUsers', (SELECT COUNT(*) FROM users WHERE created_at >= CURDATE() - INTERVAL %d DAY),
      'totalProjects', (SELECT COUNT(*) FROM projects),
      'totalReceived', (SELECT COUNT(*) FROM project_items WHERE received_at IS NOT NULL),
      'recentReceived', (SELECT COUNT(*) FROM project_items WHERE received_at >= CURDATE() - INTERVAL %d DAY)
    )
  ) AS summary;
`, days, days, days, days)

	var rawResult map[string]interface{}
	if err := db.DB(ctx).Raw(query).Scan(&rawResult).Error; err != nil {
		return nil, err
	}
	// 将结果存入Redis并设置过期时间
	if jsonData, err := json.Marshal(rawResult); err == nil {
		// 设置5分钟过期时间
		db.Redis.Set(ctx, cacheKey, string(jsonData), 5*time.Minute)
	}

	return &rawResult, nil
}
