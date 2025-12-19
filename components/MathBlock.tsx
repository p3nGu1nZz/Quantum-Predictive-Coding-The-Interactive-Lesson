import React, { useMemo } from 'react';
import katex from 'katex';
import { COLORS } from '../constants';

interface MathBlockProps {
  title?: string;
  children: string;
  className?: string;
}

export const MathBlock: React.FC<MathBlockProps> = ({ title, children, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        throwOnError: false,
        displayMode: true,
        output: 'html',
        strict: false,
        trust: true
      });
    } catch (error) {
      console.error("KaTeX rendering failed:", error);
      return `<span style="font-family: monospace; font-size: 0.9em;">${children}</span>`;
    }
  }, [children]);

  return (
    <div className={`my-4 p-4 border-l-4 rounded-r-md shadow-sm bg-white border-slate-300 ${className}`}>
      {title && <h4 className="text-xs font-bold uppercase tracking-widest mb-2 text-slate-500">{title}</h4>}
      <div 
        className="text-lg md:text-xl font-serif text-center leading-relaxed text-slate-900 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};