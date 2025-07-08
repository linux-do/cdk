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

package project

import (
	"context"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
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
func ListProjectsWithTags(ctx context.Context, offset, limit int, tags []string, currentUser *oauth.User, req *ListProjectsRequest) (*ListProjectsResponseData, error) {
	now := time.Now()

	getTotalCountSql := `SELECT COUNT(DISTINCT p.id) as total
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.end_time > ? AND p.is_completed = false AND p.status = ? AND p.minimum_trust_level <= ? AND p.risk_level >= ? AND p.hide_from_explore = false AND NOT EXISTS ( SELECT 1 FROM project_items pi WHERE pi.project_id = p.id AND pi.receiver_id = ?)`

	getProjectWithTagsSql := `SELECT 
    			p.id,p.name,p.description,p.distribution_type,p.total_items,
       			p.start_time,p.end_time,p.minimum_trust_level,p.allow_same_ip,p.risk_level,p.created_at,
				IF(COUNT(pt.tag) = 0, NULL, JSON_ARRAYAGG(pt.tag)) AS tags
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.end_time > ? AND p.is_completed = false AND p.status = ? AND p.minimum_trust_level <= ? AND p.risk_level >= ? AND p.hide_from_explore = false AND NOT EXISTS ( SELECT 1 FROM project_items pi WHERE pi.project_id = p.id AND pi.receiver_id = ?)`

	var parameters = []interface{}{now, ProjectStatusNormal, currentUser.TrustLevel, currentUser.RiskLevel(), currentUser.ID}

	// 添加标签筛选
	if len(tags) > 0 {
		getTotalCountSql += ` AND pt.tag IN (?)`
		getProjectWithTagsSql += ` AND pt.tag IN (?)`
		parameters = append(parameters, tags)
	}

	// 添加信任等级范围筛选
	if req != nil && req.MinTrustLevel >= 0 {
		getTotalCountSql += ` AND p.minimum_trust_level >= ?`
		getProjectWithTagsSql += ` AND p.minimum_trust_level >= ?`
		parameters = append(parameters, req.MinTrustLevel)
	}
	if req != nil && req.MaxTrustLevel >= 0 {
		getTotalCountSql += ` AND p.minimum_trust_level <= ?`
		getProjectWithTagsSql += ` AND p.minimum_trust_level <= ?`
		parameters = append(parameters, req.MaxTrustLevel)
	}

	// 添加项目总数量范围筛选
	if req != nil && req.MinTotalItems > 0 {
		getTotalCountSql += ` AND p.total_items >= ?`
		getProjectWithTagsSql += ` AND p.total_items >= ?`
		parameters = append(parameters, req.MinTotalItems)
	}
	if req != nil && req.MaxTotalItems > 0 {
		getTotalCountSql += ` AND p.total_items <= ?`
		getProjectWithTagsSql += ` AND p.total_items <= ?`
		parameters = append(parameters, req.MaxTotalItems)
	}

	// 添加开始时间范围筛选
	if req != nil && req.StartTimeFrom != "" {
		startTimeFrom, err := time.Parse(time.RFC3339, req.StartTimeFrom)
		if err == nil {
			getTotalCountSql += ` AND p.start_time >= ?`
			getProjectWithTagsSql += ` AND p.start_time >= ?`
			parameters = append(parameters, startTimeFrom)
		}
	}
	if req != nil && req.StartTimeTo != "" {
		startTimeTo, err := time.Parse(time.RFC3339, req.StartTimeTo)
		if err == nil {
			getTotalCountSql += ` AND p.start_time <= ?`
			getProjectWithTagsSql += ` AND p.start_time <= ?`
			parameters = append(parameters, startTimeTo)
		}
	}

	// 添加结束时间范围筛选
	if req != nil && req.EndTimeFrom != "" {
		endTimeFrom, err := time.Parse(time.RFC3339, req.EndTimeFrom)
		if err == nil {
			getTotalCountSql += ` AND p.end_time >= ?`
			getProjectWithTagsSql += ` AND p.end_time >= ?`
			parameters = append(parameters, endTimeFrom)
		}
	}
	if req != nil && req.EndTimeTo != "" {
		endTimeTo, err := time.Parse(time.RFC3339, req.EndTimeTo)
		if err == nil {
			getTotalCountSql += ` AND p.end_time <= ?`
			getProjectWithTagsSql += ` AND p.end_time <= ?`
			parameters = append(parameters, endTimeTo)
		}
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
			Results: nil,
		}, nil
	}

	// 添加排序
	sortField := "p.end_time"
	sortDirection := "ASC"

	if req != nil && req.SortBy != "" {
		switch req.SortBy {
		case "trust_level":
			sortField = "p.minimum_trust_level"
		case "total_items":
			sortField = "p.total_items"
		case "start_time":
			sortField = "p.start_time"
		case "end_time":
			sortField = "p.end_time"
		case "created_at":
			sortField = "p.created_at"
		}

		if req.SortOrder == "desc" {
			sortDirection = "DESC"
		}
	}

	// 查询项目列表及其标签
	getProjectWithTagsSql += ` GROUP BY p.id ORDER BY ` + sortField + ` ` + sortDirection + ` LIMIT ? OFFSET ?`
	parameters = append(parameters, limit, offset)
	var listProjectsResponseDataResult []ListProjectsResponseDataResult
	if err := db.DB(ctx).
		Raw(getProjectWithTagsSql, parameters...).
		Scan(&listProjectsResponseDataResult).Error; err != nil {
		return nil, err
	}

	return &ListProjectsResponseData{
		Total:   total,
		Results: &listProjectsResponseDataResult,
	}, nil
}

