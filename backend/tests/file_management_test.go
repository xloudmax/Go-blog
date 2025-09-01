package tests

import (
	testing_helper "repair-platform/testing"
	"testing"
)

// TestFileManagement 测试文件管理 GraphQL 接口
func TestFileManagement(t *testing.T) {
	// 设置测试环境
	helper := testing_helper.SetupTestEnvironment(t)
	defer helper.TeardownTestEnvironment()

	// 注册测试用户
	registerVariables := map[string]interface{}{
		"input": map[string]interface{}{
			"username": "fileuser",
			"email":    "fileuser@example.com",
			"password": "password123",
		},
	}

	_, registerResponse, err := helper.MakeGraphQLRequest(testing_helper.TestQueries.Register, registerVariables, "")
	if err != nil {
		t.Fatalf("用户注册失败: %v", err)
	}
	helper.AssertNoGraphQLErrors(t, registerResponse)

	// 获取token
	data := registerResponse.Data.(map[string]interface{})
	registerData := data["register"].(map[string]interface{})
	token := registerData["token"].(string)

	t.Run("获取文件夹列表", func(t *testing.T) {
		query := `
			query {
				folders {
					name
					path
					fileCount
					createdAt
				}
			}
		`

		_, response, err := helper.MakeGraphQLRequest(query, nil, token)
		if err != nil {
			t.Fatalf("获取文件夹列表失败: %v", err)
		}
		helper.AssertNoGraphQLErrors(t, response)

		data := response.Data.(map[string]interface{})
		folders := data["folders"].([]interface{})
		t.Logf("获取到 %d 个文件夹", len(folders))
	})

	t.Run("创建文件夹", func(t *testing.T) {
		mutation := `
			mutation($input: CreateFolderInput!) {
				createFolder(input: $input) {
					name
					path
					fileCount
					createdAt
				}
			}
		`

		variables := map[string]interface{}{
			"input": map[string]interface{}{
				"name": "test_folder",
			},
		}

		_, response, err := helper.MakeGraphQLRequest(mutation, variables, token)
		if err != nil {
			t.Fatalf("创建文件夹失败: %v", err)
		}
		helper.AssertNoGraphQLErrors(t, response)

		data := response.Data.(map[string]interface{})
		folder := data["createFolder"].(map[string]interface{})
		if folder["name"] != "test_folder" {
			t.Errorf("Expected folder name to be 'test_folder', got %v", folder["name"])
		}
		t.Logf("成功创建文件夹: %s", folder["name"])
	})

	t.Run("获取文件列表", func(t *testing.T) {
		query := `
			query($folder: String!) {
				files(folder: $folder) {
					name
					folder
					size
					createdAt
					updatedAt
				}
			}
		`

		variables := map[string]interface{}{
			"folder": "test_folder",
		}

		_, response, err := helper.MakeGraphQLRequest(query, variables, token)
		if err != nil {
			t.Fatalf("获取文件列表失败: %v", err)
		}
		helper.AssertNoGraphQLErrors(t, response)

		data := response.Data.(map[string]interface{})
		files := data["files"].([]interface{})
		t.Logf("test_folder 中有 %d 个文件", len(files))
	})

	t.Run("更新文件内容", func(t *testing.T) {
		mutation := `
			mutation($input: UpdateFileInput!) {
				updateFile(input: $input) {
					name
					folder
					content
					size
					updatedAt
				}
			}
		`

		variables := map[string]interface{}{
			"input": map[string]interface{}{
				"folder":   "test_folder",
				"fileName": "test.md",
				"content":  "# Test Markdown\n\nThis is a test file.",
			},
		}

		_, response, err := helper.MakeGraphQLRequest(mutation, variables, token)
		if err != nil {
			t.Fatalf("更新文件内容失败: %v", err)
		}
		helper.AssertNoGraphQLErrors(t, response)

		data := response.Data.(map[string]interface{})
		file := data["updateFile"].(map[string]interface{})
		if file["name"] != "test.md" {
			t.Errorf("Expected file name to be 'test.md', got %v", file["name"])
		}
		t.Logf("成功更新文件: %s", file["name"])
	})

	t.Run("获取文件内容", func(t *testing.T) {
		query := `
			query($folder: String!, $fileName: String!) {
				fileContent(folder: $folder, fileName: $fileName) {
					name
					folder
					content
					size
					updatedAt
				}
			}
		`

		variables := map[string]interface{}{
			"folder":   "test_folder",
			"fileName": "test.md",
		}

		_, response, err := helper.MakeGraphQLRequest(query, variables, token)
		if err != nil {
			t.Fatalf("获取文件内容失败: %v", err)
		}
		helper.AssertNoGraphQLErrors(t, response)

		data := response.Data.(map[string]interface{})
		file := data["fileContent"].(map[string]interface{})
		content := file["content"].(string)
		if content != "# Test Markdown\n\nThis is a test file." {
			t.Errorf("文件内容不匹配，期望: '# Test Markdown\\n\\nThis is a test file.'，得到: %s", content)
		}
		t.Logf("成功获取文件内容: %s", file["name"])
	})

	t.Run("删除文件", func(t *testing.T) {
		mutation := `
			mutation($folder: String!, $fileName: String!) {
				deleteFile(folder: $folder, fileName: $fileName) {
					success
					message
				}
			}
		`

		variables := map[string]interface{}{
			"folder":   "test_folder",
			"fileName": "test.md",
		}

		_, response, err := helper.MakeGraphQLRequest(mutation, variables, token)
		if err != nil {
			t.Fatalf("删除文件失败: %v", err)
		}
		helper.AssertNoGraphQLErrors(t, response)

		data := response.Data.(map[string]interface{})
		result := data["deleteFile"].(map[string]interface{})
		if !result["success"].(bool) {
			t.Errorf("删除文件失败: %v", result["message"])
		}
		t.Logf("成功删除文件")
	})

	t.Run("删除文件夹", func(t *testing.T) {
		mutation := `
			mutation($name: String!) {
				deleteFolder(name: $name) {
					success
					message
				}
			}
		`

		variables := map[string]interface{}{
			"name": "test_folder",
		}

		_, response, err := helper.MakeGraphQLRequest(mutation, variables, token)
		if err != nil {
			t.Fatalf("删除文件夹失败: %v", err)
		}
		helper.AssertNoGraphQLErrors(t, response)

		data := response.Data.(map[string]interface{})
		result := data["deleteFolder"].(map[string]interface{})
		if !result["success"].(bool) {
			t.Errorf("删除文件夹失败: %v", result["message"])
		}
		t.Logf("成功删除文件夹")
	})
}

// TestFileManagementAuth 测试文件管理权限控制
func TestFileManagementAuth(t *testing.T) {
	// 设置测试环境
	helper := testing_helper.SetupTestEnvironment(t)
	defer helper.TeardownTestEnvironment()

	t.Run("未认证用户无法访问文件管理功能", func(t *testing.T) {
		query := `
			query {
				folders {
					name
					path
				}
			}
		`

		_, response, err := helper.MakeGraphQLRequest(query, nil, "")
		if err != nil {
			t.Fatalf("GraphQL request failed: %v", err)
		}

		// 应该有错误
		if len(response.Errors) == 0 {
			t.Error("Expected authentication error, but got none")
		}
		t.Logf("成功验证未认证用户无法访问文件管理功能")
	})
}
