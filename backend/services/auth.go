package services

import (
	"errors"
	"fmt"
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

		// TODO: 发送验证邮件
		// s.sendVerificationEmail(user.Email, verificationCode)
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
		return nil, "", "", errors.New("账户已被禁用")
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
		return errors.New("账户已被禁用")
	}

	// 生成验证码（开发环境跳过邮件发送）
	if !s.isTestEnvironment() {
		_, err := s.evs.GenerateVerificationCode(email, "LOGIN")
		if err != nil {
			return models.ErrInternalServerError
		}
		// TODO: 发送验证邮件
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
		return errors.New("验证码已发送，请稍后再试")
	}

	// 生成验证码
	if !s.isTestEnvironment() {
		_, err := s.evs.GenerateVerificationCode(email, codeType)
		if err != nil {
			return models.ErrInternalServerError
		}
		// TODO: 发送验证邮件
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

	// TODO: 发送密码重置邮件
	// s.sendPasswordResetEmail(user.Email, token.Token)

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
		return errors.New("用户名长度必须在3-50字符之间")
	}

	// 验证用户名格式（只允许字母、数字、下划线）
	if matched, _ := regexp.MatchString("^[a-zA-Z0-9_]+$", input.Username); !matched {
		return errors.New("用户名只能包含字母、数字和下划线")
	}

	// 验证密码强度
	if len(input.Password) < 6 {
		return errors.New("密码长度至少为6位")
	}

	// 验证邮箱格式
	if matched, _ := regexp.MatchString(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`, input.Email); !matched {
		return errors.New("邮箱格式不正确")
	}

	return nil
}

// checkUserExists 检查用户是否已存在
func (s *AuthService) checkUserExists(username, email string) error {
	var count int64

	// 检查用户名
	s.db.Model(&models.User{}).Where("username = ?", username).Count(&count)
	if count > 0 {
		return errors.New("用户名已存在")
	}

	// 检查邮箱
	s.db.Model(&models.User{}).Where("email = ?", email).Count(&count)
	if count > 0 {
		return errors.New("邮箱已被注册")
	}

	return nil
}

// validateInviteCode 验证邀请码
func (s *AuthService) validateInviteCode(code string) (*models.InviteCode, error) {
	// 特殊邀请码处理 - "realJNUtechnicians" 用于管理员注册
	if code == "realJNUtechnicians" {
		// 创建一个虚拟的邀请码对象用于管理员注册
		return &models.InviteCode{
			Code:        code,
			MaxUses:     999999, // 无限使用
			CurrentUses: 0,
			IsActive:    true,
			Description: "管理员专用邀请码",
			ExpiresAt:   time.Now().AddDate(10, 0, 0), // 10年后过期
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
