// 统一错误处理系统使用指南
//
// 本文档说明如何在项目中使用统一的错误处理系统

package utils

// 使用示例：

// 1. 在服务层使用预定义错误
// func exampleService() error {
// 	// 直接使用预定义错误
// 	return ErrUserNotFound
//
// 	// 包装底层错误
// 	return ErrDatabaseError.Wrap(dbErr)
//
// 	// 添加上下文
// 	return ErrInvalidInput.WithContext("field", "username")
// }

// 2. 在GraphQL resolver中使用
// func exampleResolver() error {
// 	// 使用便捷的错误处理函数
// 	return graph.HandleAuthError(err)
// 	return graph.HandleBusinessError(err)
// 	return graph.HandleValidationError(err)
//
// 	// 或直接使用预定义错误处理
// 	return graph.HandleUnauthorized()
// 	return graph.HandleNotFound("用户")
// }

// 3. 创建自定义错误
// func createCustomErrors() {
// 	// 创建特定类型的错误
// 	validationErr := NewValidationError("INVALID_PHONE", "手机号格式不正确")
// 	businessErr := NewBusinessError("ORDER_EXPIRED", "订单已过期")
//
// 	// 使用便捷函数
// 	dbErr := models.NewDatabaseError("创建用户", originalErr)
// }

// 4. 错误检查
// func checkErrors(err error) {
// 	// 检查错误类型
// 	if IsAuthError(err) { /* 处理认证错误 */ }
// 	if IsValidationError(err) { /* 处理验证错误 */ }
//
// 	// 检查是否为应用错误
// 	if IsAppError(err) {
// 		appErr := err.(*AppError)
// 		// 可以访问结构化信息
// 		_ = appErr.Code
// 		_ = appErr.Category
// 		_ = appErr.Context
// 	}
// }

// 错误标准：
// - 所有错误代码使用 UPPER_CASE_WITH_UNDERSCORES 格式
// - 错误消息使用中文，不包含冒号（除非是内容需要）
// - 统一使用中文标点符号
// - 错误分类明确（AUTH, PERMISSION, VALIDATION, BUSINESS, NOT_FOUND, DATABASE, SYSTEM）
// - 错误级别准确（INFO, WARNING, ERROR, CRITICAL）

// 迁移指南：
// 旧代码:
//   return fmt.Errorf("用户不存在: %w", err)
//   return errors.New("无效的输入")
//
// 新代码:
//   return models.ErrUserNotFound.Wrap(err)
//   return models.ErrInvalidInput
//
// GraphQL resolver中:
//   return graph.HandleBusinessError(err)

// GuideExample 示例函数（仅用于演示，实际使用时可删除）
func GuideExample() {
	// 这个函数仅用于展示API用法，防止编译错误
	// 实际项目中可以删除这个函数
}