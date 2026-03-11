package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"repair-platform/config"
	"repair-platform/models"
	"time"

	"github.com/goccy/go-json"
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

type embeddingRequest struct {
	Text string `json:"text"`
}

type embeddingResponse struct {
	Embedding []float32 `json:"embedding"`
}

// GetEmbedding calls the Python service to simplify embedding generation using the shared OpenAI client.
func (s *AIService) GetEmbedding(ctx context.Context, text string) ([]float32, error) {
	reqBody := embeddingRequest{Text: text}
	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	u, _ := url.Parse(s.pythonServiceURL)
	u.Path = "/embedding" // We'll add this to main.py if not exists, or adapt

	req, _ := http.NewRequestWithContext(ctx, "POST", u.String(), bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ai_service returned %d", resp.StatusCode)
	}

	var res embeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	return res.Embedding, nil
}

func getFallbackMockData(query string) *models.MechanismNode {
	activeIngredient := "Service Unavailable - Mocking"
	return &models.MechanismNode{
		ID:               "root",
		Title:            fmt.Sprintf("Fallback Mock: %s", query),
		ActiveIngredient: &activeIngredient,
		Children: []*models.MechanismNode{
			{
				ID:    "error-node",
				Title: "Python Service Not Reachable or Timeout",
				Children: []*models.MechanismNode{
					{ID: "check-1", Title: "Check if main.py is running"},
					{ID: "check-2", Title: "Check port 8000"},
					{ID: "check-3", Title: "Check network connection and AI_SERVICE_URL"},
				},
			},
		},
	}
}
