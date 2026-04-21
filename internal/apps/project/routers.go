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
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/config"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/utils"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type ProjectResponse struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

type ProjectRequest struct {
	Name              string           `json:"name" binding:"required,min=1,max=32"`
	Description       string           `json:"description" binding:"max=1024"`
	ProjectTags       []string         `json:"project_tags" binding:"dive,min=1,max=16"`
	StartTime         time.Time        `json:"start_time" binding:"required"`
	EndTime           time.Time        `json:"end_time" binding:"required,gtfield=StartTime"`
	MinimumTrustLevel oauth.TrustLevel `json:"minimum_trust_level" binding:"oneof=0 1 2 3 4"`
	AllowSameIP       bool             `json:"allow_same_ip"`
	RiskLevel         int8             `json:"risk_level" binding:"min=0,max=100"`
	HideFromExplore   bool             `json:"hide_from_explore"`
	Price             decimal.Decimal  `json:"price"`
}
type GetProjectResponseData struct {
	Project             `json:",inline"` // 内嵌所有 Project 字段
	CreatorUsername     string           `json:"creator_username"`
	CreatorNickname     string           `json:"creator_nickname"`
	Tags                []string         `json:"tags"`
	AvailableItemsCount int64            `json:"available_items_count"`
	IsReceived          bool             `json:"is_received"`
	ReceivedContent     string           `json:"received_content"`
}

// GetProject
// @Tags project
// @Summary 获取指定项目信息 (Get specific project information)
// @Description 获取指定项目所有信息以及领取情况 (Get all information and claim status for a specific project)
// @Produce json
// @Param id path string true "项目ID (Project ID)"
// @Success 200 {object} ProjectResponse{data=GetProjectResponseData}
// @Router /api/v1/projects/{id} [get]
func GetProject(c *gin.Context) {
	currentUser, _ := oauth.GetUserFromContext(c)

	var project Project // Project struct is in the same package
	if err := db.DB(c.Request.Context()).Model(&Project{}).
		Where("id = ? AND status = ?", c.Param("id"), ProjectStatusNormal).
		First(&project).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, ProjectResponse{ErrorMsg: NotFound})
		} else {
			c.JSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
		}
		return
	}
	if err := project.ValidateRequirement(currentUser); err != nil {
		c.JSON(http.StatusForbidden, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	tags, err := project.GetTags(db.DB(c.Request.Context()))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	var user oauth.User
	if errUser := user.Exact(db.DB(c.Request.Context()), project.CreatorID); errUser != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: errUser.Error()})
		return
	}

	// compute claimed items using stock
	stock, err := project.Stock(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}
	availableItemsCount := stock

	isReceived := false
	receivedContent := ""
	item, err := project.GetReceivedItem(c.Request.Context(), oauth.GetUserIDFromContext(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}
	if item != nil {
		isReceived = true
		receivedContent = item.Content
	}

	creatorNickname := user.Nickname
	if creatorNickname == "" {
		creatorNickname = user.Username
	}

	responseData := GetProjectResponseData{
		Project:             project,
		CreatorUsername:     user.Username,
		CreatorNickname:     creatorNickname,
		Tags:                tags,
		AvailableItemsCount: availableItemsCount,
		IsReceived:          isReceived,
		ReceivedContent:     receivedContent,
	}

	c.JSON(http.StatusOK, ProjectResponse{Data: responseData})
}

type CreateProjectRequestBody struct {
	ProjectRequest
	DistributionType DistributionType `json:"distribution_type" binding:"oneof=0 1"`
	ProjectItems     []string         `json:"project_items" binding:"required,min=1,dive,min=1,max=1024"`
	TopicId          uint64           `json:"topic_id" binding:"omitempty,gt=0"`
}

