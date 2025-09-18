package services

import (
	"errors"
	"fmt"
	"net/smtp"
	"os"
	"regexp"
	"repair-platform/models"
	"strings"
	"time"

	"gorm.io/gorm"
)

// AuthService 认证服务
type AuthService struct {
	db  *gorm.DB
	evs *models.EmailVerificationService
}

// NewAuthService 创建认证服务实例
func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{
		db:  db,
		evs: models.GetEmailVerificationService(),
	}
}

// Register 用户注册 (统一接口)
func (s *AuthService) Register(input *models.RegisterInput) (*models.User, string, error) {
	user, _, err := s.RegisterUser(input)
	if err != nil {
		return nil, "", err
	}

	// 生成JWT令牌
	token, err := models.GenerateJWT(user.ID, user.Username, user.Role, false)
	if err != nil {
		return nil, "", models.ErrInternalServerError
	}

	return user, token, nil
}


// SendEmailLoginCode 发送邮箱登录验证码
func (s *AuthService) SendEmailLoginCode(email string) error {
	return s.EmailLogin(email)
}
func (s *AuthService) RegisterUser(input *models.RegisterInput) (*models.User, string, error) {
	// 验证输入
	if err := s.validateRegisterInput(input); err != nil {
		return nil, "", err
	}

	// 检查用户名和邮箱是否已存在
	if err := s.checkUserExists(input.Username, input.Email); err != nil {
		return nil, "", err
	}

	// 验证邀请码（如果提供）
	var inviteCode *models.InviteCode
	if input.InviteCode != "" {
		var err error
		inviteCode, err = s.validateInviteCode(input.InviteCode)
		if err != nil {
			return nil, "", err
		}
	}

	// 创建用户
	role := "user" // 默认角色
	if input.InviteCode == "realJNUtechnicians" {
		role = "admin" // 使用特殊邀请码时设置为管理员
	}

	user := &models.User{
		Username:   input.Username,
		Email:      input.Email,
		Role:       role,
		IsVerified: false,
		IsActive:   true,
	}

	if err := user.SetPassword(input.Password); err != nil {
		return nil, "", models.ErrInternalServerError
	}

	// 开始事务
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 保存用户
	if err := tx.Create(user).Error; err != nil {
		tx.Rollback()
		return nil, "", models.ErrInternalServerError
	}

	// 使用邀请码
	if inviteCode != nil {
		// 特殊邀请码不需要消耗，只有真实的邀请码才需要记录使用
		if inviteCode.Code != "realJNUtechnicians" {
			if err := inviteCode.UseInviteCode(user.ID, tx); err != nil {
				tx.Rollback()
				return nil, "", err
			}
		}
	}

	// 生成验证码（开发环境跳过邮件发送）
	var verificationCode string
	if !s.isTestEnvironment() {
		var err error
		verificationCode, err = s.evs.GenerateVerificationCode(user.Email, "REGISTER")
		if err != nil {
			tx.Rollback()
			return nil, "", models.ErrInternalServerError
		}

		// 发送验证邮件
		if err := s.sendVerificationEmail(user.Email, verificationCode, "REGISTER"); err != nil {
			// 记录错误但不阻止注册流程
			fmt.Printf("发送验证邮件失败: %v\n", err)
		}
	} else {
		// 测试环境直接验证
		user.IsVerified = true
		user.EmailVerifiedAt = &time.Time{}
		*user.EmailVerifiedAt = time.Now()
		if err := tx.Save(user).Error; err != nil {
			tx.Rollback()
			return nil, "", models.ErrInternalServerError
		}
	}

	tx.Commit()
	return user, verificationCode, nil
}

