package dashboard

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/linux-do/cdk/internal/db"
)

// DashboardData 仪表板数据结构
type DashboardData struct {
	UserGrowth      []DateValue      `json:"userGrowth"`
	ActivityData    []DateValue      `json:"activityData"`
	ProjectTags     []NameValue      `json:"projectTags"`
	DistributeModes []NameValue      `json:"distributeModes"`
	HotProjects     []ProjectInfo    `json:"hotProjects"`
	ActiveCreators  []CreatorInfo    `json:"activeCreators"`
	ActiveReceivers []ReceiverInfo   `json:"activeReceivers"`
	ApplyStatus     ApplyStatus      `json:"applyStatus"`
	Summary         DashboardSummary `json:"summary"`
}

// Scan 实现 sql.Scanner 接口
func (d *DashboardData) Scan(value interface{}) error {
	if value == nil {
		return errors.New("dashboard data cannot be nil")
	}

	// 将数据库返回的数据转换为字节数组
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("unsupported data type for DashboardData")
	}

	// 先解析为中间结构
	var result dbResult
	if err := json.Unmarshal(bytes, &result); err != nil {
		return err
	}

	// 依次解析各个字段
	if result.UserGrowth != nil {
		if err := json.Unmarshal(*result.UserGrowth, &d.UserGrowth); err != nil {
			return err
		}
	}

	if result.ActivityData != nil {
		if err := json.Unmarshal(*result.ActivityData, &d.ActivityData); err != nil {
			return err
		}
	}

	if result.ProjectTags != nil {
		if err := json.Unmarshal(*result.ProjectTags, &d.ProjectTags); err != nil {
			return err
		}
	}

	if result.DistributeModes != nil {
		if err := json.Unmarshal(*result.DistributeModes, &d.DistributeModes); err != nil {
			return err
		}
	}

	if result.HotProjects != nil {
		if err := json.Unmarshal(*result.HotProjects, &d.HotProjects); err != nil {
			return err
		}
	}

	if result.ActiveCreators != nil {
		if err := json.Unmarshal(*result.ActiveCreators, &d.ActiveCreators); err != nil {
			return err
		}
	}

	if result.ActiveReceivers != nil {
		if err := json.Unmarshal(*result.ActiveReceivers, &d.ActiveReceivers); err != nil {
			return err
		}
	}

	if result.Summary != nil {
		if err := json.Unmarshal(*result.Summary, &d.Summary); err != nil {
			return err
		}
	}

	return nil
}

// 实现 sql.Scanner 接口，用于处理数据库查询结果到结构体的映射
type dbResult struct {
	UserGrowth      *json.RawMessage `json:"userGrowth"`
	ActivityData    *json.RawMessage `json:"activityData"`
	ProjectTags     *json.RawMessage `json:"projectTags"`
	DistributeModes *json.RawMessage `json:"distributeModes"`
	HotProjects     *json.RawMessage `json:"hotProjects"`
	ActiveCreators  *json.RawMessage `json:"activeCreators"`
	ActiveReceivers *json.RawMessage `json:"activeReceivers"`
	Summary         *json.RawMessage `json:"summary"`
}

// DateValue 日期-数值数据结构
type DateValue struct {
	Date  string `json:"date"`
	Value int    `json:"value"`
}

// NameValue 名称-数值数据结构
type NameValue struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
}

// ProjectInfo 项目信息
type ProjectInfo struct {
	Name         string `json:"name"`
	Tag          string `json:"tag"`
	ReceiveCount int    `json:"receiveCount"`
}

// CreatorInfo 创作者信息
type CreatorInfo struct {
	Avatar       string `json:"avatar"`
	Name         string `json:"name"`
	ProjectCount int    `json:"projectCount"`
}

// ReceiverInfo 接收者信息
type ReceiverInfo struct {
	Avatar       string `json:"avatar"`
	Name         string `json:"name"`
	ReceiveCount int    `json:"receiveCount"`
}

// ApplyStatus 申请状态
type ApplyStatus struct {
	Total    int `json:"total"`
	Pending  int `json:"pending"`
	Approved int `json:"approved"`
	Rejected int `json:"rejected"`
}

