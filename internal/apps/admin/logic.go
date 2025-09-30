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

package admin

import (
	"context"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/apps/project"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/utils"
)

type ListProjectsResponseDataResult struct {
	ID          string                `json:"id"`
	Username    string                `json:"username"`
	Nickname    string                `json:"nickname"`
	Description string                `json:"description"`
	Status      project.ProjectStatus `json:"status"`
	Tags        utils.StringArray     `json:"tags"`
}

type ListProjectsResponseData struct {
	Total   int64                             `json:"total"`
	Results *[]ListProjectsResponseDataResult `json:"results"`
}

// QueryProjectsList 获取项目列表
func QueryProjectsList(ctx context.Context, offset, limit int, status *project.ProjectStatus) (*ListProjectsResponseData, error) {
	var results []ListProjectsResponseDataResult
	query := `
		SELECT u.username, u.nickname, p.id, p.description, p.status, IF(COUNT(pt.tag) = 0, NULL, JSON_ARRAYAGG(pt.tag)) AS tags
		FROM users u
		INNER JOIN projects p ON u.id = p.creator_id AND
			CASE
				WHEN ? THEN p.status != ?
				ELSE p.status = ?
			END
		LEFT JOIN project_tags pt ON p.id = pt.project_id
		GROUP BY p.id
		LIMIT ? OFFSET ?
	`
	if err := db.DB(ctx).Raw(query, status == nil, project.ProjectStatusNormal, status, limit, offset).Scan(&results).Error; err != nil {
		return nil, err
	}

	var total int64
	countQuery := `
		SELECT COUNT(p.id)
		FROM users u
		INNER JOIN projects p ON u.id = p.creator_id AND
			CASE
				WHEN ? THEN p.status != ?
				ELSE p.status = ?
			END
	`
	if err := db.DB(ctx).Raw(countQuery, status == nil, project.ProjectStatusNormal, status).Count(&total).Error; err != nil {
		return nil, err
	}

	return &ListProjectsResponseData{
		Total:   total,
		Results: &results,
	}, nil
}

// QueryUsersList 获取用户列表
func QueryUsersList(ctx context.Context, req *listUsersRequest) (int64, []oauth.User, error) {
	offset := (req.Current - 1) * req.Size

	query := db.DB(ctx).Model(&oauth.User{})
	if req.Username != "" {
		query = query.Where("username LIKE ?", req.Username+"%")
	}
	if req.IsActive != nil {
		query = query.Where("is_active = ?", *req.IsActive)
	}
	if req.TrustLevel != nil {
		query = query.Where("trust_level = ?", *req.TrustLevel)
	}
	if req.IsAdmin != nil {
		query = query.Where("is_admin = ?", *req.IsAdmin)
	}
	if req.MinViolations != nil {
		query = query.Where("violation_count >= ?", *req.MinViolations)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return 0, nil, err
	}

	var users []oauth.User
	if err := query.Order("created_at DESC").Offset(offset).Limit(req.Size).Find(&users).Error; err != nil {
		return 0, nil, err
	}

	return total, users, nil
}
