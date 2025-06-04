package project

import (
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
	"net/http"
	"strings"
	"time"
)

type projectResponse struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

type RequestBody struct {
	Name              string           `json:"name" binding:"required,max=32"`
	Description       string           `json:"description" binding:"required,max=1024"`
	DistributionType  DistributionType `json:"distribution_type" binding:"oneof=0 1"`
	ProjectTags       []string         `json:"project_tags" binding:"required,dive,max=16"`
	StartTime         time.Time        `json:"start_time" binding:"required" time_format:"2006-01-02 15:04:05"`
	EndTime           time.Time        `json:"end_time" binding:"required,gtfield=StartTime" time_format:"2006-01-02 15:04:05"`
	MinimumTrustLevel oauth.TrustLevel `json:"minimum_trust_level" binding:"oneof=0 1 2 3 4"`
	AllowSameIP       bool             `json:"allow_same_ip"`
	RiskLevel         uint8            `json:"risk_level" binding:"min=0,max=100"`
}

type CreateProjectRequestBody struct {
	RequestBody
	ProjectItemsContent []string `json:"project_items_content" binding:"required,min=1,dive,min=1,max=1024"`
}

// CreateProject 创建项目API
// @Summary 创建项目
// @Description 创建新项目，并将项目子项(待分发的Key)存入Redis List
// @Tags 项目管理
// @Accept json
// @Produce json
// @Param project body CreateProjectRequestBody true "项目信息"
// @Success 200 {object} projectResponse
// @Router /api/v1/project [post]
func CreateProject(c *gin.Context) {
	var req CreateProjectRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, projectResponse{err.Error(), nil})
		return
	}
	if !req.EndTime.After(time.Now()) {
		c.JSON(http.StatusBadRequest, projectResponse{"结束时间必须在当前时间之后", nil})
		return
	}

	// 获取当前用户ID
	userID := c.GetUint64(oauth.UserIDKey)

	// 创建项目
	projectID := uuid.New().String()
	project := Project{
		ID:                projectID,
		Name:              req.Name,
		Description:       req.Description,
		DistributionType:  req.DistributionType,
		TotalItems:        int64(len(req.ProjectItemsContent)),
		StartTime:         req.StartTime,
		EndTime:           req.EndTime,
		MinimumTrustLevel: req.MinimumTrustLevel,
		AllowSameIP:       req.AllowSameIP,
		RiskLevel:         req.RiskLevel,
		CreatorID:         userID,
	}

	tx := db.DB.Begin()
	if err := tx.Create(&project).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"创建项目失败：" + err.Error(), nil})
		return
	}

	projectTagsCount := len(req.ProjectTags)
	if projectTagsCount > 0 {
		projectTags := make([]ProjectTag, 0, projectTagsCount)
		for _, tag := range req.ProjectTags {
			projectTags = append(projectTags, ProjectTag{
				ProjectID: projectID,
				Tag:       tag,
			})
		}
		if err := tx.Create(&projectTags).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, projectResponse{"创建项目失败: " + err.Error(), nil})
			return
		}
	}

	projectItems := make([]ProjectItem, 0, len(req.ProjectItemsContent))
	for _, content := range req.ProjectItemsContent {
		projectItems = append(projectItems, ProjectItem{
			ProjectID: projectID,
			Content:   content,
		})
	}
	if err := tx.Create(&projectItems).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"创建项目失败: " + err.Error(), nil})
		return
	}
	ctx := context.Background()
	redisKey := fmt.Sprintf(RedisProjectItemsKeyPrefix, projectID)

	items := make([]interface{}, len(req.ProjectItemsContent))
	for i, content := range req.ProjectItemsContent {
		items[i] = content
	}
	if err := db.Redis.RPush(ctx, redisKey, items...).Err(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"创建项目失败: " + err.Error(), nil})
		return
	}
	db.Redis.Expire(ctx, redisKey, time.Until(req.EndTime))

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, projectResponse{"创建项目失败: " + err.Error(), nil})
		return
	}

	c.JSON(http.StatusOK, projectResponse{})
}

type UpdateProjectRequestBody struct {
	RequestBody
	UpdateProjectItems []struct {
		ID      uint64 `json:"id" binding:"gte=0"`
		Content string `json:"content" binding:"max=1024"`
	} `json:"update_project_items" binding:"dive"`
	AddProjectItemsContent []string `json:"add_project_items_content" binding:"dive,min=1,max=1024"`
}

