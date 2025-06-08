package oauth

import (
	"gorm.io/gorm"
	"time"
)

type OAuthUserInfo struct {
	Id         uint64     `json:"id"`
	Username   string     `json:"username"`
	Name       string     `json:"name"`
	Active     bool       `json:"active"`
	AvatarUrl  string     `json:"avatar_url"`
	TrustLevel TrustLevel `json:"trust_level"`
}

type User struct {
	ID          uint64     `json:"id" gorm:"primaryKey"`
	Username    string     `json:"username" gorm:"size:255;unique"`
	Nickname    string     `json:"nickname" gorm:"size:255"`
	AvatarUrl   string     `json:"avatar_url" gorm:"size:255"`
	IsActive    bool       `json:"is_active" gorm:"default:true"`
	TrustLevel  TrustLevel `json:"trust_level"`
	Score       int8       `json:"score"`
	LastLoginAt time.Time  `json:"last_login_at;index"`
	CreatedAt   time.Time  `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"autoUpdateTime;index"`
}

func (u *User) Exact(tx *gorm.DB, id uint64) error {
	if err := tx.Where("id = ?", id).First(u).Error; err != nil {
		return err
	}
	return nil
}

func (u *User) SetScore(tx *gorm.DB, score int8) error {
	if score < MinUserScore {
		u.Score = MinUserScore
	} else if score > MaxUserScore {
		u.Score = MaxUserScore
	}
	return tx.Model(u).Update("score", u.Score).Error
}

func (u *User) RiskLevel() int8 {
	return BaseUserScore - u.Score
}