// CreateProject
// @Tags project
// @Accept json
// @Produce json
// @Param project body CreateProjectRequestBody true "项目信息"
// @Success 200 {object} ProjectResponse
// @Router /api/v1/projects [post]
func CreateProject(c *gin.Context) {
	// init req
	var req CreateProjectRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// init session
	currentUser, _ := oauth.GetUserFromContext(c)

	// validate price
	if err := validateProjectPrice(c.Request.Context(), req.Price, req.DistributionType, currentUser.ID); err != nil {
		c.JSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// init project
	project := Project{
		ID:                uuid.NewString(),
		Name:              req.Name,
		Description:       req.Description,
		DistributionType:  req.DistributionType,
		TotalItems:        int64(len(req.ProjectItems)),
		StartTime:         req.StartTime,
		EndTime:           req.EndTime,
		MinimumTrustLevel: req.MinimumTrustLevel,
		AllowSameIP:       req.AllowSameIP,
		RiskLevel:         req.RiskLevel,
		CreatorID:         currentUser.ID,
		IsCompleted:       false,
		HideFromExplore:   req.HideFromExplore,
		Price:             req.Price,
	}

	// create project
	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// create project
			if err := tx.Create(&project).Error; err != nil {
				return err
			}
			// create tags
			if err := project.RefreshTags(tx, req.ProjectTags); err != nil {
				return err
			}
			// create content
			if err := project.CreateItems(c.Request.Context(), tx, req.ProjectItems, currentUser.Username, req.TopicId); err != nil {
				return err
			}
			return nil
		},
	); err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// response
	c.JSON(http.StatusOK, ProjectResponse{
		Data: map[string]interface{}{"projectId": project.ID},
	})
}

type UpdateProjectRequestBody struct {
	ProjectRequest
	ProjectItems []string `json:"project_items" binding:"dive,min=1,max=1024"`
	EnableFilter bool     `json:"enable_filter"`
}

// UpdateProject
// @Tags project
// @Accept json
// @Produce json
// @Param id path string true "项目ID"
// @Param project body UpdateProjectRequestBody true "项目信息"
// @Success 200 {object} ProjectResponse
// @Router /api/v1/projects/{id} [put]
func UpdateProject(c *gin.Context) {
	// validate req
	var req UpdateProjectRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ProjectResponse{err.Error(), nil})
		return
	}

	// load project
	project, _ := GetProjectFromContext(c)

	// validate price (复用创建者 ID + 原分发类型)
	if err := validateProjectPrice(c.Request.Context(), req.Price, project.DistributionType, project.CreatorID); err != nil {
		c.JSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// init project
	project.Name = req.Name
	project.Description = req.Description
	project.StartTime = req.StartTime
	project.EndTime = req.EndTime
	project.MinimumTrustLevel = req.MinimumTrustLevel
	project.AllowSameIP = req.AllowSameIP
	project.RiskLevel = req.RiskLevel
	project.HideFromExplore = req.HideFromExplore
	project.Price = req.Price

	if project.DistributionType == DistributionTypeLottery {
		// save project
		if err := db.DB(c.Request.Context()).Save(&project).Error; err != nil {
			c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		} else {
			c.JSON(http.StatusOK, ProjectResponse{})
		}
		return
	}

	// save to db
	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// Calculate actual items to be added (considering filter)
			actualItemsCount, err := project.GetFilteredItemsCount(c.Request.Context(), tx, req.ProjectItems, req.EnableFilter)
			if err != nil {
				return err
			}

			// Update project counts only if there are new items to add
			if actualItemsCount > 0 {
				project.TotalItems += actualItemsCount
				project.IsCompleted = false
			}

			// save project
			if err := tx.Save(project).Error; err != nil {
				return err
			}
			// save tags
			if err := project.RefreshTags(tx, req.ProjectTags); err != nil {
				return err
			}
			// add items with filter
			if err := project.CreateItemsWithFilter(c.Request.Context(), tx, req.ProjectItems, req.EnableFilter); err != nil {
				return err
			}
			return nil
		},
	); err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// response
	c.JSON(http.StatusOK, ProjectResponse{})
}

// DeleteProject
// @Tags project
// @Accept json
// @Produce json
// @Param id path string true "项目ID"
// @Success 200 {object} ProjectResponse
// @Router /api/v1/projects/{id} [delete]
func DeleteProject(c *gin.Context) {
	// load project
	project, _ := GetProjectFromContext(c)

	// check for received
	var count int64
	if err := db.DB(c.Request.Context()).
		Model(&ProjectItem{}).
		Where("project_id = ? AND receiver_id IS NOT NULL", project.ID).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	} else if count > 0 {
		c.JSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: AlreadyReceived})
		return
	}

	// do delete
	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// delete project tag
			if err := tx.Where("project_id = ?", project.ID).Delete(&ProjectTag{}).Error; err != nil {
				return err
			}
			// delete project items
			if err := tx.Where("project_id = ?", project.ID).Delete(&ProjectItem{}).Error; err != nil {
				return err
			}
			// delete project
			if err := tx.Where("id = ?", project.ID).Delete(&Project{}).Error; err != nil {
				return err
			}
			// delete items cache
			if err := db.Redis.Del(c.Request.Context(), project.ItemsKey()).Err(); err != nil {
				return err
			}
			return nil
		},
	); err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// response
	c.JSON(http.StatusOK, ProjectResponse{})
}

