package oauth

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"server/internal/plugin/common/config"
)

// TokenResponse token响应结构
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
}

// UserInfo 用户信息结构
type UserInfo struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Token    string `json:"accesstoken"`
}

// OAuthService OAuth服务
type OAuthService struct {
	config *config.Config
}

// NewOAuthService 创建OAuth服务实例
func NewOAuthService() *OAuthService {
	return &OAuthService{
		config: config.AppConfig,
	}
}

// GetAuthorizationURL 获取授权URL
func (s *OAuthService) GetAuthorizationURL(state string) string {
	fmt.Sprintf("\v", s.config.OAuth2)
	return fmt.Sprintf("%s?client_id=%s&response_type=code&redirect_uri=%s&state=%s",
		s.config.OAuth2.AuthorizationEndpoint,
		s.config.OAuth2.ClientID,
		url.QueryEscape(s.config.OAuth2.RedirectURI),
		state)
}

// GetUserInfo 通过授权码获取用户信息
func (s *OAuthService) GetUserInfo(code string) (*UserInfo, error) {
	token, err := s.exchangeCodeForToken(code)
	if err != nil {
		return nil, fmt.Errorf("获取访问令牌失败: %w", err)
	}

	userInfo, err := s.fetchUserInfo(token.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("获取用户信息失败: %w", err)
	}
	userInfo.Token = token.AccessToken
	return userInfo, nil
}

// exchangeCodeForToken 用授权码交换访问令牌
func (s *OAuthService) exchangeCodeForToken(code string) (*TokenResponse, error) {
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("redirect_uri", s.config.OAuth2.RedirectURI)

	req, err := http.NewRequest("POST", s.config.OAuth2.TokenEndpoint, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(s.config.OAuth2.ClientID, s.config.OAuth2.ClientSecret)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("发送请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token请求失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("解析token响应失败: %w", err)
	}

	return &tokenResp, nil
}

// fetchUserInfo 使用访问令牌获取用户信息
func (s *OAuthService) fetchUserInfo(accessToken string) (*UserInfo, error) {
	req, err := http.NewRequest("GET", s.config.OAuth2.UserEndpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("创建用户信息请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("发送用户信息请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取用户信息响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("用户信息请求失败，状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}

	var userInfo UserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, fmt.Errorf("解析用户信息响应失败: %w", err)
	}

	return &userInfo, nil
}
