# Vertex AI Gemini API 运行与错误处理指南 (2026版)

## 1. 核心 SDK 用法 (google-genai)
最新版 SDK 支持通过 `HttpOptions(api_version="v1")` 显式指定版本。
```python
from google import genai
client = genai.Client(http_options=HttpOptions(api_version="v1"))
```

## 2. 常见 API 错误与对策
| HTTP | 错误代码 | 原因 | 解决方案 |
| :--- | :--- | :--- | :--- |
| 400 | INVALID_ARGUMENT | 词元超限/参数错误 | 检查 Token 数，参考模型规范 |
| 403 | PERMISSION_DENIED | IAM 权限不足 | 检查 `aiplatform.endpoints.predict` 权限 |
| 429 | RESOURCE_EXHAUSTED | 配额用尽/服务器过载 | 申请更高配额；实施指数退避重试 |
| 504 | DEADLINE_EXCEEDED | 请求超时 | 移除 10s 限制，使用默认 10 分钟或更长 |

## 3. 最佳实践
- **避免流量高峰**：防止短时间内请求激增导致配额错误。
- **重试机制**：建议最多重试两次，最短延迟 1s，后续以指数级增加。
- **Token 计算**：Gemini 3 Pro 等模型处理文档时，Token 计算方式类似于图片。
