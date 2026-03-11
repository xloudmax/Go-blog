package services

import (
	"context"
	"fmt"
	"io"
	"repair-platform/models"
	"sort"

	"github.com/google/uuid"
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
	// 1. Get query embedding from AI service for vector search
	embedding, err := s.aiService.GetEmbedding(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get query embedding: %w", err)
	}

	// Convert float32 slice to Postgres vector format: '[v1,v2,...]'
	vectorStr := "["
	for i, v := range embedding {
		if i > 0 {
			vectorStr += ","
		}
		vectorStr += fmt.Sprintf("%f", v)
	}
	vectorStr += "]"

	// 2. Perform Hybrid Search to find Seed Nodes
	seedIDs, err := s.getHybridSeeds(ctx, query, vectorStr, 10)
	if err != nil {
		// Fallback to legacy behavior if FTS is not ready
		seedIDs = nil
	}

	// 3. Prepare the Recursive CTE query
	// If we have hybrid seeds, we start from them. Otherwise, we start from pure vector retrieval.
	var cteQuery string
	var queryArgs []any

	if len(seedIDs) > 0 {
		cteQuery = `
		WITH RECURSIVE graph_traversal AS (
			-- Base Case: Hybrid seed nodes
			SELECT id, name, description, type, 0 as hop_level, ARRAY[id] as path
			FROM knowledge_nodes
			WHERE id IN ?

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
		queryArgs = []any{seedIDs, maxHops}
	} else {
		// Fallback: Just pure vector search as base
		cteQuery = `
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
		queryArgs = []any{vectorStr, maxHops}
	}

	var results []models.GraphSearchResult
	if err := s.db.WithContext(ctx).Raw(cteQuery, queryArgs...).Scan(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to execute graph retrieval: %w", err)
	}

	return results, nil
}

// getHybridSeeds combines Vector similarity and Full-Text Search scores using Reciprocal Rank Fusion (RRF).
func (s *GraphRAGService) getHybridSeeds(ctx context.Context, query string, vectorStr string, topN int) ([]uuid.UUID, error) {
	const k = 60 // RRF constant

	// 1. Vector Search Ranking
	var vectorNodes []uuid.UUID
	err := s.db.WithContext(ctx).Raw(`
		SELECT id FROM knowledge_nodes 
		ORDER BY embedding <=> ?::vector LIMIT ?`, vectorStr, topN).Scan(&vectorNodes).Error
	if err != nil {
		return nil, err
	}

	// 2. FTS Search Ranking
	var ftsNodes []uuid.UUID
	err = s.db.WithContext(ctx).Raw(`
		SELECT id FROM knowledge_nodes 
		WHERE search_vector @@ plainto_tsquery('simple', ?)
		ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ?)) DESC
		LIMIT ?`, query, query, topN).Scan(&ftsNodes).Error
	if err != nil {
		return nil, err
	}

	// 3. Reciprocal Rank Fusion
	scores := make(map[uuid.UUID]float64)

	for i, id := range vectorNodes {
		scores[id] += 1.0 / float64(k+(i+1))
	}

	for i, id := range ftsNodes {
		scores[id] += 1.0 / float64(k+(i+1))
	}

	// 4. Sort by RRF score
	type scoredNode struct {
		ID    uuid.UUID
		Score float64
	}
	var sorted []scoredNode
	for id, score := range scores {
		sorted = append(sorted, scoredNode{ID: id, Score: score})
	}

	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Score > sorted[j].Score
	})

	// 5. Return top 3 seed IDs
	var seedIDs []uuid.UUID
	limit := 3
	if len(sorted) < limit {
		limit = len(sorted)
	}
	for i := 0; i < limit; i++ {
		seedIDs = append(seedIDs, sorted[i].ID)
	}

	return seedIDs, nil
}

// GlobalSearch performs a community-based search for broad queries.
func (s *GraphRAGService) GlobalSearch(ctx context.Context, query string) (string, error) {
	return s.aiService.GlobalSearch(ctx, query)
}

// BuildCommunities triggers the community detection and summarization pipeline.
func (s *GraphRAGService) BuildCommunities(ctx context.Context) error {
	return s.aiService.BuildCommunities(ctx)
}

// StreamMechanismTree returns a reader for the streaming tree generation.
func (s *GraphRAGService) StreamMechanismTree(ctx context.Context, query string) (io.ReadCloser, error) {
	return s.aiService.StreamMechanismTree(ctx, query)
}