type ListProjectReceiversRequest struct {
	Current int    `json:"current" form:"current" binding:"min=1"`
	Size    int    `json:"size" form:"size" binding:"min=1,max=100"`
	Search  string `json:"search" form:"search" binding:"max=1024"`
}

// ListProjectReceivers
// @Tags project
// @Accept json
// @Produce json
// @Param id path string true "项目ID (Project ID)"
// @Param request query ListProjectReceiversRequest true "request query"
// @Success 200 {object} ProjectResponse
// @Router /api/v1/projects/{id}/receivers [get]
func ListProjectReceivers(c *gin.Context) {
	// load project
	project, _ := GetProjectFromContext(c)

	// validate pagination request
	req := &ListProjectReceiversRequest{}
	if err := c.ShouldBindQuery(req); err != nil {
		c.JSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: err.Error()})
		return
	}
	offset := (req.Current - 1) * req.Size

	// build optimized query with proper indexing strategy
	query := db.DB(c.Request.Context()).
		Model(&ProjectItem{}).
		Select("users.username, users.nickname, project_items.content").
		Joins("JOIN users ON users.id = project_items.receiver_id").
		Where("project_items.project_id = ?", project.ID)

	if req.Search != "" {
		searchPattern := strings.TrimSpace(req.Search) + "%"
		if len(searchPattern) > 21 {
			query = query.Where(
				"users.nickname LIKE ? OR project_items.content LIKE ?",
				"%"+searchPattern, "%"+searchPattern)
		} else {
			query = query.Where(
				"users.username LIKE ? OR users.nickname LIKE ? OR project_items.content LIKE ?",
				searchPattern, "%"+searchPattern, "%"+searchPattern)
		}
	}

	// query db with optimizations
	var receivers []struct {
		Username string `json:"username"`
		Nickname string `json:"nickname"`
		Content  string `json:"content"`
	}
	if err := query.
		Offset(offset).
		Limit(req.Size).
		Scan(&receivers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// response
	c.JSON(http.StatusOK, ProjectResponse{Data: receivers})
}

type ReportProjectRequestBody struct {
	Reason string `json:"reason" binding:"required,min=1,max=255"`
}

// ReportProject
// @Tags project
// @Accept json
// @Produce json
// @Param id path string true "项目ID"
// @Param project body ReportProjectRequestBody true "举报信息"
// @Success 200 {object} ProjectResponse
// @Router /api/v1/projects/{id}/report [post]
func ReportProject(c *gin.Context) {
	// init req
	var req ReportProjectRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// load project
	project := &Project{}
	if err := project.Exact(db.DB(c.Request.Context()), c.Param("id"), true); err != nil {
		c.JSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// init session
	userID := oauth.GetUserIDFromContext(c)

	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// if report count reaches threshold, mark project as hidden
			if err := tx.Model(&Project{}).
				Where("id = ?", project.ID).
				Updates(map[string]interface{}{
					"report_count": gorm.Expr("report_count + 1"),
					"status": gorm.Expr("CASE WHEN report_count + 1 >= ? THEN ? ELSE status END",
						config.Config.ProjectApp.HiddenThreshold,
						ProjectStatusHidden,
					),
				}).Error; err != nil {
				return err
			}
			// create report record
			report := &ProjectReport{
				ProjectID:  project.ID,
				ReporterID: userID,
				Reason:     req.Reason,
			}
			if err := tx.Create(report).Error; err != nil {
				if strings.Contains(err.Error(), "Duplicate") {
					return errors.New(AlreadyReported)
				}
				return err
			}
			return nil
		},
	); err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	c.JSON(http.StatusOK, ProjectResponse{})
}

type ListReceiveHistoryRequest struct {
	Current int    `json:"current" form:"current" binding:"min=1"`
	Size    int    `json:"size" form:"size" binding:"min=1,max=100"`
	Search  string `json:"search" form:"search" binding:"max=255"`
}

type ListReceiveHistoryResponseDataResult struct {
	ProjectID              string     `json:"project_id"`
	ProjectName            string     `json:"project_name"`
	ProjectCreator         string     `json:"project_creator"`
	ProjectCreatorNickname string     `json:"project_creator_nickname"`
	Content                string     `json:"content"`
	ReceivedAt             *time.Time `json:"received_at"`
}