// ListMyProjectsWithTags 查询我创建的项目列表及其标签
func ListMyProjectsWithTags(ctx context.Context, creatorID uint64, offset, limit int, tags []string, req *ListProjectsRequest) (*ListProjectsResponseData, error) {
	getTotalCountSql := `SELECT COUNT(DISTINCT p.id) as total
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.creator_id = ? AND p.status = ?`

	getMyProjectWithTagsSql := `SELECT 
				p.id,p.name,p.description,p.distribution_type,p.total_items,
				p.start_time,p.end_time,p.minimum_trust_level,p.allow_same_ip,p.risk_level,p.created_at,
				IF(COUNT(pt.tag) = 0, NULL, JSON_ARRAYAGG(pt.tag)) AS tags
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.creator_id = ? AND p.status = ?`

	var parameters = []interface{}{creatorID, ProjectStatusNormal}

	// 添加标签筛选
	if len(tags) > 0 {
		getTotalCountSql += ` AND pt.tag IN (?)`
		getMyProjectWithTagsSql += ` AND pt.tag IN (?)`
		parameters = append(parameters, tags)
	}

	// 添加信任等级范围筛选
	if req != nil && req.MinTrustLevel >= 0 {
		getTotalCountSql += ` AND p.minimum_trust_level >= ?`
		getMyProjectWithTagsSql += ` AND p.minimum_trust_level >= ?`
		parameters = append(parameters, req.MinTrustLevel)
	}
	if req != nil && req.MaxTrustLevel >= 0 {
		getTotalCountSql += ` AND p.minimum_trust_level <= ?`
		getMyProjectWithTagsSql += ` AND p.minimum_trust_level <= ?`
		parameters = append(parameters, req.MaxTrustLevel)
	}

	// 添加项目总数量范围筛选
	if req != nil && req.MinTotalItems > 0 {
		getTotalCountSql += ` AND p.total_items >= ?`
		getMyProjectWithTagsSql += ` AND p.total_items >= ?`
		parameters = append(parameters, req.MinTotalItems)
	}
	if req != nil && req.MaxTotalItems > 0 {
		getTotalCountSql += ` AND p.total_items <= ?`
		getMyProjectWithTagsSql += ` AND p.total_items <= ?`
		parameters = append(parameters, req.MaxTotalItems)
	}

	// 添加开始时间范围筛选
	if req != nil && req.StartTimeFrom != "" {
		startTimeFrom, err := time.Parse(time.RFC3339, req.StartTimeFrom)
		if err == nil {
			getTotalCountSql += ` AND p.start_time >= ?`
			getMyProjectWithTagsSql += ` AND p.start_time >= ?`
			parameters = append(parameters, startTimeFrom)
		}
	}
	if req != nil && req.StartTimeTo != "" {
		startTimeTo, err := time.Parse(time.RFC3339, req.StartTimeTo)
		if err == nil {
			getTotalCountSql += ` AND p.start_time <= ?`
			getMyProjectWithTagsSql += ` AND p.start_time <= ?`
			parameters = append(parameters, startTimeTo)
		}
	}

	// 添加结束时间范围筛选
	if req != nil && req.EndTimeFrom != "" {
		endTimeFrom, err := time.Parse(time.RFC3339, req.EndTimeFrom)
		if err == nil {
			getTotalCountSql += ` AND p.end_time >= ?`
			getMyProjectWithTagsSql += ` AND p.end_time >= ?`
			parameters = append(parameters, endTimeFrom)
		}
	}
	if req != nil && req.EndTimeTo != "" {
		endTimeTo, err := time.Parse(time.RFC3339, req.EndTimeTo)
		if err == nil {
			getTotalCountSql += ` AND p.end_time <= ?`
			getMyProjectWithTagsSql += ` AND p.end_time <= ?`
			parameters = append(parameters, endTimeTo)
		}
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
			Results: nil,
		}, nil
	}

	// 添加排序
	sortField := "p.created_at"
	sortDirection := "DESC"

	if req != nil && req.SortBy != "" {
		switch req.SortBy {
		case "trust_level":
			sortField = "p.minimum_trust_level"
		case "total_items":
			sortField = "p.total_items"
		case "start_time":
			sortField = "p.start_time"
		case "end_time":
			sortField = "p.end_time"
		case "created_at":
			sortField = "p.created_at"
		}

		if req.SortOrder != "" {
			if req.SortOrder == "asc" {
				sortDirection = "ASC"
			} else {
				sortDirection = "DESC"
			}
		}
	}

	// 查询项目列表及其标签
	getMyProjectWithTagsSql += ` GROUP BY p.id ORDER BY ` + sortField + ` ` + sortDirection + ` LIMIT ? OFFSET ?`
	parameters = append(parameters, limit, offset)
	var listProjectsResponseDataResult []ListProjectsResponseDataResult
	if err := db.DB(ctx).
		Raw(getMyProjectWithTagsSql, parameters...).Scan(&listProjectsResponseDataResult).Error; err != nil {
		return nil, err
	}

	return &ListProjectsResponseData{
		Total:   total,
		Results: &listProjectsResponseDataResult,
	}, nil
}
