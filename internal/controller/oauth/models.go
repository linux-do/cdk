package oauth

type OAuthUserInfo struct {
	Id         int    `json:"id"`
	Username   string `json:"username"`
	Name       string `json:"name"`
	Active     bool   `json:"active"`
	AvatarUrl  string `json:"avatar_url"`
	TrustLevel int    `json:"trust_level"`
}
