'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {copyToClipboard} from '@/lib/utils';
import {ReactNode} from 'react';
import type {Components} from 'react-markdown';

/**
 * Markdown 内容渲染器组件属性
 */
interface ContentRenderProps {
  /** Markdown 内容字符串 */
  content: string;
  /** 额外的 CSS 类名 */
  className?: string;
}

/**
 * 递归获取代码内容的工具函数
 */
const getCodeContent = (node: ReactNode): string => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) {
    return node.map(getCodeContent).join('');
  }
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as {props?: {children?: ReactNode}}).props;
    if (props?.children) {
      return getCodeContent(props.children);
    }
  }
  return '';
};

/**
 * Markdown 组件配置映射
 */
const markdownComponents: Components = {
  h1: ({children}) => (
    <h1 className="text-2xl font-bold mb-6 mt-8 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 pb-2">
      {children}
    </h1>
  ),
  h2: ({children}) => (
    <h2 className="text-xl font-semibold mb-4 mt-6 first:mt-0 text-gray-900 dark:text-gray-100">
      {children}
    </h2>
  ),
  h3: ({children}) => (
    <h3 className="text-lg font-medium mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100">
      {children}
    </h3>
  ),
  h4: ({children}) => (
    <h4 className="text-base font-medium mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100">
      {children}
    </h4>
  ),
  h5: ({children}) => (
    <h5 className="text-sm font-medium mb-2 mt-3 first:mt-0 text-gray-800 dark:text-gray-200 uppercase tracking-wide">
      {children}
    </h5>
  ),
  p: ({children, node}) => {
    const hasImage = node?.children?.some((child) =>
      'tagName' in child && child.tagName === 'img',
    );

    if (hasImage) {
      return (
        <div className="mb-4 last:mb-0 leading-7 text-gray-700 dark:text-gray-200 break-all" style={{wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-all'}}>
          {children}
        </div>
      );
    }

    return (
      <p className="mb-4 last:mb-0 leading-7 text-gray-700 dark:text-gray-200 break-all" style={{wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-all'}}>
        {children}
      </p>
    );
  },
  ul: ({children}) => (
    <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-200">
      {children}
    </ul>
  ),
  ol: ({children}) => (
    <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-200">
      {children}
    </ol>
  ),
  li: ({children}) => (
    <li className="text-gray-700 dark:text-gray-200 leading-6 break-all" style={{wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-all'}}>
      {children}
    </li>
  ),
  strong: ({children}) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </strong>
  ),
  em: ({children}) => (
    <em className="italic text-gray-600 dark:text-gray-300">
      {children}
    </em>
  ),
  code: ({children, className}) => {
    const isCodeBlock = className?.includes('language-');

    if (isCodeBlock) {
      return <code className={className}>{children}</code>;
    }

    return (
      <code className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-2 py-1 rounded-md text-sm font-mono border border-gray-200 dark:border-gray-700 font-medium">
        {children}
      </code>
    );
  },
  pre: ({children, className}) => {
    const codeContent = getCodeContent(children);

    /**
     * 提取代码块的语言标识符
     */
    const getLanguage = (): string => {
      if (className) {
        const match = className.match(/language-(\w+)/);
        if (match) return match[1];
      }

      if (children && typeof children === 'object' && 'props' in children) {
        const childProps = (children as {props?: {className?: string}}).props;
        if (childProps?.className) {
          const match = childProps.className.match(/language-(\w+)/);
          if (match) return match[1];
        }
      }

      /**
       * 递归查找子元素中的语言标识符
       */
      const findLanguageInChildren = (element: unknown): string | null => {
        if (!element || typeof element !== 'object') return null;

        const elementWithProps = element as {props?: {className?: string; children?: unknown}};

        if (elementWithProps.props?.className) {
          const match = elementWithProps.props.className.match(/language-(\w+)/);
          if (match) return match[1];
        }

        if (elementWithProps.props?.children) {
          if (Array.isArray(elementWithProps.props.children)) {
            for (const child of elementWithProps.props.children) {
              const result = findLanguageInChildren(child);
              if (result) return result;
            }
          } else {
            return findLanguageInChildren(elementWithProps.props.children);
          }
        }

        return null;
      };

      return findLanguageInChildren(children) || '';
    };

    const language = getLanguage();

    return (
      <div className="relative group mb-6">
        {/* 代码块头部：包含语言标识和复制按钮 */}
        <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-t-lg border border-gray-300 dark:border-gray-600 border-b-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-2">
              {language || '代码'}
            </span>
          </div>
          <button
            onClick={async () => {
              try {
                await copyToClipboard(codeContent);
                const button = document.activeElement as HTMLButtonElement;
                const originalText = button.innerHTML;
                button.innerHTML = `
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                `;
                setTimeout(() => {
                  button.innerHTML = originalText;
                }, 2000);
              } catch (error) {
                console.error('复制失败:', error);
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded transition-colors duration-200 text-gray-700 dark:text-gray-300"
            title="复制代码"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            <span>复制</span>
          </button>
        </div>

        {/* 代码内容区域：支持自动换行和语法高亮 */}
        <pre
          className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 border-t-0 p-4 rounded-b-lg overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200 leading-relaxed break-all"
          style={{
            wordWrap: 'break-word',
            overflowWrap: 'anywhere',
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
          }}
        >
          {children}
        </pre>
      </div>
    );
  },
  blockquote: ({children}) => (
    <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-6 pr-4 py-4 my-6 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent italic text-gray-700 dark:text-gray-300 rounded-r-lg relative break-all" style={{wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-all'}}>
      <div className="absolute top-2 left-2 text-blue-400 dark:text-blue-300 opacity-30">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.318.142-.686.238-1.028.466-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.945-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 6.5 10zm11 0c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.318.142-.686.238-1.028.466-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.945-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 17.5 10z"/>
        </svg>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </blockquote>
  ),
  a: ({href, children}) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-2 font-medium transition-colors duration-200"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => (
    <hr className="border-gray-300 dark:border-gray-600 my-6" />
  ),
  img: ({src, alt, title}) => {
    return (
      <>
        {/*
         * 注意：此组件中使用原生 img 元素而非 Next.js Image 组件。
         * Markdown 内容中的图片 URL 通常来自外部源，使用 Next.js Image 组件会导致跨域问题和域名白名单配置复杂性。
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || '图片'}
          title={title}
          className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm mx-auto block my-6"
          loading="lazy"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const errorDiv = document.createElement('div');
            errorDiv.className = 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400 my-6';
            errorDiv.innerHTML = `
              <svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
              </svg>
              <div class="text-sm">图片加载失败</div>
              <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">${alt || src}</div>
            `;
            target.parentNode?.replaceChild(errorDiv, target);
          }}
        />
        {(alt || title) && (
          <span className="block text-sm text-gray-500 dark:text-gray-400 text-center italic -mt-4 mb-6">
            {title || alt}
          </span>
        )}
      </>
    );
  },
  table: ({children}) => (
    <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <table className="min-w-full border-collapse bg-white dark:bg-gray-800">
        {children}
      </table>
    </div>
  ),
  thead: ({children}) => (
    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
      {children}
    </thead>
  ),
  tbody: ({children}) => (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </tbody>
  ),
  tr: ({children}) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
      {children}
    </tr>
  ),
  th: ({children}) => (
    <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm tracking-wider break-all" style={{wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-all'}}>
      {children}
    </th>
  ),
  td: ({children}) => (
    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm break-all" style={{wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-all'}}>
      {children}
    </td>
  ),
};

/**
 * Markdown 内容渲染器组件
 *
 * 提供完整的 Markdown 渲染功能，包括：
 * - 标题（h1-h5）
 * - 段落、列表、引用
 * - 代码块和行内代码
 * - 链接、图片、表格
 * - 支持 GitHub Flavored Markdown (GFM)
 *
 */
export function ContentRender({content, className = ''}: ContentRenderProps) {
  if (!content || content.trim() === '') {
    return (
      <p className="text-gray-400 dark:text-gray-500 italic text-center py-8">
        暂无内容
      </p>
    );
  }

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default ContentRender;
