package services

import (
	"context"
	"fmt"
	"io"
	"repair-platform/models"
	"sort"
	"strings"

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

// GraphFullResult represents a sub-graph with nodes and edges.
type GraphFullResult struct {
	Nodes []models.GraphSearchResult `json:"nodes"`
	Edges []models.GraphEdge         `json:"edges"`
}

// LocalSearch performs a multi-hop graph retrieval and returns the full sub-graph.
func (s *GraphRAGService) LocalSearch(ctx context.Context, query string, maxHops int) (*GraphFullResult, error) {
	// 1. Get query embedding
	embedding, err := s.aiService.GetEmbedding(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get query embedding: %w", err)
	}

	vectorStr := "["
	for i, v := range embedding {
		if i > 0 {
			vectorStr += ","
		}
		vectorStr += fmt.Sprintf("%f", v)
	}
	vectorStr += "]"

	// 2. Perform Hybrid Search
	seedIDs, _ := s.getHybridSeeds(ctx, query, vectorStr, 10)

	// 3. Prepare Recursive CTE
	var cteQuery string
	var queryArgs []any

	if len(seedIDs) > 0 {
		cteQuery = `
		WITH RECURSIVE graph_traversal AS (
			SELECT id, name, description, type, community_id, 0 as hop_level, ARRAY[id] as path
			FROM knowledge_nodes
			WHERE id IN ?
			UNION ALL
			SELECT n.id, n.name, n.description, n.type, n.community_id, gt.hop_level + 1, gt.path || n.id
			FROM graph_traversal gt
			JOIN knowledge_edges e ON gt.id = e.source_id OR gt.id = e.target_id
			JOIN knowledge_nodes n ON n.id = CASE WHEN gt.id = e.source_id THEN e.target_id ELSE e.source_id END
			WHERE gt.hop_level < ? AND NOT n.id = ANY(gt.path)

		)
		SELECT DISTINCT id, name, description, type, community_id, MIN(hop_level) as hop_level
		FROM graph_traversal
		GROUP BY id, name, description, type, community_id
		ORDER BY hop_level ASC
		LIMIT 100;`
		queryArgs = []any{seedIDs, maxHops}
	} else {

		cteQuery = `
		WITH RECURSIVE graph_traversal AS (
			SELECT id, name, description, type, community_id, 0 as hop_level, ARRAY[id] as path
			FROM knowledge_nodes
			ORDER BY embedding <=> ?::vector LIMIT 3
			UNION ALL
			SELECT n.id, n.name, n.description, n.type, n.community_id, gt.hop_level + 1, gt.path || n.id
			FROM graph_traversal gt
			JOIN knowledge_edges e ON gt.id = e.source_id OR gt.id = e.target_id
			JOIN knowledge_nodes n ON n.id = CASE WHEN gt.id = e.source_id THEN e.target_id ELSE e.source_id END
			WHERE gt.hop_level < ? AND NOT n.id = ANY(gt.path)

		)
		SELECT DISTINCT id, name, description, type, community_id, MIN(hop_level) as hop_level
		FROM graph_traversal
		GROUP BY id, name, description, type, community_id
		ORDER BY hop_level ASC
		LIMIT 100;`
		queryArgs = []any{vectorStr, maxHops}
	}

	var nodes []models.GraphSearchResult
	if err := s.db.WithContext(ctx).Raw(cteQuery, queryArgs...).Scan(&nodes).Error; err != nil {
		return nil, err
	}

	// 4. Fetch all edges connecting these nodes to reconstruct the topology
	nodeIDs := make([]uuid.UUID, len(nodes))
	for i, n := range nodes {
		nodeIDs[i] = n.ID
	}

	var edges []models.GraphEdge
	if len(nodeIDs) > 0 {
		s.db.WithContext(ctx).
			Table("knowledge_edges").
			Where("source_id IN ? AND target_id IN ?", nodeIDs, nodeIDs).
			Find(&edges)
	}

	return &GraphFullResult{
		Nodes: nodes,
		Edges: edges,
	}, nil
}

// getHybridSeeds combines Vector similarity, Full-Text Search, and Fuzzy matching using Reciprocal Rank Fusion (RRF).
func (s *GraphRAGService) getHybridSeeds(ctx context.Context, query string, vectorStr string, topN int) ([]uuid.UUID, error) {
	const k = 60 // RRF constant

	// 1. Vector Search Ranking (Semantic Signal)
	var vectorNodes []uuid.UUID
	err := s.db.WithContext(ctx).Raw(`
		SELECT id FROM knowledge_nodes 
		ORDER BY embedding <=> ?::vector LIMIT ?`, vectorStr, topN).Scan(&vectorNodes).Error
	if err != nil {
		fmt.Printf("Vector search failed, falling back to text-only: %v\n", err)
	}

	// 2. FTS Search Ranking (Extreme Title Primacy - 5.0x)
	var ftsNodes []uuid.UUID
	err = s.db.WithContext(ctx).Raw(`
		SELECT id FROM knowledge_nodes 
		WHERE search_vector @@ websearch_to_tsquery('simple', ?)
		ORDER BY (
			ts_rank(setweight(to_tsvector('simple', name), 'A'), websearch_to_tsquery('simple', ?)) * 5.0 + 
			ts_rank(setweight(to_tsvector('simple', description), 'B'), websearch_to_tsquery('simple', ?))
		) DESC
		LIMIT ?`, query, query, query, topN).Scan(&ftsNodes).Error
	if err != nil {
		fmt.Printf("FTS search failed: %v\n", err)
	}

	// 3. Trigram Fuzzy Matching (Fuzzy/Typo Signal)
	var fuzzyNodes []uuid.UUID
	err = s.db.WithContext(ctx).Raw(`
		SELECT id FROM knowledge_nodes 
		WHERE name % ? 
		ORDER BY similarity(name, ?) DESC
		LIMIT ?`, query, query, topN).Scan(&fuzzyNodes).Error
	if err != nil {
		fmt.Printf("Fuzzy search failed: %v\n", err)
	}

	// 4. Weighted & Type-Aware Reciprocal Rank Fusion
	scores := make(map[uuid.UUID]float64)
	
	const (
		wVector = 1.0
		wFTS    = 3.0 // Further increased from 2.0
		wFuzzy  = 0.3 // Further reduced to minimize drift
	)

	// Fetch metas for boosting
	type nodeMeta struct {
		ID          uuid.UUID
		Type        string
		Name        string
		Description string
	}
	var metas []nodeMeta
	s.db.Table("knowledge_nodes").Select("id, type, name, description").Find(&metas)
	
	// Helper to check for word overlap
	queryWords := strings.Fields(strings.ToLower(query))

	applyWeight := func(id uuid.UUID, baseScore float64) float64 {
		multiplier := 1.0
		
		var m nodeMeta
		for _, v := range metas {
			if v.ID == id { m = v; break }
		}

		nameLower := strings.ToLower(m.Name)
		descLower := strings.ToLower(m.Description) // Assume we added Description to nodeMeta
		
		hasOverlap := false
		for _, word := range queryWords {
			if len(word) > 3 { // Only consider meaningful long keywords
				if strings.Contains(nameLower, word) {
					multiplier *= 5.0 // MASSIVE boost for title match
					hasOverlap = true
					break
				}
				if strings.Contains(descLower, word) {
					hasOverlap = true
				}
			}
		}

		// Hard Filter: If neither name nor description contains any keyword, penalize heavily
		if !hasOverlap && len(queryWords) > 0 {
			multiplier *= 0.01 
		}

		// Noise Node Penalty: Demote meta-components that soak up too many keywords
		if strings.Contains(nameLower, "container") || strings.Contains(nameLower, "page") || strings.Contains(nameLower, "layout") {
			multiplier *= 0.5
		}
		
		return baseScore * multiplier
	}

	for i, id := range vectorNodes {
		scores[id] += applyWeight(id, wVector / float64(k+(i+1)))
	}
	for i, id := range ftsNodes {
		scores[id] += applyWeight(id, wFTS / float64(k+(i+1)))
	}
	for i, id := range fuzzyNodes {
		scores[id] += applyWeight(id, wFuzzy / float64(k+(i+1)))
	}

	// 5. Sort by RRF score
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

	// 6. Return top 5 seed IDs (expanded from 3 to 5 for better graph entry points)
	var seedIDs []uuid.UUID
	limit := 5
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
