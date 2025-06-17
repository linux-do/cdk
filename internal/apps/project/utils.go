package project

import (
	"context"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
	"strings"
	"sync"
	"time"
)

// ProjectWithTags 返回项目及其标签
type ProjectWithTags struct {
	Project
	Tags string `gorm:"column:tags"`
}

// ProjectsPage 返回分页的项目列表及其标签
type ProjectsPage struct {
	Total int64
	Items []ProjectWithTags
}

// ListProjectsWithTags 查询未结束的项目列表及其标签
func ListProjectsWithTags(ctx context.Context, offset, limit int, tags []string, currentUser *oauth.User) (*ListProjectsResponseData, error) {
	now := time.Now()

	getTotalCountSql := `SELECT COUNT(DISTINCT p.id) as total
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.end_time > ? AND p.is_completed = false AND p.minimum_trust_level <= ? AND p.risk_level >= ? AND NOT EXISTS ( SELECT 1 FROM project_items pi WHERE pi.project_id = p.id AND pi.receiver_id = ?)`

	getProjectWithTagsSql := `SELECT 
    			p.id,p.name,p.description,p.distribution_type,p.total_items,
       			p.start_time,p.end_time,p.minimum_trust_level,p.allow_same_ip,p.risk_level,p.created_at,
				GROUP_CONCAT(DISTINCT pt.tag SEPARATOR ',') AS tags
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.end_time > ? AND p.is_completed = false AND p.minimum_trust_level <= ? AND p.risk_level >= ? AND NOT EXISTS ( SELECT 1 FROM project_items pi WHERE pi.project_id = p.id AND pi.receiver_id = ?)`

	var parameters = []interface{}{now, currentUser.TrustLevel, currentUser.RiskLevel(), currentUser.ID}
	if len(tags) > 0 {
		getTotalCountSql += ` AND pt.tag IN (?)`
		getProjectWithTagsSql += ` AND pt.tag IN (?)`
		parameters = append(parameters, tags)
	}
	// 查询总数
	var total int64
	if err := db.DB(ctx).
		Raw(getTotalCountSql, parameters...).Count(&total).Error; err != nil {
		return nil, err
	}

	// 如果没有符合条件的项目，返回空结果
	if total == 0 {
		return &ListProjectsResponseData{
			Total:   0,
			Results: []ListProjectsResponseDataResult{},
		}, nil
	}
	// 查询项目列表及其标签
	getProjectWithTagsSql += ` GROUP BY p.id ORDER BY p.end_time ASC LIMIT ? OFFSET ?`
	parameters = append(parameters, limit, offset)
	var projectsWithTags []ProjectWithTags
	if err := db.DB(ctx).
		Raw(getProjectWithTagsSql, parameters...).
		Scan(&projectsWithTags).Error; err != nil {
		return nil, err
	}

	return BuildListProjectsResponse(&ProjectsPage{
		Total: total,
		Items: projectsWithTags,
	}), nil
}

// ListMyProjectsWithTags 查询我创建的项目列表及其标签
func ListMyProjectsWithTags(ctx context.Context, creatorID uint64, offset, limit int, tags []string) (*ListProjectsResponseData, error) {
	getTotalCountSql := `SELECT COUNT(DISTINCT p.id) as total
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.creator_id = ?`

	getMyProjectWithTagsSql := `SELECT 
				p.id,p.name,p.description,p.distribution_type,p.total_items,
				p.start_time,p.end_time,p.minimum_trust_level,p.allow_same_ip,p.risk_level,p.created_at,
				GROUP_CONCAT(DISTINCT pt.tag SEPARATOR ',') AS tags
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.creator_id = ?`

	var parameters = []interface{}{creatorID}

	if len(tags) > 0 {
		getTotalCountSql += ` AND pt.tag IN (?)`
		getMyProjectWithTagsSql += ` AND pt.tag IN (?)`
		parameters = append(parameters, tags)
	}

	// 查询总数
	var total int64
	if err := db.DB(ctx).Raw(getTotalCountSql, parameters...).Count(&total).Error; err != nil {
		return nil, err
	}

	// 如果没有符合条件的项目，返回空结果
	if total == 0 {
		return &ListProjectsResponseData{
			Total:   0,
			Results: []ListProjectsResponseDataResult{},
		}, nil
	}

	// 查询项目列表及其标签
	getMyProjectWithTagsSql += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
	parameters = append(parameters, limit, offset)
	var projectsWithTags []ProjectWithTags
	if err := db.DB(ctx).
		Raw(getMyProjectWithTagsSql, parameters...).Scan(&projectsWithTags).Error; err != nil {
		return nil, err
	}

	return BuildListProjectsResponse(&ProjectsPage{
		Total: total,
		Items: projectsWithTags,
	}), nil
}

// BuildListProjectsResponse 将ProjectsPage转换为ListProjectsResponseData
func BuildListProjectsResponse(page *ProjectsPage) *ListProjectsResponseData {
	if page == nil {
		return &ListProjectsResponseData{
			Total:   0,
			Results: []ListProjectsResponseDataResult{},
		}
	}

	results := make([]ListProjectsResponseDataResult, len(page.Items))

	if len(page.Items) == 0 {
		return &ListProjectsResponseData{
			Total:   page.Total,
			Results: results,
		}
	}

	var wg sync.WaitGroup
	wg.Add(len(page.Items))

	// 处理每个项目
	for i, project := range page.Items {
		go func(idx int, proj ProjectWithTags) {
			defer wg.Done()

			// 解析标签
			var tags []string
			if proj.Tags != "" {
				tags = strings.Split(proj.Tags, ",")
			}

			results[idx] = ListProjectsResponseDataResult{
				ID:                proj.ID,
				Name:              proj.Name,
				Description:       proj.Description,
				DistributionType:  proj.DistributionType,
				TotalItems:        proj.TotalItems,
				StartTime:         proj.StartTime,
				EndTime:           proj.EndTime,
				MinimumTrustLevel: proj.MinimumTrustLevel,
				AllowSameIP:       proj.AllowSameIP,
				RiskLevel:         proj.RiskLevel,
				Tags:              tags,
				CreatedAt:         proj.CreatedAt,
			}
		}(i, project)
	}

	wg.Wait()

	return &ListProjectsResponseData{
		Total:   page.Total,
		Results: results,
	}
}
