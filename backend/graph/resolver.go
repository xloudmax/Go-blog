package graph

import (
	"gorm.io/gorm"
	"repair-platform/services"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	DB *gorm.DB
	SearchService *services.SearchService
}

// NewResolver 创建一个新的resolver实例
func NewResolver(db *gorm.DB) *Resolver {
	return &Resolver{
		DB: db,
		SearchService: services.NewSearchService(db),
	}
}