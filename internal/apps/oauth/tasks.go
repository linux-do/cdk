package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/linux-do/cdk/internal/task"
	"github.com/linux-do/cdk/internal/task/schedule"
	"net/http"
	"time"

	"github.com/hibiken/asynq"
	"github.com/linux-do/cdk/internal/db"
	"github.com/linux-do/cdk/internal/logger"
)

// Badge 徽章信息
type Badge struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Score       int    `json:"score"`
}

// UserBadgeResponse API响应
type UserBadgeResponse struct {
	Badges []Badge `json:"badges"`
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

// loadBadgeScores 从Redis加载徽章分数
func loadBadgeScores(ctx context.Context) (map[int]int, error) {
	// 加载所有徽章信息
	badgeValues, err := db.Redis.HGetAll(ctx, UserAllBadges).Result()
	if err != nil {
		logger.ErrorF(ctx, "获取徽章列表失败: %v", err)
		return nil, err
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
	return badgeScores, nil
}

// getUserBadges 获取用户的徽章
func getUserBadges(ctx context.Context, username string) (*UserBadgeResponse, error) {
	url := fmt.Sprintf("https://linux.do/u/%s.json", username)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建HTTP请求失败: %w", err)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求用户徽章接口失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("获取用户徽章失败，状态码: %d", resp.StatusCode)
	}

	var response UserBadgeResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("解析用户徽章响应失败: %w", err)
	}
	return &response, nil
}

// calculateUserScore 计算用户分数
func calculateUserScore(badges []Badge, badgeScores map[int]int) int {
	var totalScore int
	for _, badge := range badges {
		// 从缓存中查找徽章分数
		if score, exists := badgeScores[badge.ID]; exists {
			totalScore += score
		}
	}
	return totalScore
}

// updateUserScore 更新用户分数
func updateUserScore(ctx context.Context, user *User, newScore int) error {
	// 如果分数没变化，不更新
	if int(user.Score) == newScore {
		return nil
	}

	// 更新用户分数
	if err := db.DB(ctx).Model(&User{}).
		Where("id = ?", user.ID).
		Update("score", int8(newScore)).Error; err != nil {
		return fmt.Errorf("更新用户[%s]分数失败: %w", user.Username, err)
	}

	logger.InfoF(ctx, "用户[%s]徽章分数更新成功: %d -> %d", user.Username, user.Score, newScore)
	return nil
}

// HandleUpdateUserBadgeScores 处理所有用户徽章分数更新任务
func HandleUpdateUserBadgeScores(ctx context.Context, t *asynq.Task) error {

	// 分页处理用户
	pageSize := 200
	page := 0

	for {
		var users []User
		if err := db.DB(ctx).Where("is_active = ?", true).
			Select("id, username").
			Offset(page * pageSize).Limit(pageSize).
			Find(&users).Error; err != nil {
			logger.ErrorF(ctx, "查询用户失败: %v", err)
			return err
		}

		// 没有用户，退出循环
		if len(users) == 0 {
			break
		}

		for _, user := range users {
			payload, _ := json.Marshal(map[string]interface{}{
				"user_id": user.ID,
			})

			if _, errTask := schedule.AsynqClient.Enqueue(asynq.NewTask(task.UpdateSingleUserBadgeScoreTask, payload)); errTask != nil {
				logger.ErrorF(ctx, "下发用户[%s]徽章分数计算任务失败: %v", user.Username, errTask)
				return errTask
			} else {
				logger.InfoF(ctx, "下发用户[%s]徽章分数计算任务成功", user.Username)
			}
		}
		page++
	}
	return nil
}

// HandleUpdateSingleUserBadgeScore 处理单个用户徽章分数更新任务
func HandleUpdateSingleUserBadgeScore(ctx context.Context, t *asynq.Task) error {
	// 解析任务参数
	var payload struct {
		UserID uint64 `json:"user_id"`
	}
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("解析任务参数失败: %w", err)
	}

	var user User
	if err := db.DB(ctx).Where("id = ?", payload.UserID).First(&user).Error; err != nil {
		return fmt.Errorf("查询用户ID[%d]失败: %w", payload.UserID, err)
	}

	// 加载所有徽章信息
	badgeScores, err := loadBadgeScores(ctx)
	if err != nil {
		return err
	}

	if len(badgeScores) == 0 {
		return fmt.Errorf("未找到任何徽章数据")
	}

	// 获取用户徽章
	response, err := getUserBadges(ctx, user.Username)
	if err != nil {
		logger.ErrorF(ctx, "处理用户[%s]失败: %v", user.Username, err)
		return err
	}

	// 计算用户分数
	totalScore := calculateUserScore(response.Badges, badgeScores)

	// 更新用户分数
	return updateUserScore(ctx, &user, totalScore)
}

// getAllBadges 获取所有徽章数据
func getAllBadges(ctx context.Context) (*UserBadgeResponse, error) {
	url := "https://linux.do/badges.json"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建HTTP请求失败: %w", err)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求徽章列表接口失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("获取徽章列表失败，状态码: %d", resp.StatusCode)
	}

	var response UserBadgeResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("解析徽章列表响应失败: %w", err)
	}
	return &response, nil
}

// HandleUpdateAllBadge 处理更新所有徽章
func HandleUpdateAllBadge(ctx context.Context, t *asynq.Task) error {
	fetchUserBadgeResponse, err := getAllBadges(ctx)
	if err != nil {
		logger.ErrorF(ctx, "获取徽章列表失败: %v", err)
		return err
	}

	badgeScores, err := loadBadgeScores(ctx)
	if err != nil {
		return err
	}

	pipe := db.Redis.Pipeline()
	var newBadgeCount int

	for _, badge := range fetchUserBadgeResponse.Badges {
		if _, exists := badgeScores[badge.ID]; !exists {
			badgeJSON, errJson := json.Marshal(badge)
			if errJson != nil {
				logger.ErrorF(ctx, "序列化徽章[%d]失败: %v", badge.ID, errJson)
				continue
			}

			pipe.HSet(ctx, UserAllBadges, badge.ID, badgeJSON)
			newBadgeCount++
		}
	}

	if newBadgeCount > 0 {
		_, err := pipe.Exec(ctx)
		if err != nil {
			logger.ErrorF(ctx, "批量添加徽章失败: %v", err)
			return err
		}
		logger.InfoF(ctx, "批量添加 %d 个新徽章成功", newBadgeCount)
	}

	return nil
}