// LoginUser 用户登录
func (s *AuthService) LoginUser(input *models.LoginInput) (*models.User, string, string, error) {
	// 查找用户
	var user models.User
	query := s.db.Where("username = ? OR email = ?", input.Identifier, input.Identifier)
	if err := query.First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", models.ErrInvalidCredentials
		}
		return nil, "", "", models.ErrInternalServerError
	}

	// 检查账户状态
	if !user.IsActive {
		return nil, "", "", models.ErrAccountLocked
	}

	if user.IsAccountLocked() {
		return nil, "", "", models.ErrAccountLocked
	}

	// 验证密码
	if !user.CheckPassword(input.Password) {
		// 增加登录尝试次数
		user.IncrementLoginAttempts(s.db)
		return nil, "", "", models.ErrInvalidCredentials
	}

	// 检查邮箱验证状态（开发环境跳过）
	if !s.isTestEnvironment() && !user.IsVerified {
		return nil, "", "", models.ErrEmailNotVerified
	}

	// 重置登录尝试次数并更新最后登录时间
	user.ResetLoginAttempts(s.db)
	user.UpdateLastLogin(s.db)

	// 生成JWT令牌
	token, err := models.GenerateJWT(user.ID, user.Username, user.Role, input.Remember)
	if err != nil {
		return nil, "", "", models.ErrInternalServerError
	}

	// 生成刷新令牌
	refreshToken := fmt.Sprintf("refresh_%d_%d", user.ID, time.Now().Unix())

	return &user, token, refreshToken, nil
}

// EmailLogin 邮箱登录（发送验证码）
func (s *AuthService) EmailLogin(email string) error {
	// 检查用户是否存在
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.ErrUserNotFound
		}
		return models.ErrInternalServerError
	}

	if !user.IsActive {
		return models.ErrAccountLocked
	}

	// 生成验证码（开发环境跳过邮件发送）
	if !s.isTestEnvironment() {
		_, err := s.evs.GenerateVerificationCode(email, "LOGIN")
		if err != nil {
			return models.ErrInternalServerError
		}
		// 发送验证邮件
		if err := s.sendVerificationEmail(email, "", "LOGIN"); err != nil {
			// 记录错误但不阻止邮箱登录流程
			fmt.Printf("发送验证邮件失败: %v\n", err)
		}
	}

	return nil
}

// VerifyEmailAndLogin 验证邮箱验证码并登录
func (s *AuthService) VerifyEmailAndLogin(input *models.VerifyEmailInput) (*models.User, string, string, error) {
	// 查找用户
	var user models.User
	if err := s.db.Where("email = ?", input.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", models.ErrUserNotFound
		}
		return nil, "", "", models.ErrInternalServerError
	}

	// 验证验证码（开发环境跳过）
	if !s.isTestEnvironment() {
		if !s.evs.VerifyCode(input.Email, input.Code, string(input.Type)) {
			return nil, "", "", models.ErrVerificationCodeInvalid
		}
	}

	// 如果是注册验证，更新验证状态
	if input.Type == "REGISTER" {
		user.IsVerified = true
		now := time.Now()
		user.EmailVerifiedAt = &now
		if err := s.db.Save(&user).Error; err != nil {
			return nil, "", "", models.ErrInternalServerError
		}
	}

	// 更新最后登录时间
	user.UpdateLastLogin(s.db)

	// 生成JWT令牌
	token, err := models.GenerateJWT(user.ID, user.Username, user.Role, false)
	if err != nil {
		return nil, "", "", models.ErrInternalServerError
	}

	// 生成刷新令牌
	refreshToken := fmt.Sprintf("refresh_%d_%d", user.ID, time.Now().Unix())

	return &user, token, refreshToken, nil
}

// SendVerificationCode 发送验证码
func (s *AuthService) SendVerificationCode(email, codeType string) error {
	// 检查用户是否存在
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.ErrUserNotFound
		}
		return models.ErrInternalServerError
	}

	// 检查是否已有待验证的验证码
	if s.evs.HasPendingCode(email, codeType) {
		return models.ErrRateLimited
	}

	// 生成验证码
	if !s.isTestEnvironment() {
		_, err := s.evs.GenerateVerificationCode(email, codeType)
		if err != nil {
			return models.ErrInternalServerError
		}
		// 发送验证邮件
		if err := s.sendVerificationEmail(email, "", codeType); err != nil {
			// 记录错误但不阻止流程
			fmt.Printf("发送验证邮件失败: %v\n", err)
		}
	}

	return nil
}

