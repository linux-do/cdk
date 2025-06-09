package project

import (
	"context"
	"errors"
	"fmt"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
	"strconv"
	"time"
)

type Project struct {
	ID                string           `json:"id" gorm:"primaryKey;size:64"`
	Name              string           `json:"name" gorm:"size:32"`
	Description       string           `json:"description" gorm:"size:1024"`
	DistributionType  DistributionType `json:"distribution_type"`
	TotalItems        int64            `json:"total_items"`
	StartTime         time.Time        `json:"start_time"`
	EndTime           time.Time        `json:"end_time"`
	MinimumTrustLevel oauth.TrustLevel `json:"minimum_trust_level"`
	AllowSameIP       bool             `json:"allow_same_ip"`
	RiskLevel         int8             `json:"risk_level"`
	CreatorID         uint64           `json:"creator_id" gorm:"index"`
	Creator           oauth.User       `json:"-" gorm:"foreignKey:CreatorID"`
	CreatedAt         time.Time        `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time        `json:"updated_at" gorm:"autoUpdateTime"`
}

func (p *Project) Exact(tx *gorm.DB, id string) error {
	if err := tx.Preload("Creator").Where("id = ?", id).First(p).Error; err != nil {
		return err
	}
	return nil
}

func (p *Project) ItemsKey() string {
	return fmt.Sprintf("project:%s:items", p.ID)
}

func (p *Project) RefreshTags(tx *gorm.DB, tags []string) error {
	// delete exist tags
	if err := tx.Where("project_id = ?", p.ID).Delete(&ProjectTag{}).Error; err != nil {
		return err
	}
	if len(tags) <= 0 {
		return nil
	}
	// create tags
	projectTags := make([]ProjectTag, len(tags))
	for i, tag := range tags {
		projectTags[i] = ProjectTag{ProjectID: p.ID, Tag: tag}
	}
	if err := tx.Create(&projectTags).Error; err != nil {
		return err
	}
	return nil
}

// GetTags retrieves all tags associated with the project.
func (p *Project) GetTags(tx *gorm.DB) ([]string, error) {
    var tags []string
    if err := tx.Model(&ProjectTag{}).
        Where("project_id = ?", p.ID).
        Distinct("tag").
        Pluck("tag", &tags).Error; err != nil {
        return nil, err
    }
    return tags, nil
}

func (p *Project) CreateItems(ctx context.Context, tx *gorm.DB, items []string) error {
	// skip create
	if len(items) <= 0 {
		return nil
	}
	// create items
	projectItems := make([]ProjectItem, len(items))
	for i, content := range items {
		projectItems[i] = ProjectItem{ProjectID: p.ID, Content: content}
	}
	if err := tx.Create(&projectItems).Error; err != nil {
		return err
	}
	// load item ids
	itemIDs := make([]interface{}, len(projectItems))
	for i, item := range projectItems {
		itemIDs[i] = item.ID
	}
	// push items to redis
	if err := db.Redis.RPush(ctx, p.ItemsKey(), itemIDs...).Err(); err != nil {
		return err
	}
	return nil
}

func (p *Project) PrepareReceive(ctx context.Context) (uint64, error) {
	val, err := db.Redis.LPop(ctx, p.ItemsKey()).Result()
	if errors.Is(err, redis.Nil) {
		return 0, errors.New(NoStock)
	} else if err != nil {
		return 0, err
	}
	return strconv.ParseUint(val, 10, 64)
}

func (p *Project) SameIPCacheKey(ip string) string {
	return fmt.Sprintf("project:%s:receive:ip:%s", p.ID, ip)
}

func (p *Project) CheckSameIPReceived(ctx context.Context, ip string) (bool, error) {
	if p.AllowSameIP {
		return false, nil
	}
	if count, err := db.Redis.Exists(ctx, p.SameIPCacheKey(ip)).Result(); err != nil {
		return false, err
	} else {
		return count > 0, nil
	}
}

func (p *Project) Stock(ctx context.Context) (int64, error) {
	return db.Redis.LLen(ctx, p.ItemsKey()).Result()
}

func (p *Project) HasStock(ctx context.Context) (bool, error) {
	stock, err := p.Stock(ctx)
	if err != nil {
		return false, err
	}
	return stock > 0, nil
}

func (p *Project) IsReceivable(ctx context.Context, user *oauth.User, ip string) error {
	// check time
	now := time.Now()
	if now.Before(p.StartTime) {
		return errors.New(TimeTooEarly)
	} else if p.EndTime.Before(now) {
		return errors.New(TimeTooLate)
	}
	// check trust level
	if user.TrustLevel < p.MinimumTrustLevel {
		return fmt.Errorf(TrustLevelNotMatch, p.MinimumTrustLevel)
	}
	// check risk level
	if user.RiskLevel() > p.RiskLevel {
		return errors.New(UnknownError)
	}
	// check same ip
	if sameIPReceived, err := p.CheckSameIPReceived(ctx, ip); err != nil {
		return err
	} else if sameIPReceived {
		return errors.New(SameIPReceived)
	}
	// check stock
	if hasStock, err := p.HasStock(ctx); err != nil {
		return err
	} else if !hasStock {
		return errors.New(NoStock)
	}
	return nil
}

type ProjectTag struct {
	ID        uint64  `json:"id" gorm:"primaryKey,autoIncrement"`
	ProjectID string  `json:"project_id" gorm:"size:64;index;uniqueIndex:idx_project_tag"`
	Project   Project `json:"-" gorm:"foreignKey:ProjectID"`
	Tag       string  `json:"tag" gorm:"size:16;index;uniqueIndex:idx_project_tag"`
}

type ProjectItem struct {
	ID         uint64      `json:"id" gorm:"primaryKey,autoIncrement"`
	ProjectID  string      `json:"project_id" gorm:"size:64;index;uniqueIndex:idx_project_receiver"`
	Project    Project     `json:"-" gorm:"foreignKey:ProjectID"`
	ReceiverID *uint64     `json:"receiver_id" gorm:"index;uniqueIndex:idx_project_receiver"`
	Receiver   *oauth.User `json:"-" gorm:"foreignKey:ReceiverID"`
	Content    string      `json:"content" gorm:"size:1024"`
	CreatedAt  time.Time   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time   `json:"updated_at" gorm:"autoUpdateTime"`
	ReceivedAt *time.Time  `json:"received_at"`
}

func (p *ProjectItem) Exact(tx *gorm.DB, id uint64) error {
	if err := tx.Where("id = ?", id).First(p).Error; err != nil {
		return err
	}
	return nil
}
