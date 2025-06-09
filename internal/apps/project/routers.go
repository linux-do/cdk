package project

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
	"gorm.io/gorm"
	"net/http"
	"time"
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
}
type GetProjectResponseData struct {
    Project             `json:",inline"`      // 内嵌所有 Project 字段
    CreatorUsername     string       `json:"creator_username"`
    CreatorNickname     string       `json:"creator_nickname"`
    Tags                []string     `json:"tags"`
    AvailableItemsCount int64        `json:"available_items_count"`
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
	projectID := c.Param("id")

	var project Project // Project struct is in the same package
	if err := project.Exact(db.DB(c.Request.Context()), projectID); err != nil {
	    c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
	    return
	}

	tags, err := project.GetTags(db.DB(c.Request.Context()))
	if err != nil {
	    c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
	    return
	}

	// compute claimed items using stock
	stock, err := project.Stock(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}
	availableItemsCount := stock

	responseData := GetProjectResponseData{
	    Project:             project,
	    CreatorUsername:     project.Creator.Username,
	    CreatorNickname:     project.Creator.Nickname,
	    Tags:                tags,
	    AvailableItemsCount: availableItemsCount,
	}

	c.JSON(http.StatusOK, ProjectResponse{Data: responseData})
}

type CreateProjectRequestBody struct {
	ProjectRequest
	DistributionType DistributionType `json:"distribution_type" binding:"oneof=0 1"`
	ProjectItems     []string         `json:"project_items" binding:"required,min=1,dive,min=1,max=1024"`
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
	userID := oauth.GetUserIDFromContext(c)

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
		CreatorID:         userID,
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
			if err := project.CreateItems(c.Request.Context(), tx, req.ProjectItems); err != nil {
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

type UpdateProjectRequestBody struct {
	ProjectRequest
	ProjectItems []string `json:"project_items" binding:"dive,min=1,max=1024"`
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
	project := &Project{}
	if err := project.Exact(db.DB(c.Request.Context()), c.Param("id")); err != nil {
		c.JSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// init project
	project.Name = req.Name
	project.Description = req.Description
	project.TotalItems += int64(len(req.ProjectItems))
	project.StartTime = req.StartTime
	project.EndTime = req.EndTime
	project.MinimumTrustLevel = req.MinimumTrustLevel
	project.AllowSameIP = req.AllowSameIP
	project.RiskLevel = req.RiskLevel

	// save to db
	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			// save project
			if err := tx.Save(project).Error; err != nil {
				return err
			}
			// save tags
			if err := project.RefreshTags(tx, req.ProjectTags); err != nil {
				return err
			}
			// add items
			if err := project.CreateItems(c.Request.Context(), tx, req.ProjectItems); err != nil {
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
	project := &Project{}
	if err := project.Exact(db.DB(c.Request.Context()), c.Param("id")); err != nil {
		c.JSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

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

// ReceiveProject
// @Tags project
// @Accept json
// @Produce json
// @Param id path string true "project id"
// @Success 200 {object} ProjectResponse
// @Router /api/v1/projects/{id}/receive [post]
func ReceiveProject(c *gin.Context) {
	// init
	userID := oauth.GetUserIDFromContext(c)

	// load project
	project := &Project{}
	if err := project.Exact(db.DB(c.Request.Context()), c.Param("id")); err != nil {
		c.JSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// prepare item
	itemID, err := project.PrepareReceive(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// load item
	item := &ProjectItem{}
	if err := item.Exact(db.DB(c.Request.Context()), itemID); err != nil {
		c.JSON(http.StatusNotFound, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	// do receive
	if err := db.DB(c.Request.Context()).Transaction(
		func(tx *gorm.DB) error {
			now := time.Now()
			// save to db
			item.ReceiverID = &userID
			item.ReceivedAt = &now
			if err := tx.Save(item).Error; err != nil {
				return err
			}
			// check for ip
			if !project.AllowSameIP {
				if err := db.Redis.SetNX(
					c.Request.Context(),
					project.SameIPCacheKey(c.ClientIP()),
					c.ClientIP(),
					project.EndTime.Sub(time.Now()),
				).Err(); err != nil {
					return err
				}

			}
			return nil
		},
	); err != nil {
		// push items to redis
		db.Redis.RPush(c.Request.Context(), project.ItemsKey(), itemID)
		// response
		c.JSON(http.StatusInternalServerError, ProjectResponse{ErrorMsg: err.Error()})
		return
	}

	c.JSON(http.StatusOK, ProjectResponse{})
}

type ListReceiveHistoryRequest struct {
	Current int `json:"current" form:"current" binding:"min=1"`
	Size    int `json:"size" form:"size" binding:"min=1,max=100"`
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
// @Params request query ListReceiveHistoryRequest true "request query"
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

	// query db
	var total int64
	if err := db.DB(c.Request.Context()).Model(&ProjectItem{}).Where("receiver_id = ?", userID).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ListReceiveHistoryResponse{ErrorMsg: err.Error()})
		return
	}
	var items []*ProjectItem
	if err := db.DB(c.Request.Context()).
		Model(&ProjectItem{}).
		Where("receiver_id = ?", userID).
		Offset(offset).
		Limit(req.Size).
		Preload("Project.Creator").
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ListReceiveHistoryResponse{ErrorMsg: err.Error()})
		return
	}

	// response
	results := make([]ListReceiveHistoryResponseDataResult, len(items))
	for i, item := range items {
		results[i] = ListReceiveHistoryResponseDataResult{
			ProjectID:              item.ProjectID,
			ProjectName:            item.Project.Name,
			ProjectCreator:         item.Project.Creator.Username,
			ProjectCreatorNickname: item.Project.Creator.Nickname,
			Content:                item.Content,
			ReceivedAt:             item.ReceivedAt,
		}
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
	if err := db.DB(c.Request.Context()).Model(&ProjectTag{}).Distinct("tag").Pluck("tag", &tags).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ListTagsResponse{ErrorMsg: err.Error()})
		return
	}
	c.JSON(http.StatusOK, ListTagsResponse{Data: tags})
}