// RequestPasswordReset 请求密码重置
func (s *AuthService) RequestPasswordReset(email string) error {
	// 检查用户是否存在
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.ErrUserNotFound
		}
		return models.ErrInternalServerError
	}

	// 生成重置令牌
	token := &models.PasswordResetToken{
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(1 * time.Hour), // 1小时有效期
	}

	if err := token.GenerateToken(); err != nil {
		return models.ErrInternalServerError
	}

	// 保存令牌
	if err := s.db.Create(token).Error; err != nil {
		return models.ErrInternalServerError
	}

	// 在测试环境中直接返回成功，不发送邮件
	if s.isTestEnvironment() {
		return nil
	}

	// 发送密码重置邮件
	if err := s.sendPasswordResetEmail(user.Email, token.Token); err != nil {
		// 记录错误但不阻止流程
		fmt.Printf("发送密码重置邮件失败: %v\n", err)
	}

	return nil
}

// ConfirmPasswordReset 确认密码重置
func (s *AuthService) ConfirmPasswordReset(token, newPassword string) error {
	// 查找重置令牌
	var resetToken models.PasswordResetToken
	if err := s.db.Where("token = ? AND expires_at > ?", token, time.Now()).First(&resetToken).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.ErrInvalidToken
		}
		return models.ErrInternalServerError
	}

	// 查找用户
	var user models.User
	if err := s.db.First(&user, resetToken.UserID).Error; err != nil {
		return models.ErrUserNotFound
	}

	// 更新密码
	if err := user.SetPassword(newPassword); err != nil {
		return models.ErrInternalServerError
	}

	// 开始事务
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 保存用户
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return models.ErrInternalServerError
	}

	// 删除重置令牌
	if err := tx.Delete(&resetToken).Error; err != nil {
		tx.Rollback()
		return models.ErrInternalServerError
	}

	tx.Commit()
	return nil
}

