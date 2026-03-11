package services

import (
	"context"
	"fmt"
	"repair-platform/models"

	"gorm.io/gorm"
)

type GraphRAGService struct {
	db        *gorm.DB
	aiService *AIService
}

func NewGraphRAGService(db *gorm.DB, ai *AIService) *GraphRAGService {
	return &GraphRAGService{
		db:        db,
		aiService: ai,
	}
}

// LocalSearch performs a multi-hop graph retrieval based on a natural language query.
func (s *GraphRAGService) LocalSearch(ctx context.Context, query string, maxHops int) ([]models.GraphSearchResult, error) {
	// 1. Get query embedding from AI service
	embedding, err := s.aiService.GetEmbedding(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get query embedding: %w", err)
	}

	// 2. Prepare the Recursive CTE query
	// We use GORM's Raw SQL to execute this Postgres-specific query.
	// Note: the embedding uses the <=> operator for cosine similarity.
	cteQuery := `
	WITH RECURSIVE graph_traversal AS (
		-- Base Case: Semantic retrieval
		SELECT id, name, description, type, 0 as hop_level, ARRAY[id] as path
		FROM knowledge_nodes
		ORDER BY embedding <=> ?::vector LIMIT 3

		UNION ALL

		-- Recursive Step: Multi-hop traversal
		SELECT n.id, n.name, n.description, n.type, gt.hop_level + 1, gt.path || n.id
		FROM graph_traversal gt
		JOIN knowledge_edges e ON gt.id = e.source_id OR gt.id = e.target_id
		JOIN knowledge_nodes n ON n.id = CASE WHEN gt.id = e.source_id THEN e.target_id ELSE e.source_id END
		WHERE gt.hop_level < ? AND NOT n.id = ANY(gt.path)
	)
	SELECT DISTINCT id, name, description, type, MIN(hop_level) as hop_level
	FROM graph_traversal
	GROUP BY id, name, description, type
	ORDER BY hop_level, name;
	`

	// Convert float32 slice to Postgres vector format: '[v1,v2,...]'
	vectorStr := "["
	for i, v := range embedding {
		if i > 0 {
			vectorStr += ","
		}
		vectorStr += fmt.Sprintf("%f", v)
	}
	vectorStr += "]"

	var results []models.GraphSearchResult
	if err := s.db.WithContext(ctx).Raw(cteQuery, vectorStr, maxHops).Scan(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to execute graph retrieval: %w", err)
	}

	return results, nil
}
