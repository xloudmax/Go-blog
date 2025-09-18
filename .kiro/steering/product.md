# Product Overview

This is a full-stack blog platform playground project that provides a complete content management system with modern web technologies.

## Core Features

- **User Management**: Registration, authentication, email verification, role-based access (USER/ADMIN)
- **Content Management**: Create, edit, publish blog posts with Markdown support, version history, and draft/published states
- **Rich Media**: Image uploads, cover images, and file management
- **Social Features**: Comments, likes, user profiles with avatars
- **Search & Discovery**: Full-text search, trending tags, popular posts, search suggestions
- **Admin Dashboard**: User management, invite codes, system statistics, content moderation
- **Multi-language Support**: Chinese and English interface

## Access Levels

- **PUBLIC**: Open to all users
- **PRIVATE**: Author only
- **RESTRICTED**: Authenticated users only

## User Roles

- **USER**: Standard user with content creation and interaction capabilities
- **ADMIN**: Full system administration privileges

## Key Business Logic

- Posts support draft/published/archived states
- Version history tracking for content changes
- Invite code system for user registration
- Email verification for security
- Rate limiting and caching for performance
- JWT-based authentication with refresh tokens