// DashboardSummary 仪表板摘要
type DashboardSummary struct {
	TotalUsers     int    `json:"totalUsers"`
	NewUsers       int    `json:"newUsers"`
	ActiveProjects int    `json:"activeProjects"`
	TotalProjects  int    `json:"totalProjects"`
	TotalReceived  int    `json:"totalReceived"`
	RecentReceived int    `json:"recentReceived"`
	SuccessRate    string `json:"successRate"`
}

// GetAllDashboardData get all data for dashboard
func GetAllDashboardData(ctx context.Context, days int) (*DashboardData, error) {
	query := fmt.Sprintf(`
SELECT 
  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('date', date_str, 'value', count_val))
    FROM (
      SELECT DATE_FORMAT(created_at, '%%m月%%d日') AS date_str, COUNT(*) AS count_val
      FROM users 
      WHERE created_at >= CURDATE() - INTERVAL %d DAY 
      GROUP BY DATE_FORMAT(created_at, '%%m月%%d日')
    ) AS tmp_user_growth
  ) AS userGrowth,

  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('date', date_str, 'value', count_val))
    FROM (
      SELECT DATE_FORMAT(received_at, '%%m月%%d日') AS date_str, COUNT(*) AS count_val
      FROM project_items 
      WHERE received_at >= CURDATE() - INTERVAL %d DAY 
      GROUP BY DATE_FORMAT(received_at, '%%m月%%d日')
    ) AS tmp_activity
  ) AS activityData,

  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('name', tag, 'value', tag_count))
    FROM (
      SELECT tag, COUNT(*) AS tag_count
      FROM project_tags
      GROUP BY tag
    ) AS tag_stats
  ) AS projectTags,

  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('name', distribution_type, 'value', dist_count))
    FROM (
      SELECT distribution_type, COUNT(*) AS dist_count
      FROM projects
      GROUP BY distribution_type
    ) AS dist_stats
  ) AS distributeModes,

  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('name', name, 'tag', tag, 'receiveCount', receive_count))
    FROM (
      SELECT p.name, JSON_ARRAYAGG(pt.tag) AS tag, COUNT(pi.id) AS receive_count
      FROM  projects p 
      JOIN project_items pi ON pi.project_id = p.id AND pi.receiver_id IS NOT NULL
      LEFT JOIN project_tags pt ON pt.project_id = p.id
      GROUP BY p.id, p.name
      ORDER BY receive_count DESC
      LIMIT 5
    ) AS hot_stats
  ) AS hotProjects,

  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('avatar', avatar_url, 'name', nickname, 'projectCount', project_count))
    FROM (
      SELECT u.avatar_url, u.nickname, COUNT(p.id) AS project_count
      FROM projects p
      JOIN users u ON u.id = p.creator_id
      GROUP BY u.id, u.avatar_url, u.nickname
      ORDER BY project_count DESC
      LIMIT 5
    ) AS creator_stats
  ) AS activeCreators,

  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT('avatar', avatar_url, 'name', nickname, 'receiveCount', receive_count))
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

  (
    SELECT JSON_OBJECT(
      'totalUsers', (SELECT COUNT(*) FROM users),
      'newUsers', (SELECT COUNT(*) FROM users WHERE created_at >= CURDATE() - INTERVAL %d DAY),
      'activeProjects', (SELECT COUNT(*) FROM projects WHERE is_completed = false),
      'totalProjects', (SELECT COUNT(*) FROM projects),
      'totalReceived', (SELECT COUNT(*) FROM project_items WHERE received_at IS NOT NULL),
      'recentReceived', (SELECT COUNT(*) FROM project_items WHERE received_at >= CURDATE() - INTERVAL %d DAY),
      'successRate', CONCAT(ROUND(
        IFNULL((SELECT COUNT(*) FROM project_items WHERE received_at IS NOT NULL) / 
               NULLIF((SELECT COUNT(*) FROM project_items), 0) * 100, 0), 1), '%%'
      )
    )
  ) AS summary;
`, days, days, days, days)

	var result DashboardData
	if err := db.DB(ctx).Raw(query).Scan(&result).Error; err != nil {
		return nil, err
	}
	return &result, nil
}