// UpdateProject 编辑项目API
// @Summary 编辑项目
// @Description 编辑现有项目信息
// @Tags 项目管理
// @Accept json
// @Produce json
// @Param id path string true "项目ID"
// @Param project body UpdateProjectRequestBody true "项目信息"
// @Success 200 {object} projectResponse
// @Router /api/v1/project/{id} [put]
func UpdateProject(c *gin.Context) {
	projectID := c.Param("id")
	_, errParse := uuid.Parse(projectID)
	if len(strings.TrimSpace(projectID)) == 0 || errParse != nil {
		c.JSON(http.StatusBadRequest, projectResponse{"参数无效", nil})
		return
	}

	var req UpdateProjectRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, projectResponse{err.Error(), nil})
		return
	}

	if !req.EndTime.After(time.Now()) {
		c.JSON(http.StatusBadRequest, projectResponse{"结束时间必须在当前时间之后", nil})
		return
	}

	// 获取当前用户ID
	userID := c.GetUint64(oauth.UserIDKey)

	var project Project
	if err := db.DB.Where("id = ? AND creator_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, projectResponse{"项目不存在", nil})
		return
	}

	UpdateProjectItemCount := int64(len(req.UpdateProjectItems))
	if UpdateProjectItemCount > 0 {
		// 验证项目项ID是否都属于该项目
		var projectItemIDs []uint64
		for _, item := range req.UpdateProjectItems {
			projectItemIDs = append(projectItemIDs, item.ID)
		}

		var count int64
		if err := db.DB.Model(&ProjectItem{}).Where("id IN ? AND project_id = ?", projectItemIDs, projectID).Count(&count).Error; err != nil {
			c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
			return
		}

		if count != UpdateProjectItemCount {
			c.JSON(http.StatusBadRequest, projectResponse{"更新项目失败", nil})
			return
		}
	}

	tx := db.DB.Begin()
	projectTagsCount := len(req.ProjectTags)
	if projectTagsCount > 0 {
		if err := tx.Where("project_id = ?", projectID).Delete(&ProjectTag{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
			return
		}

		projectTags := make([]ProjectTag, 0, projectTagsCount)
		for _, tag := range req.ProjectTags {
			projectTags = append(projectTags, ProjectTag{
				ProjectID: projectID,
				Tag:       tag,
			})
		}
		if err := tx.Create(&projectTags).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
			return
		}
	}

	if UpdateProjectItemCount > 0 {
		var (
			ids      []uint64
			caseStmt strings.Builder
			params   []interface{}
		)
		caseStmt.WriteString("CASE id ")
		for _, item := range req.UpdateProjectItems {
			ids = append(ids, item.ID)
			caseStmt.WriteString("WHEN ? THEN ? ")
			params = append(params, item.ID, item.Content)
		}
		caseStmt.WriteString("ELSE content END")
		params = append([]interface{}{}, params...)
		params = append(params, ids)

		sql := fmt.Sprintf("UPDATE project_items SET content = %s WHERE id IN ?", caseStmt.String())
		if err := tx.Exec(sql, params...).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
			return
		}
	}

	AddProjectItemsContent := len(req.AddProjectItemsContent)
	if AddProjectItemsContent > 0 {
		// 添加新的项目项
		newProjectItems := make([]ProjectItem, 0, AddProjectItemsContent)
		for _, content := range req.AddProjectItemsContent {
			newProjectItems = append(newProjectItems, ProjectItem{
				ProjectID: projectID,
				Content:   content,
			})
		}
		if err := tx.Create(&newProjectItems).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
			return
		}
	}

	var totalItems int64
	if err := tx.Model(&ProjectItem{}).Where("project_id = ?", projectID).Count(&totalItems).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
		return
	}
	// 更新项目信息
	project.Name = req.Name
	project.Description = req.Description
	project.DistributionType = req.DistributionType
	project.TotalItems = totalItems
	project.MinimumTrustLevel = req.MinimumTrustLevel
	project.AllowSameIP = req.AllowSameIP
	project.RiskLevel = req.RiskLevel
	project.StartTime = req.StartTime
	project.EndTime = req.EndTime
	if err := tx.Save(&project).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
		return
	}

	// 更新Redis数据
	ctx := context.Background()
	redisKey := fmt.Sprintf(RedisProjectItemsKeyPrefix, projectID)
	// 删除旧的Redis数据
	if err := db.Redis.Del(ctx, redisKey).Err(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
		return
	}
	// 查询未领取的项目项内容
	var contentList []string
	if err := tx.Model(&ProjectItem{}).
		Select("content").
		Where("project_id = ? AND receiver_id IS NULL", projectID).
		Pluck("content", &contentList).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
		return
	}
	items := make([]interface{}, len(contentList))
	for i, content := range contentList {
		items[i] = content
	}
	if err := db.Redis.RPush(ctx, redisKey, items...).Err(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
		return
	}
	db.Redis.Expire(ctx, redisKey, time.Until(req.EndTime))

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
		return
	}

	c.JSON(http.StatusOK, projectResponse{})
}

// DeleteProject 删除项目API
// @Summary 删除项目
// @Description 删除项目(已领取的发放不允许删除)
// @Tags 项目管理
// @Accept json
// @Produce json
// @Param id path string true "项目ID"
// @Success 200 {object} projectResponse
// @Router /api/v1/project/{id} [delete]
func DeleteProject(c *gin.Context) {
	projectID := c.Param("id")
	_, errParse := uuid.Parse(projectID)
	if len(strings.TrimSpace(projectID)) == 0 || errParse != nil {
		c.JSON(http.StatusBadRequest, projectResponse{"参数无效", nil})
		return
	}

	// 获取当前用户ID
	userID := c.GetUint64(oauth.UserIDKey)

	// 查找项目
	var project Project
	if err := db.DB.Where("id = ? AND creator_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, projectResponse{"项目不存在", nil})
		return
	}

	// 检查是否已有领取记录
	var count int64
	if err := db.DB.Model(&ProjectItem{}).Where("project_id = ? AND receiver_id IS NOT NULL", projectID).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, projectResponse{"删除项目失败: " + err.Error(), nil})
		return
	}

	if count > 0 {
		c.JSON(http.StatusForbidden, projectResponse{"已有用户领取，不允许删除", nil})
		return
	}

	tx := db.DB.Begin()

	if err := tx.Where("project_id = ?", projectID).Delete(&ProjectTag{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除项目失败: " + err.Error(), nil})
		return
	}

	if err := tx.Where("project_id = ?", projectID).Delete(&ProjectItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除项目失败: " + err.Error(), nil})
		return
	}

	if err := tx.Delete(&project).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除项目失败: " + err.Error(), nil})
		return
	}

	ctx := context.Background()
	redisKey := fmt.Sprintf(RedisProjectItemsKeyPrefix, projectID)
	if err := db.Redis.Del(ctx, redisKey).Err(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除项目失败: " + err.Error(), nil})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, projectResponse{"删除项目失败: " + err.Error(), nil})
		return
	}

	c.JSON(http.StatusOK, projectResponse{})
}
