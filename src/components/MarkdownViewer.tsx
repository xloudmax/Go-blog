import React, { useState, useEffect, startTransition } from 'react'
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
import { Card, Image, Grid, Skeleton } from 'antd'
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
    code(props: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
        const { className, children, inline, ...rest } = props
        const match = /language-(\w+)/.exec(className || '')
        
        if (!inline && match && match[1] === 'mermaid') {
            return <MermaidChart code={String(children).trim()} />
        }
        return (
            <code className={className} {...rest}>
                {children}
            </code>
        )
    },
    img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
        return (
            <Image
                src={props.src}
                alt={props.alt}
                className={props.className}
                loading="lazy"
                decoding="async"
                style={{ borderRadius: '8px', maxWidth: '100%', cursor: 'zoom-in' }}
                placeholder={
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        loading...
                    </div>
                }
            />
        )
    }
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [shouldRender, setShouldRender] = useState(false);

    // 延迟渲染 Markdown 以释放主线程，保证页面切换动画丝滑
    useEffect(() => {
        // 先让路由切换动画和骨架屏跑完
        const timer = setTimeout(() => {
            startTransition(() => {
                setShouldRender(true);
            });
        }, 300); // 300ms 足够路由动画完成
        return () => clearTimeout(timer);
    }, []);

    return (
        <Card 
        variant="outlined"
            style={{ 
                marginTop: isMobile ? '8px' : '16px',
                borderRadius: isMobile ? '16px' : '24px',
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-bg-secondary)',
                boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.1)'
            }} 
            className="markdown-viewer-card"
            styles={{ body: { padding: isMobile ? '8px' : '32px' } }}
        >
            <article className={`markdown-body w-full prose max-w-none ${isMobile ? 'mobile-prose' : ''}`}>
                {shouldRender ? (
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
                ) : (
                    <div className="p-4 space-y-4">
                        <Skeleton active paragraph={{ rows: 20 }} />
                    </div>
                )}
            </article>
        </Card>
    )
}
