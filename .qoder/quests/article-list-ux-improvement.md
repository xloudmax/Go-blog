# 文章列表 UX 改进设计文档

## 10. 实现细节与规范

### 10.1 组件实现规范

#### 10.1.1 ArticleCard 组件实现要点
1. 使用 Ant Design 的 Card 组件作为基础
2. 标题使用 Typography.Title 组件
3. 摘要使用 Typography.Paragraph 组件并设置 ellipsis 属性
4. 元信息区域使用 Flex 布局
5. 操作按钮始终保持可见

#### 10.1.2 分组组件实现要点
1. 使用 useState 管理折叠状态
2. 实现平滑的折叠动画效果
3. 分组标题使用清晰的视觉层次

### 10.2 样式实现规范

#### 10.2.1 CSS 类命名规范
- 使用 BEM 命名规范
- 组件级别使用驼峰命名
- 状态类使用 is- 前缀

#### 10.2.2 响应式实现
- 使用 Tailwind CSS 的响应式类
- 针对不同断点调整布局
- 确保移动端体验优先

### 10.3 性能优化细节

#### 10.3.1 虚拟滚动实现
- 使用 react-window 或 react-virtualized
- 设置合理的 itemSize
- 优化滚动事件处理

#### 10.3.2 懒加载实现
- 使用 Intersection Observer API
- 设置合理的 rootMargin
- 预加载临界内容

## 1. 概述

### 1.1 目标
改进 `/home` 页面的文章列表设计，提升用户体验和视觉吸引力。当前设计较为简陋，缺乏现代感和交互性。

### 1.2 当前问题分析
- 视觉设计较为朴素，缺乏层次感
- 文章列表展示信息有限，缺乏视觉吸引力
- 分组折叠交互不够直观
- 缺乏视觉反馈和动效
- 整体布局缺乏现代感

## 2. 设计改进方案

### 2.1 视觉设计改进

#### 2.1.1 卡片式布局
采用现代化卡片式设计替代当前的列表式布局：
- 每篇文章使用独立卡片容器展示
- 增加阴影和圆角效果提升视觉层次
- 使用渐变背景增强视觉吸引力

#### 2.1.2 色彩系统优化
- 利用现有设计系统的主色调（靛蓝色系）
- 增加标签色彩区分度
- 优化深色模式下的色彩对比度

#### 2.1.3 排版优化
- 增加标题层级感，使用不同字体大小和粗细
- 优化文章摘要的显示方式
- 改进作者信息和时间戳的展示样式

### 2.2 交互体验改进

#### 2.2.1 悬停效果
- 卡片悬停时增加轻微上浮效果
- 操作按钮在悬停时显示，减少视觉干扰
- 增加过渡动画提升交互流畅度

#### 2.2.2 分组导航优化
- 重新设计分组标题样式，增加视觉识别度
- 优化折叠/展开动画效果
- 提供分组快速跳转功能

#### 2.2.3 加载状态优化
- 使用骨架屏替代简单的加载提示
- 增加文章列表的渐进式加载动画

### 2.3 响应式设计
- 优化移动端显示效果
- 调整不同屏幕尺寸下的布局结构
- 确保触摸友好的交互元素尺寸

## 3. 详细设计方案

### 3.1 新增文章卡片组件

#### 3.1.1 视觉设计
- 采用圆角卡片设计，border-radius: 12px
- 添加微妙的阴影效果提升层次感
- 使用渐变边框增强视觉吸引力
- 卡片内部间距统一为 24px

#### 3.1.2 内容布局
1. **封面图片区域**（可选）
   - 高度固定为 180px
   - 支持图片懒加载
   - 添加图片占位符

2. **标题区域**
   - 使用 24px 字体大小
   - 字重设置为 600
   - 添加行数限制（最多2行）

3. **摘要区域**
   - 使用 16px 字体大小
   - 行高设置为 1.6
   - 添加行数限制（最多3行）

4. **元信息区域**
   - 作者头像（24px圆形）
   - 作者名称
   - 发布时间
   - 阅读量图标和数字
   - 标签列表

5. **操作区域**
   - 操作按钮在默认状态下隐藏
   - 悬停时淡入显示
   - 使用 Ant Design 的 Dropdown 组件

### 3.2 分组导航改进

#### 3.2.1 分组标题设计
- 使用 20px 字体大小突出分组标题
- 添加分组文章数量徽章
- 优化折叠图标动画效果
- 增加分组间间距

#### 3.2.2 折叠动画
- 使用 CSS transition 实现平滑折叠效果
- 添加 0.3s 动画时长
- 使用 ease-in-out 时间函数

### 3.3 加载状态优化

#### 3.3.1 骨架屏设计
- 使用渐变动画模拟加载效果
- 保持与实际内容相同的布局结构
- 添加适当的动画延迟

