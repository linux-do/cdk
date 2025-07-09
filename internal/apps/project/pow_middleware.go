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
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/cdk/internal/db"
)

const (
	POW_DIFFICULTY = 18
	POW_EXPIRY     = 5 * 60 // 5 minutes in seconds
)

type POWChallenge struct {
	Challenge string `json:"challenge"`
	ExpiresAt int64  `json:"expires_at"`
}

type POWResponse struct {
	ErrorMsg string       `json:"error_msg"`
	Data     POWChallenge `json:"data"`
}

func POWMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查是否为获取项目列表的请求
		if c.Request.Method != "GET" || c.Request.URL.Path != "/api/v1/projects" {
			c.Next()
			return
		}

		// 获取 PoW 相关头部
		challenge := c.GetHeader("X-POW-Challenge")
		nonce := c.GetHeader("X-POW-Nonce")

		// 如果没有 PoW 头部，返回 challenge
		if challenge == "" || nonce == "" {
			newChallenge := generateChallenge()
			expiresAt := time.Now().Unix() + POW_EXPIRY
			
			// 存储 challenge 到 Redis
			key := fmt.Sprintf("pow_challenge:%s", newChallenge)
			err := db.Redis.Set(c.Request.Context(), key, "1", time.Duration(POW_EXPIRY)*time.Second).Err()
			if err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, POWResponse{
					ErrorMsg: "Failed to generate challenge",
				})
				return
			}

			c.AbortWithStatusJSON(http.StatusUnauthorized, POWResponse{
				ErrorMsg: "POW challenge required",
				Data: POWChallenge{
					Challenge: newChallenge,
					ExpiresAt: expiresAt,
				},
			})
			return
		}

		// 验证 PoW
		if !verifyPOW(c, challenge, nonce) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, POWResponse{
				ErrorMsg: "Invalid POW solution",
			})
			return
		}

		// 验证通过，继续处理请求
		c.Next()
	}
}

func generateChallenge() string {
	// 生成安全的随机挑战
	bytes := make([]byte, 16)
	rand.Read(bytes)
	randomPart := hex.EncodeToString(bytes)
	return fmt.Sprintf("%d_%s", time.Now().UnixNano(), randomPart)
}

func verifyPOW(c *gin.Context, challenge, nonceStr string) bool {
	// 检查 challenge 是否存在且未过期
	key := fmt.Sprintf("pow_challenge:%s", challenge)
	exists, err := db.Redis.Exists(c.Request.Context(), key).Result()
	if err != nil || exists == 0 {
		return false
	}

	// 删除 challenge 以防重放攻击
	db.Redis.Del(c.Request.Context(), key)

	// 验证 nonce
	nonce, err := strconv.ParseUint(nonceStr, 10, 64)
	if err != nil {
		return false
	}

	// 计算哈希
	input := fmt.Sprintf("%s:%d", challenge, nonce)
	hash := sha256.Sum256([]byte(input))
	hashStr := hex.EncodeToString(hash[:])

	// 检查是否满足难度要求 (前18位为0)
	return strings.HasPrefix(hashStr, strings.Repeat("0", POW_DIFFICULTY))
}