package project

import (
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
	"net/http"
	"time"
)

type projectResponse struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

type ItemRequestBody struct {
	Content string `json:"content" binding:"required,max=1024"`
}

type RequestBody struct {
	Name              string            `json:"name" binding:"required,max=32"`
	Description       string            `json:"description" binding:"required,max=1024"`
	DistributionType  DistributionType  `json:"distribution_type" binding:"required"`
	Tags              []string          `json:"tags" binding:"required,dive,max=16"`
	Items             []ItemRequestBody `json:"items" binding:"required"`
	StartTime         time.Time         `json:"start_time" binding:"required"`
	EndTime           time.Time         `json:"end_time" binding:"required,gtfield=StartTime"`
	MinimumTrustLevel oauth.TrustLevel  `json:"minimum_trust_level"`
	AllowSameIP       bool              `json:"allow_same_ip"`
	RiskLevel         uint8             `json:"risk_level" binding:"required,min=0,max=100"`
}

type CreateProjectRequestBody = RequestBody

type UpdateProjectRequestBody = RequestBody

// CreateProject 创建项目API
// @Summary 创建项目
// @Description 创建新项目，并将项目子项(待分发的Key)存入Redis List
// @Tags 项目管理
// @Accept json
// @Produce json
// @Param project body CreateProjectRequestBody true "项目信息"
// @Success 200 {object} gin.H
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /v1/project [post]
func CreateProject(c *gin.Context) {
	var req CreateProjectRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, projectResponse{err.Error(), nil})
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
		TotalItems:        int64(len(req.Items)),
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

	projectTags := make([]ProjectTag, 0, len(req.Tags))
	for _, tag := range req.Tags {
		projectTags = append(projectTags, ProjectTag{
			ProjectID: projectID,
			Tag:       tag,
		})
	}
	if err := tx.Create(&projectTags).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"添加项目标签失败: " + err.Error(), nil})
		return
	}

	projectItems := make([]ProjectItem, 0, len(req.Items))
	for _, item := range req.Items {
		projectItems = append(projectItems, ProjectItem{
			ProjectID: projectID,
			Content:   item.Content,
		})
	}
	if err := tx.Create(&projectItems).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"创建项目项失败: " + err.Error(), nil})
		return
	}
	ctx := context.Background()
	redisKey := fmt.Sprintf(RedisProjectItemsKeyPrefix, projectID)

	items := make([]interface{}, len(req.Items))
	for i, item := range req.Items {
		items[i] = item.Content
	}
	if err := db.Redis.RPush(ctx, redisKey, items...).Err(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"存储项目子项到Redis失败: " + err.Error(), nil})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, projectResponse{"提交事务失败: " + err.Error(), nil})
		return
	}

	c.JSON(http.StatusOK, projectResponse{})
}

