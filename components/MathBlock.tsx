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
    <div className={`my-8 p-8 border border-cyan-900 bg-slate-900/50 rounded backdrop-blur-sm relative overflow-hidden ${className}`}>
      {/* Glow effect */}
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
      
      {title && <h4 className="text-base font-bold uppercase tracking-widest mb-4 text-cyan-400 cyber-font">{title}</h4>}
      <div 
        className="text-2xl md:text-3xl font-serif text-center leading-relaxed text-slate-100 overflow-x-auto py-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};