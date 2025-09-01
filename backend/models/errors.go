package models

import "errors"

// 定义常用错误
var (
	ErrUserNotFound            = errors.New("用户未找到")
	ErrUserExists              = errors.New("用户已存在")
	ErrInvalidCredentials      = errors.New("用户名或密码错误")
	ErrAccountLocked           = errors.New("账户已被锁定，请稍后再试")
	ErrEmailNotVerified        = errors.New("邮箱未验证")
	ErrInvalidToken            = errors.New("无效的令牌")
	ErrTokenExpired            = errors.New("令牌已过期")
	ErrInviteCodeNotFound      = errors.New("邀请码不存在")
	ErrInviteCodeExpired       = errors.New("邀请码已过期")
	ErrInviteCodeNotUsable     = errors.New("邀请码不可用")
	ErrInviteCodeAlreadyUsed   = errors.New("邀请码已使用")
	ErrVerificationCodeInvalid = errors.New("验证码无效")
	ErrVerificationCodeExpired = errors.New("验证码已过期")
	ErrPostNotFound            = errors.New("文章不存在")
	ErrBlogPostNotFound        = errors.New("博客文章未找到")
	ErrUnauthorized            = errors.New("未授权访问")
	ErrForbidden               = errors.New("禁止访问")
	ErrInternalServerError     = errors.New("内部服务器错误")
)

// ResponseCode 定义响应代码常量
const (
	SuccessCode                      = "SUCCESS"
	ErrorCodeUserNotFound            = "USER_NOT_FOUND"
	ErrorCodeUserExists              = "USER_EXISTS"
	ErrorCodeInvalidCredentials      = "INVALID_CREDENTIALS"
	ErrorCodeAccountLocked           = "ACCOUNT_LOCKED"
	ErrorCodeEmailNotVerified        = "EMAIL_NOT_VERIFIED"
	ErrorCodeInvalidToken            = "INVALID_TOKEN"
	ErrorCodeTokenExpired            = "TOKEN_EXPIRED"
	ErrorCodeInviteCodeNotFound      = "INVITE_CODE_NOT_FOUND"
	ErrorCodeInviteCodeExpired       = "INVITE_CODE_EXPIRED"
	ErrorCodeInviteCodeNotUsable     = "INVITE_CODE_NOT_USABLE"
	ErrorCodeVerificationCodeInvalid = "VERIFICATION_CODE_INVALID"
	ErrorCodeVerificationCodeExpired = "VERIFICATION_CODE_EXPIRED"
	ErrorCodeBlogPostNotFound        = "BLOG_POST_NOT_FOUND"
	ErrorCodeUnauthorized            = "UNAUTHORIZED"
	ErrorCodeForbidden               = "FORBIDDEN"
	ErrorCodeInternalServerError     = "INTERNAL_SERVER_ERROR"
)
