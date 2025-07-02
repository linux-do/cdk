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
	"time"

	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
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
				IF(COUNT(pt.tag) = 0, NULL, JSON_ARRAYAGG(pt.tag)) AS tags
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
			Results: nil,
		}, nil
	}
	// 查询项目列表及其标签
	getProjectWithTagsSql += ` GROUP BY p.id ORDER BY p.end_time ASC LIMIT ? OFFSET ?`
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
func ListMyProjectsWithTags(ctx context.Context, creatorID uint64, offset, limit int, tags []string) (*ListProjectsResponseData, error) {
	getTotalCountSql := `SELECT COUNT(DISTINCT p.id) as total
			FROM projects p
			LEFT JOIN project_tags pt ON p.id = pt.project_id
			WHERE p.creator_id = ?`

	getMyProjectWithTagsSql := `SELECT 
				p.id,p.name,p.description,p.distribution_type,p.total_items,
				p.start_time,p.end_time,p.minimum_trust_level,p.allow_same_ip,p.risk_level,p.created_at,
				IF(COUNT(pt.tag) = 0, NULL, JSON_ARRAYAGG(pt.tag)) AS tags
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
			Results: nil,
		}, nil
	}

	// 查询项目列表及其标签
	getMyProjectWithTagsSql += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
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
