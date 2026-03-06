package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"repair-platform/config"
	"repair-platform/models"
	"time"
)

type AIService struct {
	pythonServiceURL string
	client           *http.Client
}

func NewAIService() *AIService {
	cfg := config.GetConfig()

	// Parse timeout
	timeout, err := time.ParseDuration(cfg.AIServiceTimeout)
	if err != nil {
		timeout = 30 * time.Second
	}

	return &AIService{
		pythonServiceURL: cfg.AIServiceURL,
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

type mechanismRequest struct {
	Query string `json:"query"`
}

func (s *AIService) GenerateMechanismTree(ctx context.Context, query string) (*models.MechanismNode, error) {
	reqBody := mechanismRequest{
		Query: query,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Safely construct the URL
	u, err := url.Parse(s.pythonServiceURL)
	if err != nil {
		return nil, fmt.Errorf("invalid AI service URL: %w", err)
	}
	u.Path = "/generate/mechanism-tree"

	req, err := http.NewRequestWithContext(ctx, "POST", u.String(), bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		// Fallback for demo if python service is not running or timeout occurs
		fmt.Printf("AI service error (%v), returning fallback mock data\n", err)
		return getFallbackMockData(query), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("python service returned error: %d - %s", resp.StatusCode, string(bodyBytes))
	}

	var root models.MechanismNode
	if err := json.NewDecoder(resp.Body).Decode(&root); err != nil {
		return nil, fmt.Errorf("failed to decode python service response: %w", err)
	}

	return &root, nil
}

func getFallbackMockData(query string) *models.MechanismNode {
	note := "Service Unavailable - Mocking"
	return &models.MechanismNode{
		ID:    "root",
		Label: fmt.Sprintf("Fallback Mock: %s", query),
		Note:  &note,
		Children: []*models.MechanismNode{
			{
				ID:    "error-node",
				Label: "Python Service Not Reachable or Timeout",
				Children: []*models.MechanismNode{
					{ID: "check-1", Label: "Check if main.py is running"},
					{ID: "check-2", Label: "Check port 8000"},
					{ID: "check-3", Label: "Check network connection and AI_SERVICE_URL"},
				},
			},
		},
	}
}
