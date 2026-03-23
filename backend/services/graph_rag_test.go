package services

import (
	"os"
	"testing"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestGraphRAGMultiHopReasoning(t *testing.T) {
	// 1. 加载配置
	_ = godotenv.Load("../.env")
	dsn := os.Getenv("POSTGRES_DSN")
	if dsn == "" {
		t.Skip("POSTGRES_DSN not set, skipping integration test")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect: %v", err)
	}

	// 2. 模拟从 'React 19' 的 ID 开始进行多步遍历
	// 我们在 SQL 中手动注入的 React 19 ID 是 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
	seedID := "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
	maxHops := 2

	// 3. 执行项目核心的递归 CTE SQL 逻辑
	cteQuery := `
	WITH RECURSIVE graph_traversal AS (
		-- 基础情况: 从起点开始
		SELECT id, name, 0 as hop_level, ARRAY[id] as path
		FROM knowledge_nodes
		WHERE id = ?::uuid

		UNION ALL

		-- 递归步骤: 查找所有关联的边和节点
		SELECT n.id, n.name, gt.hop_level + 1, gt.path || n.id
		FROM graph_traversal gt
		JOIN knowledge_edges e ON gt.id = e.source_id OR gt.id = e.target_id
		JOIN knowledge_nodes n ON n.id = CASE WHEN gt.id = e.source_id THEN e.target_id ELSE e.source_id END
		WHERE gt.hop_level < ? AND NOT n.id = ANY(gt.path)
	)
	SELECT DISTINCT id, name, MIN(hop_level) as hop_level
	FROM graph_traversal
	GROUP BY id, name
	ORDER BY hop_level;
	`

	type result struct {
		ID       string
		Name     string
		HopLevel int
	}
	var results []result
	if err := db.Raw(cteQuery, seedID, maxHops).Scan(&results).Error; err != nil {
		t.Fatalf("Query failed: %v", err)
	}

	// 4. 验证结果
	t.Logf("Found %d related nodes within %d hops", len(results), maxHops)
	
	names := make(map[string]int)
	for _, r := range results {
		names[r.Name] = r.HopLevel
		t.Logf("- %s (Hop: %d)", r.Name, r.HopLevel)
	}

	// 验证是否找到了 2 跳以外的 GraphRAG
	if _, ok := names["Postgres-Native GraphRAG"]; !ok {
		t.Errorf("Multi-hop reasoning failed: Could not find Postgres-Native GraphRAG from React 19")
	} else {
		t.Log("SUCCESS: Multi-hop reasoning reached the target node 2 hops away!")
	}
}
