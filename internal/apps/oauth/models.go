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

package oauth

import (
	"time"

	"gorm.io/gorm"
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
	ID             uint64     `json:"id" gorm:"primaryKey"`
	Username       string     `json:"username" gorm:"size:255;unique"`
	Nickname       string     `json:"nickname" gorm:"size:255"`
	AvatarUrl      string     `json:"avatar_url" gorm:"size:255"`
	IsActive       bool       `json:"is_active" gorm:"default:true"`
	TrustLevel     TrustLevel `json:"trust_level"`
	Score          int8       `json:"score"`
	ViolationCount uint8      `json:"violation_count" gorm:"default:0"`
	IsAdmin        bool       `json:"is_admin" gorm:"default:false"`
	LastLoginAt    time.Time  `json:"last_login_at" gorm:"index"`
	CreatedAt      time.Time  `json:"created_at" gorm:"autoCreateTime;index"`
	UpdatedAt      time.Time  `json:"updated_at" gorm:"autoUpdateTime;index"`
}

func (u *User) Exact(tx *gorm.DB, id uint64) error {
	if err := tx.Where("id = ?", id).First(u).Error; err != nil {
		return err
	}
	return nil
}

func (u *User) SetScore(tx *gorm.DB, newScore int) error {
	if newScore < MinUserScore {
		u.Score = MinUserScore
	} else if newScore > MaxUserScore {
		u.Score = MaxUserScore
	} else {
		u.Score = int8(newScore)
	}
	return tx.Model(u).Update("score", u.Score).Error
}

func (u *User) RiskLevel() int8 {
	return BaseUserScore - u.Score
}
