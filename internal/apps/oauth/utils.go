package oauth

import "github.com/gin-contrib/sessions"

func GetUsernameFromSession(s sessions.Session) string {
	username, ok := s.Get(UserNameKey).(string)
	if !ok {
		return ""
	}
	return username
}

func GetUserIDFromSession(s sessions.Session) uint64 {
	userID, ok := s.Get(UserIDKey).(uint64)
	if !ok {
		return 0
	}
	return userID
}
