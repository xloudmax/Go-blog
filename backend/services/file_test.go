package services

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"github.com/99designs/gqlgen/graphql"
)

type readSeekCloser struct{ *bytes.Reader }

func (r readSeekCloser) Close() error { return nil }

func makeUpload(filename string, data []byte) graphql.Upload {
	return graphql.Upload{File: readSeekCloser{bytes.NewReader(data)}, Filename: filename}
}

func TestFileServiceUploadAndDelete(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "upload-test")
	if err != nil {
		t.Fatalf("temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	os.Setenv("BASE_PATH", tmpDir)
	os.Setenv("ALLOWED_FILE_TYPES", ".png,.jpg")
	os.Setenv("MAX_FILE_SIZE", "1024")

	fs := NewFileService()
	fs.maxSize = 1024
	fs.allowExts = map[string]bool{".png": true, ".jpg": true}

	data := bytes.Repeat([]byte{1}, 100)
	upload := makeUpload("test.png", data)

	resp, err := fs.UploadImage(upload, 1)
	if err != nil {
		t.Fatalf("upload failed: %v", err)
	}

	if resp.Filename == "" || resp.ImageURL == "" {
		t.Fatalf("expected filename and url")
	}

	// delete as owner should succeed
	name := filepath.Base(resp.Filename)
	if err := fs.DeleteImage(name, 1, "USER"); err != nil {
		t.Fatalf("delete should succeed: %v", err)
	}

	// non-owner non-admin should be blocked
	if err := fs.DeleteImage(name, 2, "USER"); err == nil {
		t.Fatalf("expected delete by other user to fail")
	}
	// admin can delete (recreate file first)
	upload = makeUpload("test.png", data)
	resp, err = fs.UploadImage(upload, 1)
	if err != nil {
		t.Fatalf("re-upload failed: %v", err)
	}
	if err := fs.DeleteImage(filepath.Base(resp.Filename), 2, "ADMIN"); err != nil {
		t.Fatalf("admin delete should succeed: %v", err)
	}
}

func TestFileServiceRejectsLargeFile(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "upload-test")
	if err != nil {
		t.Fatalf("temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	os.Setenv("BASE_PATH", tmpDir)
	os.Setenv("ALLOWED_FILE_TYPES", ".png")
	os.Setenv("MAX_FILE_SIZE", "10") // very small

	fs := NewFileService()
	fs.maxSize = 10
	fs.allowExts = map[string]bool{".png": true}
	data := bytes.Repeat([]byte{1}, 50)
	upload := makeUpload("big.png", data)

	if _, err := fs.UploadImage(upload, 1); err == nil {
		t.Fatalf("expected upload to fail due to size limit")
	}
}

func TestFileServiceRejectsDisallowedExt(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "upload-test")
	if err != nil {
		t.Fatalf("temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	os.Setenv("BASE_PATH", tmpDir)
	os.Setenv("ALLOWED_FILE_TYPES", ".png")
	fs := NewFileService()
	fs.allowExts = map[string]bool{".png": true}

	data := bytes.Repeat([]byte{1}, 10)
	upload := makeUpload("bad.txt", data)
	if _, err := fs.UploadImage(upload, 1); err == nil {
		t.Fatalf("expected disallowed extension to be rejected")
	}
}