// validateRegisterInput 验证注册输入
func (s *AuthService) validateRegisterInput(input *models.RegisterInput) error {
	// 验证用户名
	if len(input.Username) < 3 || len(input.Username) > 50 {
		return models.ErrUsernameTooShort
	}

	// 验证用户名格式（只允许字母、数字、下划线）
	if matched, _ := regexp.MatchString("^[a-zA-Z0-9_]+$", input.Username); !matched {
		return models.ErrInvalidUsername
	}

	// 验证密码强度
	if len(input.Password) < 6 {
		return models.ErrPasswordTooWeak
	}

	// 验证邮箱格式
	if matched, _ := regexp.MatchString(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`, input.Email); !matched {
		return models.ErrInvalidEmail
	}

	return nil
}

// checkUserExists 检查用户是否已存在
func (s *AuthService) checkUserExists(username, email string) error {
	var count int64

	// 检查用户名
	s.db.Model(&models.User{}).Where("username = ?", username).Count(&count)
	if count > 0 {
		return models.ErrUserExists
	}

	// 检查邮箱
	s.db.Model(&models.User{}).Where("email = ?", email).Count(&count)
	if count > 0 {
		return models.ErrEmailExists
	}

	return nil
}

// validateInviteCode 验证邀请码
func (s *AuthService) validateInviteCode(code string) (*models.InviteCode, error) {
	// 特殊邀请码处理 - "realJNUtechnicians" 用于管理员注册
	if code == "realJNUtechnicians" {
		// 创建一个虚拟的邀请码对象用于管理员注册
		expiresAt := time.Now().AddDate(10, 0, 0) // 10年后过期
		return &models.InviteCode{
			Code:        code,
			MaxUses:     999999, // 无限使用
			CurrentUses: 0,
			IsActive:    true,
			Description: "管理员专用邀请码",
			ExpiresAt:   &expiresAt,
		}, nil
	}

	var inviteCode models.InviteCode
	if err := s.db.Where("code = ?", code).First(&inviteCode).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrInviteCodeNotFound
		}
		return nil, models.ErrInternalServerError
	}

	if !inviteCode.IsUsable() {
		if inviteCode.IsExpired() {
			return nil, models.ErrInviteCodeExpired
		}
		return nil, models.ErrInviteCodeNotUsable
	}

	return &inviteCode, nil
}

// isTestEnvironment 检查是否为测试环境
func (s *AuthService) isTestEnvironment() bool {
	env := os.Getenv("GIN_MODE")
	return env == "test" || env == "development" || strings.ToLower(env) == "debug"
}

// sendVerificationEmail 发送验证邮件
func (s *AuthService) sendVerificationEmail(email, code, emailType string) error {
	// 获取邮件配置
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUsername := os.Getenv("SMTP_USERNAME")
	smtpPassword := os.Getenv("SMTP_PASSWORD")

	// 如果没有配置SMTP，使用默认配置
	if smtpHost == "" {
		smtpHost = "smtp.gmail.com"
		smtpPort = "587"
		smtpUsername = "xloudmaxx@gmail.com"
		smtpPassword = "mbbf hrde wlpk bphe"
	}

	// 根据邮件类型选择主题和内容
	var subject, body string
	switch emailType {
	case "REGISTER":
		subject = "欢迎注册 - 邮箱验证"
		body = fmt.Sprintf("欢迎注册！您的验证码是: %s\n有效期为10分钟。", code)
	case "LOGIN":
		subject = "邮箱登录验证"
		body = fmt.Sprintf("您正在使用邮箱登录，验证码是: %s\n有效期为10分钟。", code)
	default:
		subject = "邮箱验证"
		body = fmt.Sprintf("您的验证码是: %s\n有效期为10分钟。", code)
	}

	// 构建邮件内容
	msg := fmt.Sprintf("From: %s\nTo: %s\nSubject: %s\n\n%s", smtpUsername, email, subject, body)

	// 发送邮件
	auth := smtp.PlainAuth("", smtpUsername, smtpPassword, smtpHost)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	return smtp.SendMail(addr, auth, smtpUsername, []string{email}, []byte(msg))
}

// sendPasswordResetEmail 发送密码重置邮件
func (s *AuthService) sendPasswordResetEmail(email, token string) error {
	// 获取邮件配置
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUsername := os.Getenv("SMTP_USERNAME")
	smtpPassword := os.Getenv("SMTP_PASSWORD")

	// 如果没有配置SMTP，使用默认配置
	if smtpHost == "" {
		smtpHost = "smtp.gmail.com"
		smtpPort = "587"
		smtpUsername = "xloudmaxx@gmail.com"
		smtpPassword = "mbbf hrde wlpk bphe"
	}

	// 构建重置链接 - 在实际项目中应该指向前端重置页面
	baseURL := os.Getenv("FRONTEND_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", baseURL, token)

	subject := "密码重置请求"
	body := fmt.Sprintf(`
您好，

您请求重置密码。请点击以下链接进行重置（有效期1小时）：
%s

如果您没有请求重置密码，请忽略此邮件。

此链接仅在1小时内有效。
`, resetLink)

	// 构建邮件内容
	msg := fmt.Sprintf("From: %s\nTo: %s\nSubject: %s\n\n%s", smtpUsername, email, subject, body)

	// 发送邮件
	auth := smtp.PlainAuth("", smtpUsername, smtpPassword, smtpHost)
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	return smtp.SendMail(addr, auth, smtpUsername, []string{email}, []byte(msg))
}
