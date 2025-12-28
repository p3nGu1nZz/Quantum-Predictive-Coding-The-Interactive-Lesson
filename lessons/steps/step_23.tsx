import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step23: LessonStep = {
    title: "23. Quantum Correction",
    content: null,
    subsections: [
        { at: 0, title: "Attention", content: <p>In quantum mechanics, momentum dictates scope. We use this to build a Variable Attention Mechanism.</p> },
        { at: 40, title: "De Broglie Relations", content: <div className="space-y-4">
            <p>We treat particles as wave-packets where the wavelength <InlineMath math="\\lambda" /> is inversely proportional to momentum <InlineMath math="p" /> (Error magnitude):</p>
            <MathBlock>{'\\lambda = \\frac{h}{p} \\quad \\Rightarrow \\quad \\text{Attn Radius} \\propto \\frac{1}{\\text{Error}}'}</MathBlock>
            <ul className="list-disc pl-5">
                <li><strong>High Error (High Momentum):</strong> Small <InlineMath math="\\lambda" />. The particle focuses locally on immediate corrections.</li>
                <li><strong>Low Error (Low Momentum):</strong> Large <InlineMath math="\\lambda" />. The particle expands its scope to integrate global context.</li>
            </ul>
        </div>}
    ],
    config: p({ couplingEnabled: true }), setup: 'quantum_potential', symbols: [],
    script: [ 
        { at: 25, type: 'force', targetId: 'all', vector: {x:5, y:5}, label: "High Momentum" }, 
        { at: 35, type: 'annotate', label: "Short Wavelength" }, 
        { at: 70, type: 'reset', label: "Long Wavelength" } 
    ],
    narration: "Now we get truly quantum. We incorporate a correction term based on the De Broglie Wavelength. In quantum mechanics, every particle is also a wave, and its wavelength is inversely proportional to its momentum. Think about what that means. Fast-moving particles have short, frantic wavelengths. Slow, stable particles have long, rolling wavelengths. We use this to modulate coupling. When a particle is moving fast—meaning it has high error, high surprise, and is learning quickly—its wavelength shrinks. It becomes short-sighted. It only talks to its immediate neighbors. It focuses on the local details. When a particle settles down and becomes stable, its wavelength expands. It begins to tunnel across the network, connecting with distant nodes. This acts as an automatic, variable-scope Attention Mechanism. The system focuses on the pixels when it is confused, and integrates the big picture when it is calm."
};