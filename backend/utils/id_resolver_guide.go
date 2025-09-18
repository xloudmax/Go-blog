// ID解析系统使用指南
//
// 本文档说明如何在项目中使用统一的ID解析逻辑

package utils

// 示例：在GraphQL resolver中使用统一ID解析
func exampleGraphQLResolver() {
	// 1. 使用ResolverHelper（推荐用于GraphQL resolvers）
	// helper := services.NewResolverHelper(db)
	// post, err := helper.ResolveBlogPost(id, &userID, userRole) // 支持数字ID和Slug
	// user, err := helper.ResolveUser(id) // 支持ID、用户名、邮箱

	// 2. 使用ResourceService（用于复杂查询逻辑）
	// resourceService := services.NewResourceService(db)
	// query := resourceService.FindBlogPost(id, &userID, userRole)
	// if query.Error != nil { /* 处理错误 */ }

	// 3. 使用便捷函数（快速类型转换）
	// numericID, err := utils.ParseNumericID(id) // 仅接受数字ID
	// slug, err := utils.ParseSlugID(id) // 仅接受Slug格式
	// numID, slug, isNumeric, err := utils.ParseFlexibleID(id) // 接受数字或Slug

	// 4. 使用低级API（完全控制）
	// idInfo, err := utils.ParseID(id)
	// if idInfo.IsNumeric() { /* 处理数字ID */ }
	// if idInfo.IsSlug() { /* 处理Slug */ }
}

// 支持的ID格式：
// - 数字ID: "123", "456789" (必须 > 0)
// - Slug: "my-post", "zhong-wen-biao-ti" (2-100字符，字母数字和连字符，不能以连字符开头结尾)
// - UUID: "550e8400-e29b-41d4-a716-446655440000" (标准UUID格式)

// 迁移指南：
// 老代码:
//   postID, err := strconv.ParseUint(id, 10, 64)
//   post, err := blogService.GetPostByID(uint(postID), userID, userRole)
//
// 新代码:
//   helper := services.NewResolverHelper(db)
//   post, err := helper.ResolveBlogPost(id, &userID, userRole)

// 或者，如果需要严格的数字ID：
//   post, err := helper.ResolveBlogPostStrict(id, &userID, userRole)