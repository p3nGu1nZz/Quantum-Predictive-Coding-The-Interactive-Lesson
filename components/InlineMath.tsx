import React, { useMemo } from 'react';
import katex from 'katex';

interface InlineMathProps {
  math: string;
  className?: string;
}

export const InlineMath: React.FC<InlineMathProps> = ({ math, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: false,
        output: 'html',
        strict: false,
        trust: true
      });
    } catch (error) {
      console.error("KaTeX inline rendering failed:", error);
      return math;
    }
  }, [math]);

  return (
    <span 
        className={`font-serif text-cyan-400 inline-block px-1 ${className}`} 
        dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};