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
    <div className={`my-6 p-6 border border-cyan-900 bg-slate-900/50 rounded backdrop-blur-sm relative overflow-hidden ${className}`}>
      {/* Glow effect */}
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
      
      {title && <h4 className="text-sm font-bold uppercase tracking-widest mb-2 text-cyan-400 cyber-font">{title}</h4>}
      <div 
        className="text-base font-serif text-center leading-relaxed text-slate-100 py-2 break-words max-w-full overflow-x-hidden"
        style={{ overflowWrap: 'anywhere' }}
      >
        {/* Inject specific style to force KaTeX to wrap if possible and not overflow */}
        <style>{`
            .katex-display { margin: 0.5em 0; overflow-x: hidden; white-space: normal; }
            .katex-display > .katex { white-space: normal; }
            .katex { font-size: 1.1em !important; }
        `}</style>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};