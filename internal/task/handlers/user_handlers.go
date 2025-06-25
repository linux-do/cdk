package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/logger"
	"net/http"
	"time"
)

// Badge 徽章信息
type Badge struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Score       int    `json:"score"`
	HasBadge    bool   `json:"has_badge"`
}

// UserBadgeResponse API响应
type UserBadgeResponse struct {
	Username string  `json:"username"`
	Badges   []Badge `json:"badges"`
}

// 配置HTTP客户端
var httpClient = &http.Client{
	Timeout: 10 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 20,
		IdleConnTimeout:     60 * time.Second,
	},
}

// HandleUpdateUserBadgeScores 处理所有用户徽章分数更新任务
func HandleUpdateUserBadgeScores(ctx context.Context, t *asynq.Task) error {
	// 加载所有徽章信息
	badgeValues, err := db.Redis.HGetAll(ctx, ALLBadges).Result()
	if err != nil {
		logger.ErrorF(ctx, "获取徽章列表失败: %v", err)
		return err
	}

	badgeScores := make(map[int]int, len(badgeValues))
	for _, badgeJSON := range badgeValues {
		var badge Badge
		if err := json.Unmarshal([]byte(badgeJSON), &badge); err != nil {
			logger.ErrorF(ctx, "解析徽章JSON失败: %v", err)
			continue
		}
		badgeScores[badge.ID] = badge.Score
	}

	// 分页处理用户
	pageSize := 200
	page := 0
	totalProcessed := 0
	totalUpdated := 0

	for {
		var users []oauth.User
		if err := db.DB(ctx).Where("is_active = ?", true).
			Select("id, username, score").
			Offset(page * pageSize).Limit(pageSize).
			Find(&users).Error; err != nil {
			logger.ErrorF(ctx, "查询用户失败: %v", err)
			return err
		}

		// 没有用户，退出循环
		if len(users) == 0 {
			break
		}

		// 顺序处理每个用户
		for _, user := range users {
			// 1. 获取用户徽章
			url := fmt.Sprintf("https://linux.do/u/%s.json", user.Username)
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
			if err != nil {
				logger.ErrorF(ctx, "创建HTTP请求失败: %v", err)
				continue
			}

			resp, err := httpClient.Do(req)
			if err != nil {
				logger.ErrorF(ctx, "请求用户徽章接口失败[%s]: %v", user.Username, err)
				continue
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				logger.ErrorF(ctx, "获取用户[%s]徽章失败，状态码: %d", user.Username, resp.StatusCode)
				continue
			}

			var response UserBadgeResponse
			if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
				logger.ErrorF(ctx, "解析用户[%s]徽章响应失败: %v", user.Username, err)
				continue
			}

			// 计算用户分数
			var totalScore int
			for _, badge := range response.Badges {
				if badge.HasBadge {
					// 从缓存中查找徽章分数
					if score, exists := badgeScores[badge.ID]; exists {
						totalScore += score
					}
				}
			}

			// 如果分数没变化，不更新
			if int(user.Score) == totalScore {
				continue
			}

			// 5. 更新用户分数
			if err := db.DB(ctx).Model(&oauth.User{}).
				Where("id = ?", user.ID).
				Update("score", int8(totalScore)).Error; err != nil {
				logger.ErrorF(ctx, "更新用户[%s]分数失败: %v", user.Username, err)
				continue
			}

			totalUpdated++
		}

		totalProcessed += len(users)
		page++
	}

	logger.InfoF(ctx, "用户徽章分数更新完成，处理用户: %d，更新用户: %d", totalProcessed, totalUpdated)
	return nil
}

// HandleUpdateSingleUserBadgeScore 处理单个用户徽章分数更新任务
func HandleUpdateSingleUserBadgeScore(ctx context.Context, t *asynq.Task) error {
	// 解析任务参数
	var payload struct {
		UserID   uint64 `json:"user_id"`
		Username string `json:"username"`
	}
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("解析任务参数失败: %w", err)
	}

	// 如果没有提供用户ID但提供了用户名，先查询用户
	var user oauth.User
	if payload.UserID == 0 && payload.Username != "" {
		if err := db.DB(ctx).Where("username = ?", payload.Username).First(&user).Error; err != nil {
			return fmt.Errorf("查询用户[%s]失败: %w", payload.Username, err)
		}
		payload.UserID = user.ID
	} else if payload.UserID > 0 {
		// 通过ID查询用户
		if err := db.DB(ctx).Where("id = ?", payload.UserID).First(&user).Error; err != nil {
			return fmt.Errorf("查询用户ID[%d]失败: %w", payload.UserID, err)
		}
	} else {
		return fmt.Errorf("缺少用户ID或用户名")
	}

	// 从Redis加载所有徽章信息
	badgeValues, err := db.Redis.HGetAll(ctx, ALLBadges).Result()
	if err != nil {
		logger.ErrorF(ctx, "获取徽章列表失败: %v", err)
		return err
	}

	// 解析徽章分数
	badgeScores := make(map[int]int, len(badgeValues))
	for _, badgeJSON := range badgeValues {
		var badge Badge
		if err := json.Unmarshal([]byte(badgeJSON), &badge); err != nil {
			logger.ErrorF(ctx, "解析徽章JSON失败: %v", err)
			continue
		}
		badgeScores[badge.ID] = badge.Score
	}

	// 获取用户徽章
	url := fmt.Sprintf("https://linux.do/u/%s.json", user.Username)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		logger.ErrorF(ctx, "创建HTTP请求失败: %v", err)
		return err
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		logger.ErrorF(ctx, "请求用户徽章接口失败[%s]: %v", user.Username, err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.ErrorF(ctx, "获取用户[%s]徽章失败，状态码: %d", user.Username, resp.StatusCode)
		return fmt.Errorf("获取用户徽章失败，状态码: %d", resp.StatusCode)
	}

	// 解析响应
	var response UserBadgeResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		logger.ErrorF(ctx, "解析用户[%s]徽章响应失败: %v", user.Username, err)
		return err
	}

	// 计算用户分数
	var totalScore int
	for _, badge := range response.Badges {
		if badge.HasBadge {
			// 从缓存中查找徽章分数
			if score, exists := badgeScores[badge.ID]; exists {
				totalScore += score
			}
		}
	}

	// 如果分数没变化，不更新
	if int(user.Score) == totalScore {
		return nil
	}

	// 更新用户分数
	if err := db.DB(ctx).Model(&oauth.User{}).
		Where("id = ?", user.ID).
		Update("score", int8(totalScore)).Error; err != nil {
		logger.ErrorF(ctx, "更新用户[%s]分数失败: %v", user.Username, err)
		return err
	}

	logger.InfoF(ctx, "用户[%s]徽章分数更新成功: %d -> %d", user.Username, user.Score, totalScore)
	return nil
}