type ListReceiveHistoryResponseData struct {
	Total   int64                                  `json:"total"`
	Results []ListReceiveHistoryResponseDataResult `json:"results"`
}

type ListReceiveHistoryResponse struct {
	ErrorMsg string                         `json:"error_msg"`
	Data     ListReceiveHistoryResponseData `json:"data"`
}

// ListReceiveHistory
// @Tags project
// @Param request query ListReceiveHistoryRequest true "request query"
// @Produce json
// @Success 200 {object} ListReceiveHistoryResponse
// @Router /api/v1/projects/received [get]
func ListReceiveHistory(c *gin.Context) {
	// init
	userID := oauth.GetUserIDFromContext(c)

	// validate req
	req := &ListReceiveHistoryRequest{}
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, ListReceiveHistoryResponse{ErrorMsg: err.Error()})
		return
	}
	offset := (req.Current - 1) * req.Size

	// build base query
	baseQuery := db.DB(c.Request.Context()).
		Table("project_items").
		Joins("INNER JOIN projects ON projects.id = project_items.project_id").
		Joins("INNER JOIN users ON users.id = projects.creator_id").
		Where("project_items.receiver_id = ?", userID)

	// apply search filter
	if req.Search != "" {
		searchPattern := strings.TrimSpace(req.Search) + "%"
		if len(searchPattern) > 21 {
			baseQuery = baseQuery.Where(
				"users.nickname LIKE ? OR projects.name LIKE ?",
				"%"+searchPattern, "%"+searchPattern,
			)
		} else {
			baseQuery = baseQuery.Where(
				"users.username LIKE ? OR users.nickname LIKE ? OR projects.name LIKE ?",
				searchPattern, "%"+searchPattern, "%"+searchPattern,
			)
		}
	}

	// query total count
	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ListReceiveHistoryResponse{ErrorMsg: err.Error()})
		return
	}

	// build data query with COALESCE for nickname default
	var results []ListReceiveHistoryResponseDataResult
	if err := baseQuery.
		Select(`
            project_items.project_id,
            projects.name as project_name,
            users.username as project_creator,
            COALESCE(NULLIF(users.nickname, ''), users.username) as project_creator_nickname,
            project_items.content,
            project_items.received_at
        `).
		Order("project_items.received_at DESC, project_items.id DESC").
		Offset(offset).
		Limit(req.Size).
		Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ListReceiveHistoryResponse{ErrorMsg: err.Error()})
		return
	}

	c.JSON(
		http.StatusOK,
		ListReceiveHistoryResponse{
			Data: ListReceiveHistoryResponseData{Total: total, Results: results},
		},
	)
}

type ListTagsResponse struct {
	ErrorMsg string   `json:"error_msg"`
	Data     []string `json:"data"`
}

// ListTags
// @Tags project
// @Accept json
// @Produce json
// @Success 200 {object} ListTagsResponse
// @Router /api/v1/tags [get]
func ListTags(c *gin.Context) {
	var tags []string

	err := db.DB(c.Request.Context()).
		Model(&ProjectTag{}).
		Joins("INNER JOIN projects ON projects.id = project_tags.project_id").
		Where("projects.status = ?", ProjectStatusNormal).
		Distinct("project_tags.tag").
		Pluck("tag", &tags).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, ListTagsResponse{ErrorMsg: err.Error()})
		return
	}
	c.JSON(http.StatusOK, ListTagsResponse{Data: tags})
}

type ListProjectsRequest struct {
	Current int      `json:"current" form:"current" binding:"min=1"`
	Size    int      `json:"size" form:"size" binding:"min=1,max=100"`
	Tags    []string `json:"tags" form:"tags" binding:"dive,min=1,max=16"`
}

type ListProjectsResponseDataResult struct {
	ID                string            `json:"id"`
	Name              string            `json:"name"`
	Description       string            `json:"description"`
	DistributionType  DistributionType  `json:"distribution_type"`
	TotalItems        int64             `json:"total_items"`
	StartTime         time.Time         `json:"start_time"`
	EndTime           time.Time         `json:"end_time"`
	MinimumTrustLevel oauth.TrustLevel  `json:"minimum_trust_level"`
	AllowSameIP       bool              `json:"allow_same_ip"`
	RiskLevel         int8              `json:"risk_level"`
	HideFromExplore   bool              `json:"hide_from_explore"`
	Price             decimal.Decimal   `json:"price"`
	Tags              utils.StringArray `json:"tags"`
	CreatedAt         time.Time         `json:"created_at"`
}

