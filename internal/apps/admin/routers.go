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
	"net/http"

	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/apps/project"
	"github.com/linux-do/cdk/internal/db"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

type projectResponse struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

type ListProjectsRequest struct {
	Current int                    `json:"current" form:"current" binding:"min=1"`
	Size    int                    `json:"size" form:"size" binding:"min=1,max=100"`
	Status  *project.ProjectStatus `json:"status" form:"status" binding:"omitempty,oneof=0 1 2"`
}

type ListProjectsResponse struct {
	ErrorMsg string                    `json:"error_msg"`
	Data     *ListProjectsResponseData `json:"data"`
}

// GetProjectsList 获取项目列表
// @Tags admin
// @Param request query ListProjectsRequest true "request query"
// @Produce json
// @Success 200 {object} ListProjectsResponse
// @Router /api/v1/admin/projects [get]
func GetProjectsList(c *gin.Context) {
	req := &ListProjectsRequest{}
	if err := c.ShouldBindQuery(req); err != nil {
		c.JSON(http.StatusBadRequest, ListProjectsResponse{ErrorMsg: err.Error()})
		return
	}
	offset := (req.Current - 1) * req.Size
	pagedData, err := QueryProjectsList(c.Request.Context(), offset, req.Size, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ListProjectsResponse{ErrorMsg: err.Error()})
		return
	}

	c.JSON(http.StatusOK, ListProjectsResponse{
		Data: pagedData,
	})
}

type ReviewProjectRequest struct {
	Status project.ProjectStatus `json:"status" binding:"oneof=0 1 2"`
}

type ReviewProjectResponse struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

// ReviewProject 审核项目
// @Tags admin
// @Accept json
// @Produce json
// @Param id path string true "项目ID"
// @Param project body ReviewProjectRequest true "项目信息"
// @Success 200 {object} ReviewProjectResponse
// @Router /api/v1/admin/projects/{id}/review [put]
func ReviewProject(c *gin.Context) {
	var req ReviewProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ReviewProjectResponse{ErrorMsg: err.Error()})
		return
	}

	p := &project.Project{}
	if err := p.Exact(db.DB(c.Request.Context()), c.Param("id"), false); err != nil {
		c.JSON(http.StatusNotFound, ReviewProjectResponse{ErrorMsg: err.Error()})
		return
	}

	updates := map[string]interface{}{
		"status": req.Status,
	}

	// 根据项目的状态更新项目
	switch req.Status {
	case project.ProjectStatusNormal:
		updates["report_count"] = 0
		if err := db.DB(c.Request.Context()).Model(p).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, ReviewProjectResponse{ErrorMsg: err.Error()})
			return
		}
	case project.ProjectStatusHidden:
		if err := db.DB(c.Request.Context()).Model(p).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, ReviewProjectResponse{ErrorMsg: err.Error()})
			return
		}
	case project.ProjectStatusViolation:
		if err := db.DB(c.Request.Context()).Transaction(
			func(tx *gorm.DB) error {
				if err := tx.Model(p).Updates(updates).Error; err != nil {
					return err
				}
				if err := tx.Model(&oauth.User{}).Where("id = ?", p.CreatorID).
					UpdateColumn("violation_count", gorm.Expr("violation_count + 1")).Error; err != nil {
					return err
				}
				return nil
			},
		); err != nil {
			c.JSON(http.StatusInternalServerError, ReviewProjectResponse{ErrorMsg: err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, ReviewProjectResponse{})
}

type listUsersRequest struct {
	Current       int               `json:"current" form:"current" binding:"min=1"`
	Size          int               `json:"size" form:"size" binding:"min=1,max=100"`
	Username      string            `json:"username" form:"username"`
	IsActive      *bool             `json:"is_active" form:"is_active"`
	TrustLevel    *oauth.TrustLevel `json:"trust_level" form:"trust_level" binding:"omitempty,oneof=0 1 2 3 4"`
	IsAdmin       *bool             `json:"is_admin" form:"is_admin"`
	MinViolations *uint8            `json:"min_violations" form:"min_violations"`
}

type listUsersResponse struct {
	ErrorMsg string `json:"error_msg"`
	Data     *struct {
		Total int64        `json:"total"`
		Users []oauth.User `json:"users"`
	} `json:"data"`
}

// ListUsers
// @Tags admin
// @Param request query listUsersRequest true "request query"
// @Produce json
// @Success 200 {object} listUsersResponse
// @Router /api/v1/admin/users [get]
func ListUsers(c *gin.Context) {
	req := &listUsersRequest{}
	if err := c.ShouldBindQuery(req); err != nil {
		c.JSON(http.StatusBadRequest, listUsersResponse{ErrorMsg: err.Error()})
		return
	}

	total, users, err := QueryUsersList(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, listUsersResponse{ErrorMsg: err.Error()})
		return
	}

	c.JSON(http.StatusOK, listUsersResponse{
		Data: &struct {
			Total int64        `json:"total"`
			Users []oauth.User `json:"users"`
		}{
			Total: total,
			Users: users,
		},
	})
}