// UpdateProject 编辑项目API
// @Summary 编辑项目
// @Description 编辑现有项目信息
// @Tags 项目管理
// @Accept json
// @Produce json
// @Param id path string true "项目ID"
// @Param project body UpdateProjectRequestBody true "项目信息"
// @Success 200 {object} gin.H
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 404 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /v1/project/{id} [put]
func UpdateProject(c *gin.Context) {
	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, projectResponse{"项目ID不能为空", nil})
		return
	}

	var req UpdateProjectRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, projectResponse{err.Error(), nil})
		return
	}

	// 获取当前用户ID
	userID := c.GetUint64(oauth.UserIDKey)

	// 查找项目
	var project Project
	if err := db.DB.Where("id = ? AND creator_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, projectResponse{"项目不存在或无权限", nil})
		return
	}

	// 更新项目信息
	project.Name = req.Name
	project.Description = req.Description
	project.DistributionType = req.DistributionType
	project.TotalItems = int64(len(req.Items))
	project.MinimumTrustLevel = req.MinimumTrustLevel
	project.AllowSameIP = req.AllowSameIP
	project.RiskLevel = req.RiskLevel
	project.StartTime = req.StartTime
	project.EndTime = req.EndTime

	// 开始事务
	tx := db.DB.Begin()
	if err := tx.Save(&project).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"更新项目失败: " + err.Error(), nil})
		return
	}

	if err := tx.Where("project_id = ?", projectID).Delete(&ProjectTag{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除旧标签失败: " + err.Error(), nil})
		return
	}

	projectTags := make([]ProjectTag, 0, len(req.Tags))
	for _, tag := range req.Tags {
		projectTags = append(projectTags, ProjectTag{
			ProjectID: projectID,
			Tag:       tag,
		})
	}
	if err := tx.Create(&projectTags).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"添加项目标签失败: " + err.Error(), nil})
		return
	}

	// 删除旧的项目项
	if err := tx.Where("project_id = ?", projectID).Delete(&ProjectItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除旧项目项失败: " + err.Error(), nil})
		return
	}

	// 批量添加新项目项
	projectItems := make([]ProjectItem, 0, len(req.Items))
	for _, item := range req.Items {
		projectItems = append(projectItems, ProjectItem{
			ProjectID: projectID,
			Content:   item.Content,
		})
	}
	if err := tx.Create(&projectItems).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"创建项目项失败: " + err.Error(), nil})
		return
	}

	// 更新Redis数据
	ctx := context.Background()
	redisKey := fmt.Sprintf(RedisProjectItemsKeyPrefix, projectID)

	// 删除旧的Redis数据
	if err := db.Redis.Del(ctx, redisKey).Err(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除Redis中的项目子项失败: " + err.Error(), nil})
		return
	}

	// 批量添加新的Redis数据
	items := make([]interface{}, len(req.Items))
	for i, item := range req.Items {
		items[i] = item.Content
	}

	if err := db.Redis.RPush(ctx, redisKey, items...).Err(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"存储项目子项到Redis失败: " + err.Error(), nil})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, projectResponse{"提交事务失败: " + err.Error(), nil})
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
// @Success 200 {object} gin.H
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 403 {object} gin.H
// @Failure 404 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /v1/project/{id} [delete]
func DeleteProject(c *gin.Context) {
	projectID := c.Param("id")
	if projectID == "" {
		c.JSON(http.StatusBadRequest, projectResponse{"项目ID不能为空", nil})
		return
	}

	// 获取当前用户ID
	userID := c.GetUint64(oauth.UserIDKey)

	// 查找项目
	var project Project
	if err := db.DB.Where("id = ? AND creator_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, projectResponse{"项目不存在或无权限", nil})
		return
	}

	// 检查是否已有领取记录
	var count int64
	if err := db.DB.Model(&ProjectItem{}).Where("project_id = ? AND receiver_id IS NOT NULL", projectID).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, projectResponse{"查询领取记录失败: " + err.Error(), nil})
		return
	}

	if count > 0 {
		c.JSON(http.StatusForbidden, projectResponse{"已有用户领取，不允许删除", nil})
		return
	}

	// 开始事务
	tx := db.DB.Begin()

	// 删除项目标签
	if err := tx.Where("project_id = ?", projectID).Delete(&ProjectTag{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除项目标签失败: " + err.Error(), nil})
		return
	}

	// 删除项目项
	if err := tx.Where("project_id = ?", projectID).Delete(&ProjectItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除项目项失败: " + err.Error(), nil})
		return
	}

	// 删除项目
	if err := tx.Delete(&project).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除项目失败: " + err.Error(), nil})
		return
	}

	// 删除Redis中的项目子项
	ctx := context.Background()
	redisKey := fmt.Sprintf(RedisProjectItemsKeyPrefix, projectID)
	if err := db.Redis.Del(ctx, redisKey).Err(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, projectResponse{"删除Redis中的项目子项失败: " + err.Error(), nil})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, projectResponse{"提交事务失败: " + err.Error(), nil})
		return
	}

	c.JSON(http.StatusOK, projectResponse{})
}
