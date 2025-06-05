package project

import (
	"context"
	"fmt"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
	"gorm.io/gorm"
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
	RiskLevel         uint8            `json:"risk_level"`
	CreatorID         uint64           `json:"creator_id" gorm:"index"`
	Creator           oauth.User       `json:"-" gorm:"foreignKey:CreatorID"`
	CreatedAt         time.Time        `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time        `json:"updated_at" gorm:"autoUpdateTime"`
}

func (p *Project) Exact(tx *gorm.DB, id string) error {
	if err := tx.Where("id = ?", id).First(p).Error; err != nil {
		return err
	}
	return nil
}

func (p *Project) ItemsKey() string {
	return fmt.Sprintf("project:%s:items", p.ID)
}

func (p *Project) RefreshTags(tx *gorm.DB, tags []string) error {
	// skip create
	if len(tags) <= 0 {
		return nil
	}
	// delete exist tags
	if err := tx.Where("project_id = ?", p.ID).Delete(&ProjectTag{}).Error; err != nil {
		return err
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
}
