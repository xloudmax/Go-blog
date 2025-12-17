// src/components/MarkdownViewer.tsx
// Markdown 渲染组件，使用 react-markdown 解析内容
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import 'github-markdown-css'
import 'katex/dist/katex.min.css'
import { Card } from 'antd'
import './MarkdownViewer.css' // 引入自定义样式
import MermaidChart from './MermaidChart'

interface MarkdownViewerProps {
    /** Markdown 文本内容 */
    content: string
}

// 自定义 sanitize schema，允许标题的 id 属性
const customSchema = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'id'],
        h1: [...(defaultSchema.attributes?.h1 || []), 'id'],
        h2: [...(defaultSchema.attributes?.h2 || []), 'id'],
        h3: [...(defaultSchema.attributes?.h3 || []), 'id'],
        h4: [...(defaultSchema.attributes?.h4 || []), 'id'],
        h5: [...(defaultSchema.attributes?.h5 || []), 'id'],
        h6: [...(defaultSchema.attributes?.h6 || []), 'id'],
    }
}

const components: Components = {
    code(props: any) {
        const { className, children, inline, ...rest } = props
        const language = className?.replace('language-', '')
        if (!inline && language === 'mermaid') {
            return <MermaidChart code={String(children).trim()} />
        }
        return (
            <code className={className} {...rest}>
                {children}
            </code>
        )
    },
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
    return (
        <Card style={{ marginTop: '16px' }} className="markdown-viewer-card">
            <article className="markdown-body w-full prose max-w-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[
                        rehypeRaw,
                        rehypeSlug,
                        // 使用 append 避免嵌套 <a>，防止 hydration 警告
                        [rehypeAutolinkHeadings, { behavior: 'append' }],
                        [rehypeSanitize, customSchema],  // 使用自定义 schema
                        rehypeHighlight,
                        rehypeKatex
                    ]}
                    components={components}
                >
                    {content}
                </ReactMarkdown>
            </article>
        </Card>
    )
}
