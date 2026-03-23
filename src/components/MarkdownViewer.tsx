import React, { useState, useEffect, startTransition, ClassAttributes, HTMLAttributes, ReactNode } from 'react'
import ReactMarkdown, { ExtraProps } from 'react-markdown'
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
import { Card, Image, Grid, Skeleton, Button, Tooltip } from 'antd'
import { CopyOutlined, CheckOutlined } from '@ant-design/icons'
import './MarkdownViewer.css' // 引入自定义样式
import MermaidChart from './MermaidChart'

interface MarkdownViewerProps {
    /** Markdown 文本内容 */
    content: string
}

// 自定义 sanitize schema，允许标题的 id 属性以及 math 相关标签
const customSchema = {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), 'math', 'annotation', 'semantics', 'mrow', 'input', 'span', 'div', 'article'],
    attributes: {
        ...defaultSchema.attributes,
        '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'id', 'style'],
        h1: [...(defaultSchema.attributes?.h1 || []), 'id'],
        h2: [...(defaultSchema.attributes?.h2 || []), 'id'],
        h3: [...(defaultSchema.attributes?.h3 || []), 'id'],
        h4: [...(defaultSchema.attributes?.h4 || []), 'id'],
        h5: [...(defaultSchema.attributes?.h5 || []), 'id'],
        h6: [...(defaultSchema.attributes?.h6 || []), 'id'],
    }
}


type CodeProps = ClassAttributes<HTMLElement> & HTMLAttributes<HTMLElement> & ExtraProps & { inline?: boolean };

const CodeBlock = ({ children, className, inline, ...props }: CodeProps) => {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';

    if (inline) {
        return <code className={className} {...props}>{children}</code>;
    }

    if (lang === 'mermaid') {
        return <MermaidChart code={String(children).trim()} />;
    }

    // 非 inline 且非 mermaid，内容在 PreBlock 中已包装
    return <code className={className} {...props}>{children}</code>;
};

type PreProps = ClassAttributes<HTMLPreElement> & HTMLAttributes<HTMLPreElement> & ExtraProps;

const PreBlock = ({ children }: PreProps) => {
    const [copied, setCopy] = useState(false);
    
    // 从 children 中安全提取 code 组件的 props
    // rehype-highlight 处理后，code 元素可能被识别为 'code' 字符串或我们的 CodeBlock 组件
    const codeElement = React.Children.toArray(children).find(
        (child): child is React.ReactElement<{ className?: string; children?: ReactNode; mdxType?: string }> => 
            React.isValidElement(child) && (
                child.type === 'code' || 
                child.type === CodeBlock || 
                (child.props as { mdxType?: string }).mdxType === 'code'
            )
    );

    if (!codeElement) {
        return <pre>{children}</pre>;
    }

    const { className, children: codeChildren } = codeElement.props;
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';

    if (lang === 'mermaid') {
        return <>{children}</>; 
    }

    const handleCopy = () => {
        const getText = (node: ReactNode): string => {
            if (typeof node === 'string') return node;
            if (Array.isArray(node)) return node.map(getText).join('');
            if (React.isValidElement(node)) {
                const props = node.props as { children?: ReactNode };
                if (props.children) return getText(props.children);
            }
            return '';
        };
        
        const text = getText(codeChildren).replace(/\n$/, '');
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopy(true);
                setTimeout(() => setCopy(false), 2000);
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.error('Failed to copy text: ', err);
            });
    };

    return (
        <div className="code-block-container group">
            <div className="code-block-header">
                <span className="code-block-lang">{lang.toUpperCase() || 'CODE'}</span>
                <Tooltip title={copied ? "Copied!" : "Copy code"}>
                    <Button 
                        type="text" 
                        size="small" 
                        icon={copied ? <CheckOutlined className="text-emerald-500" /> : <CopyOutlined />} 
                        onClick={handleCopy}
                        className="code-copy-btn"
                    />
                </Tooltip>
            </div>
            <div className="code-block-content">
                <pre className={className}>
                    {children}
                </pre>
            </div>
        </div>
    );
};

// 递归检查子元素是否包含块级组件
const hasBlockElement = (children: ReactNode): boolean => {
    return React.Children.toArray(children).some((child) => {
        if (!child || !React.isValidElement(child)) return false;
        
        // 检查当前元素是否是 Image, PreBlock 或 MermaidChart
        if (child.type === Image || child.type === PreBlock || child.type === MermaidChart) {
            return true;
        }

        // 检查 HTML 标签名 (针对 rehype 处理后的结果)
        const element = child as React.ReactElement<{ node?: { tagName: string }; children?: ReactNode }>;
        if (element.props.node?.tagName === 'img' || 
            element.props.node?.tagName === 'pre' || 
            element.props.node?.tagName === 'div') {
            return true;
        }

        // 递归检查子元素的子元素 (处理嵌套在 strong, em, a 等标签中的情况)
        if (element.props.children) {
            return hasBlockElement(element.props.children);
        }

        return false;
    });
};

const components: Components = {
    // 关键修复：解决 p > div 的嵌套冲突
    p: ({ children }: ClassAttributes<HTMLParagraphElement> & HTMLAttributes<HTMLParagraphElement> & ExtraProps) => {
        // 使用递归检查，防止 nested block elements (如在 strong/a 标签内)
        if (hasBlockElement(children)) {
            return <div className="mb-4">{children}</div>;
        }
        return <p>{children}</p>;
    },
    pre: PreBlock,
    code: CodeBlock,
    img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
        return (
            <Image
                src={props.src}
                alt={props.alt}
                className={props.className}
                loading="lazy"
                decoding="async"
                style={{ borderRadius: '8px', maxWidth: '100%', cursor: 'zoom-in' }}
                // 使用 span 代替 div 作为占位，防止嵌套报错
                placeholder={
                    <span className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center min-h-[100px] rounded-lg">
                        loading...
                    </span>
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
