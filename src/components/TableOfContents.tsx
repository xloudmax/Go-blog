import { useMemo, useEffect } from 'react';
import GithubSlugger from 'github-slugger';
import './TableOfContents.css';

interface TableOfContentsProps {
  content: string;
}

interface Heading {
  level: number;
  text: string;
  id: string;
}

// 从 Markdown 内容中提取标题
const extractHeadings = (markdown: string): Heading[] => {
  const headings: Heading[] = [];
  const lines = markdown.split('\n');
  const slugger = new GithubSlugger();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    // ATX 风格: ### 标题
    const atxMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (atxMatch) {
      const level = atxMatch[1].length;
      const text = atxMatch[2].trim()
        // 移除行内 HTML 注释
        .replace(/<!--.*?-->/g, '')
        .trim();

      if (text) {
        // 使用 github-slugger 生成 ID，并添加 user-content- 前缀（与 rehype-slug 一致）
        const id = 'user-content-' + slugger.slug(text);
        headings.push({ level, text, id });
      }
      continue;
    }

    // Setext 风格: 标题 \n ===== (h1) 或 ----- (h2)
    if (nextLine && /^[=]{3,}$/.test(nextLine)) {
      const text = line.replace(/<!--.*?-->/g, '').trim();
      if (text) {
        const id = 'user-content-' + slugger.slug(text);
        headings.push({ level: 1, text, id });
      }
      continue;
    }
    if (nextLine && /^[-]{3,}$/.test(nextLine)) {
      const text = line.replace(/<!--.*?-->/g, '').trim();
      if (text) {
        const id = 'user-content-' + slugger.slug(text);
        headings.push({ level: 2, text, id });
      }
      continue;
    }
  }

  return headings;
};

// 将扁平的标题列表转换为树形结构用于渲染
interface TocItem {
  id: string;
  text: string;
  level: number;
  children: TocItem[];
}

const buildTocTree = (headings: Heading[]): TocItem[] => {
  const items: TocItem[] = [];

  headings.forEach((heading) => {
    const item: TocItem = {
      id: heading.id,
      text: heading.text,
      level: heading.level,
      children: []
    };

    // 策略：h1-h2 作为顶级项，h3-h6 作为子项
    if (heading.level <= 2) {
      items.push(item);
    } else if (items.length > 0) {
      const parent = items[items.length - 1];
      parent.children.push(item);
    } else {
      items.push(item);
    }
  });

  return items;
};

export default function TableOfContents({ content }: TableOfContentsProps) {
  const tocItems = useMemo(() => {
    const headings = extractHeadings(content);

    // 开发环境下输出调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('[TOC] 解析到的标题:', headings);
    }

    return buildTocTree(headings);
  }, [content]);

  // 验证页面中的标题 ID（仅在开发模式）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 延迟检查，确保 DOM 已渲染
      setTimeout(() => {
        const allHeadings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
        console.log('[TOC] 页面中所有标题元素:', allHeadings.length);
        console.log('[TOC] 页面中的标题 ID:', Array.from(allHeadings).map(h => ({
          tag: h.tagName,
          id: h.id,
          text: h.textContent?.slice(0, 30)
        })));
      }, 500);
    }
  }, [content]);

  // 点击处理函数
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (process.env.NODE_ENV === 'development') {
      console.log('=== TOC 点击事件触发 ===');
      console.log('[TOC] 点击目标ID:', targetId);
      console.log('[TOC] 事件对象:', e.type);
    }

    const targetElement = document.getElementById(targetId);

    if (process.env.NODE_ENV === 'development') {
      console.log('[TOC] 找到的元素:', targetElement);
      console.log('[TOC] 元素标签名:', targetElement?.tagName);
      console.log('[TOC] 元素位置:', targetElement?.getBoundingClientRect());
    }

    if (targetElement) {
      // 计算目标位置（考虑固定头部的偏移）
      const offsetTop = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offsetTop;

      if (process.env.NODE_ENV === 'development') {
        console.log('[TOC] 当前滚动位置:', window.pageYOffset);
        console.log('[TOC] 目标滚动位置:', offsetPosition);
      }

      // 平滑滚动到目标位置
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // 更新 URL hash
      window.history.pushState(null, '', `#${targetId}`);

      if (process.env.NODE_ENV === 'development') {
        console.log('[TOC] 滚动命令已发送');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.error('[TOC] ❌ 未找到目标元素，ID:', targetId);

        // 调试：列出所有带 ID 的标题元素
        const allHeadings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
        console.log('[TOC] 页面中所有标题 ID:', Array.from(allHeadings).map(h => h.id));
      }
    }
  };

  // 渲染 TOC 项
  const renderTocItem = (item: TocItem, isChild = false) => (
    <li key={item.id} className={isChild ? 'toc-item-child' : 'toc-item'}>
      <a
        href={`#${item.id}`}
        onClick={(e) => handleClick(e, item.id)}
        onMouseDown={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[TOC] 鼠标按下:', item.id);
          }
        }}
        onMouseUp={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[TOC] 鼠标抬起:', item.id);
          }
        }}
        className="toc-link"
        title={item.text}
      >
        {item.text}
      </a>
      {item.children.length > 0 && (
        <ul className="toc-list-child">
          {item.children.map((child) => renderTocItem(child, true))}
        </ul>
      )}
    </li>
  );

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="toc-container">
      <div className="toc-header">目录</div>
      <ul className="toc-list">
        {tocItems.map((item) => renderTocItem(item))}
      </ul>
    </div>
  );
}
