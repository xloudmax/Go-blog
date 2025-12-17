package models

import (
	"testing"
	"time"
)

func TestMemoryCacheSetGetExpireAndStop(t *testing.T) {
	c := NewMemoryCache(5 * time.Millisecond)
	c.Set("key", "value", 10*time.Millisecond)

	if v, ok := c.Get("key"); !ok || v.(string) != "value" {
		t.Fatalf("expected value from cache")
	}

	// wait for expiration
	time.Sleep(15 * time.Millisecond)
	if _, ok := c.Get("key"); ok {
		t.Fatalf("expected key to expire")
	}

	c.Stop() // ensure janitor goroutine can be stopped without panic
}

func TestEmailVerificationService(t *testing.T) {
	evs := NewEmailVerificationService()
	code, err := evs.GenerateVerificationCode("a@example.com", "LOGIN")
	if err != nil {
		t.Fatalf("generate code failed: %v", err)
	}

	if !evs.VerifyCode("a@example.com", code, "LOGIN") {
		t.Fatalf("expected verify success")
	}

	if evs.VerifyCode("a@example.com", code, "LOGIN") {
		t.Fatalf("code should not verify twice")
	}

	evs.Stop()
}