#### 3.3.2 渐进式加载
- 首先加载首屏内容
- 使用 Intersection Observer 实现懒加载
- 添加加载更多按钮

### 3.4 新增功能特性

#### 3.4.1 文章封面图片支持
- 支持为文章添加封面图片
- 自动裁剪和缩放图片以适应容器
- 添加图片懒加载功能

#### 3.4.2 标签云展示
- 在文章列表顶部添加标签云
- 支持点击标签筛选文章
- 使用不同颜色区分热门标签

#### 3.4.3 搜索和筛选功能
- 添加搜索框支持关键词搜索
- 提供按标签、分类、时间等筛选选项
- 实现搜索结果高亮显示

## 4. 组件架构设计

### 4.1 文章卡片组件 (ArticleCard)
```tsx
interface ArticleCardProps {
  post: BlogPost;
  onNavigate: (slug: string) => void;
  onAction: (action: 'view' | 'edit' | 'share', post: BlogPost) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ post, onNavigate, onAction }) => {
  // 组件实现
  return (
    // JSX 实现
  );
};
```

### 4.2 分组容器组件 (ArticleGroup)
```tsx
interface ArticleGroupProps {
  groupName: string;
  posts: BlogPost[];
  isCollapsed: boolean;
  onToggle: (groupName: string) => void;
}

const ArticleGroup: React.FC<ArticleGroupProps> = ({ 
  groupName, 
  posts, 
  isCollapsed, 
  onToggle 
}) => {
  // 组件实现
  return (
    // JSX 实现
  );
};
```

### 4.3 文章列表容器组件 (ArticleListContainer)
```tsx
interface ArticleListContainerProps {
  groups: Record<string, BlogPost[]>;
  loading: boolean;
  error: Error | null;
}

const ArticleListContainer: React.FC<ArticleListContainerProps> = ({ 
  groups, 
  loading, 
  error 
}) => {
  // 组件实现
  return (
    // JSX 实现
  );
};
```

## 5. 样式系统设计

### 5.1 新增样式类
```css
/* 文章卡片样式 */
.article-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  transition: var(--transition-all-long);
  overflow: hidden;
  margin-bottom: var(--spacing-lg);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 文章卡片内容区域 */
.article-card-content {
  padding: var(--spacing-lg);
}

/* 文章标题样式 */
.article-card-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  line-height: var(--line-height-tight);
}

/* 文章摘要样式 */
.article-card-excerpt {
  color: var(--color-neutral-600);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-md);
}

html.dark .article-card-excerpt {
  color: var(--color-neutral-400);
}

/* 分组标题样式 */
.group-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: var(--transition-all);
  margin-bottom: var(--spacing-md);
}

.group-header:hover {
  background: var(--hover-bg);
}

/* 骨架屏样式 */
.skeleton-card {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
  min-height: 200px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 5.2 设计变量使用
- 使用现有设计系统的变量 (`design-system.css`)
- 适配深色模式和浅色模式
- 保持与整体设计语言的一致性

## 6. 动效设计

### 6.1 页面加载动效
- 文章卡片逐个淡入显示
- 使用 staggered animation 实现延迟加载效果
- 添加弹性动画效果提升视觉体验

### 6.2 交互动效
- 按钮点击波纹效果
- 卡片悬停的平滑过渡
- 分组折叠/展开的动画效果
- 操作菜单弹出动画

### 6.3 状态切换动效
- 加载状态到内容显示的过渡
- 错误状态的视觉反馈动画
- 空状态到内容状态的过渡

## 7. 响应式优化

### 7.1 断点设计
- 移动端 (≤768px): 单列布局
- 平板 (769px-1024px): 两列布局
- 桌面端 (≥1025px): 三列布局

### 7.2 移动端特化设计
- 简化操作菜单为底部动作表
- 增大触摸目标区域
- 优化手势操作支持
- 调整卡片内边距适应小屏幕
- 优化分组标题在小屏幕上的显示

## 8. 性能优化

### 8.1 渲染优化
- 实现虚拟滚动支持大量文章显示
- 使用 React.memo 优化组件重渲染
- 懒加载图片和复杂组件
- 优化分组渲染逻辑

### 8.2 加载优化
- 骨架屏提升感知性能
- 分批加载文章列表
- 预加载关键资源
- 使用 Intersection Observer 实现懒加载

## 9. 测试策略

### 9.1 组件测试
- 文章卡片组件单元测试
- 分组容器组件交互测试
- 不同状态下的渲染测试
- 响应式组件测试

### 9.2 集成测试
- 文章列表完整渲染流程测试
- 与 GraphQL 数据层的集成测试
- 响应式布局在不同设备上的测试
- 动效性能测试

### 9.3 用户体验测试
- 加载性能测试
- 交互流畅度测试
- 可访问性测试
- A/B测试方案设计
