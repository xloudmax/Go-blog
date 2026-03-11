package models

import (
	"testing"
	"time"
)

func TestMemoryCacheSetGetExpireAndStop(t *testing.T) {
	c := NewMemoryCache(5 * time.Millisecond)
	c.Set("key", "value", 10*time.Millisecond)

	var v string
	if ok := c.Get("key", &v); !ok || v != "value" {
		t.Fatalf("expected value from cache")
	}

	// wait for expiration
	time.Sleep(15 * time.Millisecond)
	if ok := c.Get("key", &v); ok {
		t.Fatalf("expected key to expire")
	}

	c.Stop() // ensure janitor goroutine can be stopped without panic
}

func TestEmailVerificationService(t *testing.T) {
	c := NewMemoryCache(1 * time.Minute)
	evs := NewEmailVerificationService(c)
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
