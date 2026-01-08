# CI/CD Pipeline Documentation

This project uses GitHub Actions for Continuous Integration and Continuous Deployment.

## Workflows

### 1. CI (`.github/workflows/ci.yml`) - Continuous Integration
Runs automatically on every push to `main` and every Pull Request.

**Jobs:**
- **Backend Test**:
  - Validates Go code using `go vet` and `staticcheck`.
  - Runs all unit tests (`go test ./...`).
- **Frontend Check**:
  - Installs dependencies with `pnpm`.
  - lints code with ESLint.
  - Verifies production build success.

### 2. CD (`.github/workflows/cd.yml`) - Continuous Deployment
Runs when a new tag starting with `v` is pushed (e.g., `v1.0.0`).

**Jobs:**
- **Build & Push**:
  - Builds a Docker image for the backend.
  - Logs into GitHub Container Registry (GHCR).
  - Pushes the image tagged with the version and commit SHA.

## Setup Requirements

To enable the CD pipeline, you must configure the following:

1.  **Container Registry**: The workflow defaults to `ghcr.io` and uses the `GITHUB_TOKEN` provided by Actions, so **no secrets are needed** for basic GHCR usage if you are pushing to the repository's own package list.
2.  **DockerHub (Optional)**: If you switch to DockerHub, you will need to add:
    - `DOCKER_USERNAME`
    - `DOCKER_PASSWORD`

## Usage

**To trigger a release:**
```bash
git tag v1.0.0
git push origin v1.0.0
```
