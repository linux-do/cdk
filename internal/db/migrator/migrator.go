package migrator

import (
	"context"
	"github.com/linux-do/cdk/internal/apps/oauth"
	"github.com/linux-do/cdk/internal/apps/project"
	"github.com/linux-do/cdk/internal/db"
	"log"
)

func Migrate() {
	if err := db.DB(context.Background()).AutoMigrate(
		&oauth.User{},
		&project.Project{},
		&project.ProjectItem{},
		&project.ProjectTag{},
	); err != nil {
		log.Fatalf("[MySQL] auto migrate failed: %v\n", err)
	}
	log.Printf("[MySQL] auto migrate success\n")
}
