// src/components/MarkdownViewer.tsx
// Markdown 渲染组件，使用 react-markdown 解析内容
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import 'github-markdown-css'
import 'katex/dist/katex.min.css'
import { Card } from 'antd'
import './MarkdownViewer.css' // 引入自定义样式

interface MarkdownViewerProps {
    /** Markdown 文本内容 */
    content: string
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
    return (
        <Card style={{ marginTop: '16px' }} className="markdown-viewer-card">
            <article className="markdown-body w-full prose max-w-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight, rehypeKatex]}
                >
                    {content}
                </ReactMarkdown>
            </article>
        </Card>
    )
}
