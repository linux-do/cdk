package project

import (
	"github.com/linux-do/cdk/internal/apps/oauth"
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
	ReceiverID uint64      `json:"receiver_id" gorm:"index;uniqueIndex:idx_project_receiver"`
	Receiver   *oauth.User `json:"-" gorm:"foreignKey:ReceiverID"`
	Content    string      `json:"content" gorm:"size:1024"`
	CreatedAt  time.Time   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time   `json:"updated_at" gorm:"autoUpdateTime"`
}
