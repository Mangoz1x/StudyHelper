'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * Markdown Content Component
 *
 * Renders markdown with support for:
 * - Standard markdown (headings, lists, code, etc.)
 * - Math notation via KaTeX ($inline$ and $$block$$)
 * - Custom styling variants
 *
 * @param {Object} props
 * @param {string} props.content - Markdown content to render
 * @param {string} props.variant - Style variant: 'default' | 'thinking' | 'compact'
 * @param {string} props.className - Additional CSS classes
 */
export function MarkdownContent({ content, variant = 'default', className = '' }) {
    // Base styles for different variants
    const variantStyles = {
        default: {
            container: 'text-gray-900',
            p: 'mb-3 last:mb-0',
            h1: 'text-xl font-bold mb-3 mt-4 first:mt-0',
            h2: 'text-lg font-bold mb-2 mt-4 first:mt-0',
            h3: 'text-base font-bold mb-2 mt-3 first:mt-0',
            ul: 'list-disc list-inside mb-3 space-y-1',
            ol: 'list-decimal list-inside mb-3 space-y-1',
            li: 'ml-2',
            code: 'bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded text-sm font-mono',
            codeBlock: 'block bg-gray-800 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto my-3',
            pre: 'bg-gray-800 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto my-3',
            blockquote: 'border-l-4 border-violet-300 pl-4 italic my-3 text-gray-600',
            link: 'text-violet-600 hover:underline',
            hr: 'my-4 border-gray-300',
        },
        thinking: {
            container: 'text-amber-900',
            p: 'mb-2 last:mb-0',
            h1: 'text-lg font-bold mb-2 mt-3 first:mt-0',
            h2: 'text-base font-bold mb-2 mt-3 first:mt-0',
            h3: 'text-sm font-bold mb-1 mt-2 first:mt-0',
            ul: 'list-disc list-inside mb-2 space-y-0.5',
            ol: 'list-decimal list-inside mb-2 space-y-0.5',
            li: 'ml-2',
            code: 'bg-amber-200 text-amber-800 px-1 py-0.5 rounded text-sm font-mono',
            codeBlock: 'block bg-amber-900 text-amber-100 p-2 rounded-lg text-sm font-mono overflow-x-auto my-2',
            pre: 'bg-amber-900 text-amber-100 p-2 rounded-lg text-sm overflow-x-auto my-2',
            blockquote: 'border-l-4 border-amber-400 pl-3 italic my-2 text-amber-700',
            link: 'text-amber-700 hover:underline',
            hr: 'my-3 border-amber-300',
        },
        compact: {
            container: 'text-gray-900 text-sm',
            p: 'mb-2 last:mb-0',
            h1: 'text-base font-bold mb-2 mt-2 first:mt-0',
            h2: 'text-sm font-bold mb-1 mt-2 first:mt-0',
            h3: 'text-sm font-semibold mb-1 mt-2 first:mt-0',
            ul: 'list-disc list-inside mb-2 space-y-0.5',
            ol: 'list-decimal list-inside mb-2 space-y-0.5',
            li: 'ml-2',
            code: 'bg-gray-100 text-gray-700 px-1 py-0.5 rounded text-xs font-mono',
            codeBlock: 'block bg-gray-800 text-gray-100 p-2 rounded text-xs font-mono overflow-x-auto my-2',
            pre: 'bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-x-auto my-2',
            blockquote: 'border-l-2 border-gray-300 pl-2 italic my-2 text-gray-600',
            link: 'text-violet-600 hover:underline',
            hr: 'my-2 border-gray-200',
        },
    };

    const styles = variantStyles[variant] || variantStyles.default;

    return (
        <div className={`markdown-content ${styles.container} ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({ children }) => <p className={styles.p}>{children}</p>,
                    h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
                    h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
                    h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h4>,
                    ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
                    ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
                    li: ({ children }) => <li className={styles.li}>{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ inline, children, className: codeClassName }) => {
                        // Check if this is a code block with language
                        const match = /language-(\w+)/.exec(codeClassName || '');
                        if (inline) {
                            return <code className={styles.code}>{children}</code>;
                        }
                        return (
                            <code className={styles.codeBlock}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => <pre className={styles.pre}>{children}</pre>,
                    blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
                    a: ({ href, children }) => (
                        <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                    hr: () => <hr className={styles.hr} />,
                    // Table support
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-3">
                            <table className="min-w-full border-collapse border border-gray-300">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="border-b border-gray-300">{children}</tr>,
                    th: ({ children }) => <th className="px-3 py-2 text-left font-semibold border border-gray-300">{children}</th>,
                    td: ({ children }) => <td className="px-3 py-2 border border-gray-300">{children}</td>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
