package migrator

import (
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/db"
	"log"
)

func Migrate() {
	if err := db.DB.AutoMigrate(&oauth.User{}); err != nil {
		log.Fatalf("[MySQL] auto migrate %T failed: %v\n", oauth.User{}, err)
	}
	log.Printf("[MySQL] auto migrate %T success\n", oauth.User{})
}
