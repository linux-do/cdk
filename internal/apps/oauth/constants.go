package oauth

import (
	"time"
)

const (
	UserNameKey = "username"
	UserIDKey   = "user_id"
	UserObjKey  = "user_obj"
)

type TrustLevel int8

const (
	TrustLevelNewUser TrustLevel = iota
	TrustLevelBasicUser
	TrustLevelUser
	TrustLevelActiveUser
	TrustLevelLeader
)

const (
	OAuthStateCacheKeyFormat     = "oauth:state:%s"
	OAuthStateCacheKeyExpiration = 10 * time.Minute
)

const (
	BaseUserScore = 100
	MaxUserScore  = 100
	MinUserScore  = -100
)
