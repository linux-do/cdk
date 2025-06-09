package project

import (
	"context"
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
func ListProjectsWithTags(ctx context.Context, offset, limit int) (*ProjectsPage, error) {
	now := time.Now()

	// 查询总数
	var total int64
	if err := db.DB(ctx).
		Raw(`SELECT COUNT(DISTINCT p.id) as total 
			FROM projects p 
			INNER JOIN project_items pi ON p.id = pi.project_id 
			WHERE pi.receiver_id IS NULL AND p.end_time > ?`, now).Count(&total).Error; err != nil {
		return nil, err
	}

	// 如果没有符合条件的项目，返回空结果
	if total == 0 {
		return &ProjectsPage{
			Total: 0,
			Items: []ProjectWithTags{},
		}, nil
	}

	// 查询项目列表及其标签
	var projectsWithTags []ProjectWithTags
	if err := db.DB(ctx).
		Raw(`SELECT 
				p.*,
				GROUP_CONCAT(DISTINCT pt.tag SEPARATOR ',') AS tags
			FROM projects p
			INNER JOIN project_items pi ON p.id = pi.project_id
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE pi.receiver_id IS NULL AND p.end_time > ?
			GROUP BY p.id
			LIMIT ? OFFSET ?`, now, limit, offset).
		Scan(&projectsWithTags).Error; err != nil {
		return nil, err
	}

	return &ProjectsPage{
		Total: total,
		Items: projectsWithTags,
	}, nil
}

// ListMyProjectsWithTags 查询我创建的项目列表及其标签
func ListMyProjectsWithTags(ctx context.Context, creatorID uint64, offset, limit int) (*ProjectsPage, error) {

	// 查询总数
	var total int64
	if err := db.DB(ctx).Model(&Project{}).Where("creator_id = ?", creatorID).Count(&total).Error; err != nil {
		return nil, err
	}

	// 如果没有符合条件的项目，返回空结果
	if total == 0 {
		return &ProjectsPage{
			Total: 0,
			Items: []ProjectWithTags{},
		}, nil
	}

	// 查询项目列表及其标签
	var projectsWithTags []ProjectWithTags
	if err := db.DB(ctx).
		Raw(`SELECT 
				p.*,
				GROUP_CONCAT(DISTINCT pt.tag SEPARATOR ',') AS tags
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.creator_id = ?
			GROUP BY p.id
			LIMIT ? OFFSET ?`, creatorID, limit, offset).
		Scan(&projectsWithTags).Error; err != nil {
		return nil, err
	}

	return &ProjectsPage{
		Total: total,
		Items: projectsWithTags,
	}, nil
}

// BuildListProjectsResponse 将ProjectsPage转换为ListProjectsResponseData
func BuildListProjectsResponse(page *ProjectsPage) ListProjectsResponseData {
	if page == nil {
		return ListProjectsResponseData{
			Total:   0,
			Results: []ListProjectsResponseDataResult{},
		}
	}

	results := make([]ListProjectsResponseDataResult, len(page.Items))

	if len(page.Items) == 0 {
		return ListProjectsResponseData{
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

	return ListProjectsResponseData{
		Total:   page.Total,
		Results: results,
	}
}