type ListProjectsResponseData struct {
	Total   int64                             `json:"total"`
	Results *[]ListProjectsResponseDataResult `json:"results"`
}

type ListProjectsResponse struct {
	ErrorMsg string                    `json:"error_msg"`
	Data     *ListProjectsResponseData `json:"data"`
}

// ListProjects
// @Tags project
// @Param request query ListProjectsRequest true "request query"
// @Produce json
// @Success 200 {object} ListProjectsResponse
// @Router /api/v1/projects [get]
func ListProjects(c *gin.Context) {
	req := &ListProjectsRequest{}
	if err := c.ShouldBindQuery(req); err != nil {
		c.JSON(http.StatusBadRequest, ListProjectsResponse{ErrorMsg: err.Error()})
		return
	}
	offset := (req.Current - 1) * req.Size

	currentUser, _ := oauth.GetUserFromContext(c)

	pagedData, err := ListProjectsWithTags(c.Request.Context(), offset, req.Size, req.Tags, currentUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ListProjectsResponse{ErrorMsg: err.Error()})
		return
	}

	c.JSON(http.StatusOK, ListProjectsResponse{
		Data: pagedData,
	})
}

// ListMyProjects
// @Tags project
// @Param request query ListProjectsRequest true "request query"
// @Produce json
// @Success 200 {object} ListProjectsResponse
// @Router /api/v1/projects/mine [get]
func ListMyProjects(c *gin.Context) {
	userID := oauth.GetUserIDFromContext(c)

	req := &ListProjectsRequest{}
	if err := c.ShouldBindQuery(req); err != nil {
		c.JSON(http.StatusBadRequest, ListProjectsResponse{ErrorMsg: err.Error()})
		return
	}
	offset := (req.Current - 1) * req.Size

	pagedData, err := ListMyProjectsWithTags(c.Request.Context(), userID, offset, req.Size, req.Tags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ListProjectsResponse{ErrorMsg: err.Error()})
		return
	}

	c.JSON(http.StatusOK, ListProjectsResponse{
		Data: pagedData,
	})
}

type ListReceiveHistoryChartRequest struct {
	Day int `json:"day" form:"day" binding:"min=1,max=180"`
}

type ReceiveHistoryChartPoint struct {
	Date  string `json:"date"`
	Label string `json:"label"`
	Count int64  `json:"count"`
}

type ListReceiveHistoryChartResponse struct {
	ErrorMsg string                     `json:"error_msg"`
	Data     []ReceiveHistoryChartPoint `json:"data"`
}

// ListReceiveHistoryChart
// @Tags project
// @Param request query ListReceiveHistoryChartRequest true "request query"
// @Produce json
// @Success 200 {object} ListReceiveHistoryChartResponse
// @Router /api/v1/projects/received/chart [get]
func ListReceiveHistoryChart(c *gin.Context) {
	userID := oauth.GetUserIDFromContext(c)

	req := &ListReceiveHistoryChartRequest{}
	if err := c.ShouldBindQuery(req); err != nil {
		c.JSON(http.StatusBadRequest, ListReceiveHistoryChartResponse{ErrorMsg: err.Error()})
		return
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	startDate := today.AddDate(0, 0, -(req.Day - 1))
	nextDay := today.AddDate(0, 0, 1)

	var rows []struct {
		Day   time.Time `json:"day"`
		Count int64     `json:"count"`
	}

	if err := db.DB(c.Request.Context()).
		Table("project_items").
		Select("DATE(received_at) AS day, COUNT(*) AS count").
		Where("receiver_id = ? AND received_at IS NOT NULL AND received_at >= ? AND received_at < ?", userID, startDate, nextDay).
		Group("DATE(received_at)").
		Order("day ASC").
		Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ListReceiveHistoryChartResponse{ErrorMsg: err.Error()})
		return
	}

	dayCountMap := make(map[string]int64, len(rows))
	for _, row := range rows {
		key := row.Day.Format("2006-01-02")
		dayCountMap[key] = row.Count
	}

	results := make([]ReceiveHistoryChartPoint, 0, req.Day)
	for i := 0; i < req.Day; i++ {
		day := startDate.AddDate(0, 0, i)
		key := day.Format("2006-01-02")
		results = append(results, ReceiveHistoryChartPoint{
			Date:  key,
			Label: day.Format("01/02"),
			Count: dayCountMap[key],
		})
	}

	c.JSON(http.StatusOK, ListReceiveHistoryChartResponse{Data: results})
}
