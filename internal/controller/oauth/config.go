package oauth

import (
	"github.com/linux-do/cdk/internal/config"
	"golang.org/x/oauth2"
)

var oauthConf *oauth2.Config

func init() {
	oauthConf = &oauth2.Config{
		ClientID:     config.Config.OAuth2.ClientID,
		ClientSecret: config.Config.OAuth2.ClientSecret,
		RedirectURL:  config.Config.OAuth2.RedirectURI,
		Scopes:       []string{"user:email:profile"},
		Endpoint: oauth2.Endpoint{
			AuthURL:   config.Config.OAuth2.AuthorizationEndpoint,
			TokenURL:  config.Config.OAuth2.TokenEndpoint,
			AuthStyle: 0,
		},
	}
}
