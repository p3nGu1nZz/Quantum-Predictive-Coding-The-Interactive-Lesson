import React from 'react';
import { SymbolDefinition } from '../types';
import katex from 'katex';

interface SymbolTableProps {
  symbols: SymbolDefinition[];
}

export const SymbolTable: React.FC<SymbolTableProps> = ({ symbols }) => {
  if (!symbols || symbols.length === 0) return null;

  return (
    <div className="mt-10 border border-slate-700 bg-black/40 rounded-lg overflow-hidden">
      <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center justify-between">
         <span className="text-sm font-bold uppercase tracking-widest text-emerald-400 cyber-font">Mathematical Syntax</span>
         <span className="text-xs text-slate-500 font-mono">DECODER_V1.0</span>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
            <tr className="bg-slate-900/80 text-sm uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="p-4 font-mono">Symbol</th>
                <th className="p-4 font-mono">Meaning</th>
                <th className="p-4 font-mono">Context</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {symbols.map((sym, idx) => {
             const renderedSymbol = katex.renderToString(sym.symbol, { throwOnError: false });
             return (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-cyan-300 font-serif text-xl md:text-2xl" dangerouslySetInnerHTML={{__html: renderedSymbol}} />
                    <td className="p-4 text-slate-200 font-medium text-lg">{sym.definition}</td>
                    <td className="p-4 text-slate-500 text-base italic">{sym.context}</td>
                </tr>
             );
          })}
        </tbody>
      </table>
    </div>
  );
};