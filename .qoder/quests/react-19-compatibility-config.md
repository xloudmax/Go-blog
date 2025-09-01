# React 19 兼容性配置设计文档

## 1. 概述

本文档描述了在当前项目中为确保 Ant Design v5 与 React 19 正常兼容运行所需的配置方案。由于 React 19 调整了 react-dom 的导出方式，导致 antd 无法直接使用 ReactDOM.render 方法，因此需要通过特定的兼容配置来解决相关问题。

## 2. 兼容性问题分析

### 2.1 问题描述
在 React 19 环境下，Ant Design v5 可能遇到以下问题：
- 波纹特效无法正常工作
- Modal、Notification、Message 等组件的静态方法无效

### 2.2 问题根源
React 19 调整了 react-dom 的导出方式，移除了 ReactDOM.render 方法，而 Ant Design v5 依赖此方法来实现部分组件功能。

## 3. 技术方案

### 3.1 解决方案选择
根据 Ant Design 官方推荐，有两种解决方案：
1. 使用兼容包（推荐方案）
2. 使用 unstableSetRender 方法

考虑到项目为标准 React 应用，推荐使用兼容包方案。

### 3.2 兼容包方案
通过安装并引入 `@ant-design/v5-patch-for-react-19` 兼容包来解决兼容性问题。

#### 3.2.1 依赖安装
```bash
pnpm add @ant-design/v5-patch-for-react-19 --save
```

#### 3.2.2 项目配置
在应用入口文件 `src/main.tsx` 中引入兼容包：

```typescript
import '@ant-design/v5-patch-for-react-19';
```

## 4. 实施步骤

### 4.1 安装依赖包
执行以下命令安装兼容包：
```bash
pnpm add @ant-design/v5-patch-for-react-19 --save
```

### 4.2 修改应用入口文件
修改 `src/main.tsx` 文件，在文件顶部添加兼容包导入：

```typescript
// src/main.tsx
import '@ant-design/v5-patch-for-react-19';
import React from 'react'
import ReactDOM from 'react-dom/client'
// ... 其余导入保持不变
```

### 4.3 验证配置
1. 启动开发服务器：`pnpm dev`
2. 检查以下组件功能是否正常：
   - 按钮波纹效果
   - Modal 组件弹出功能
   - Notification 通知功能
   - Message 消息功能

## 5. 备选方案

### 5.1 unstableSetRender 方案
如果兼容包方案无法满足特殊需求（如UMD、微应用等场景），可使用 unstableSetRender 方法：

```typescript
import { unstableSetRender } from 'antd';
import { createRoot } from 'react-dom/client';

unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});
```

注意：此方案仅在兼容包无法使用时才推荐使用。

## 6. 注意事项

1. 兼容包方案为推荐方案，应优先使用
2. `@ant-design/v5-patch-for-react-19` 接口将在 Ant Design v6 中被移除
3. 项目升级到 Ant Design v6 时需移除兼容包及相关配置
4. 在微前端等特殊场景下可能需要使用备选方案

## 7. 版本兼容性说明

| 技术栈 | 版本 |
|--------|------|
| React | ^19.1.0 |
| React DOM | ^19.1.0 |
| Ant Design | ^5.27.1 |
| 兼容包 | @ant-design/v5-patch-for-react-19 |

## 8. 测试验证点

1. 按钮点击时的波纹效果是否正常显示
2. Modal 组件是否能正常弹出和关闭
3. Notification 通知是否能正常显示
4. Message 消息是否能正常显示
5. 表单组件功能是否正常
6. 所有 Ant Design 组件在浅色和深色主题下是否正常显示