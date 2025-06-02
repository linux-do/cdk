package oauth

import "time"

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
	LastLoginAt time.Time  `json:"last_login_at;index"`
	CreatedAt   time.Time  `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"autoUpdateTime;index"`
}
