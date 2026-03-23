# 使用 Vertex AI 中的 Gemini API 生成内容 - 核心参考

## 概述
Gemini 模型支持多模态输入（文本、音频、视频、图片），主要通过 `generateContent` 或 `streamGenerateContent` 接口生成内容。

## 请求核心参数 (GenerationConfig)
- **Temperature**: 控制词元选择的随机性。较低值趋向于确定性回答，较高值增加创造性。
- **TopP (核采样)**: 按照概率总和选择 token，降低值获得随机程度较低的回答。
- **MaxOutputTokens**: 回复中词元数量上限。
- **ThinkingConfig**: 针对 Gemini 2.0+ 的思考过程配置，包含 `thinkingBudget` 和 `thinkingLevel`。
- **StopSequences**: 停止生成的字符串列表。

## 系统指令 (SystemInstruction)
用于引导模型获得更好性能的说明，例如回答风格限制。text 字符串会计入 token 限制。

## 工具与函数调用 (Tools)
允许模型与外部系统交互。包含 `functionDeclarations`（函数名称、描述、参数架构）。

## 输入模态 (Parts)
- **text**: 文本提示。
- **inlineData**: base64 编码的内嵌数据（图片、PDF、视频）。
- **fileData**: Cloud Storage 或 HTTP 网址提供的文件。

## 响应与停止原因 (FinishReason)
- **FINISH_REASON_STOP**: 自然停止。
- **FINISH_REASON_MAX_TOKENS**: 达到长度上限。
- **FINISH_REASON_SAFETY**: 出于安全原因拦截。
- **FINISH_REASON_RECITATION**: 引用限制。

## 安全设置 (SafetySettings)
配置不同类别的屏蔽阈值（如 `HARM_CATEGORY_DANGEROUS_CONTENT`）。
