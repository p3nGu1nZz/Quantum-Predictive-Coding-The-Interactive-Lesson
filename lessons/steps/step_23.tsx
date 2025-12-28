import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step23: LessonStep = {
    title: "23. Quantum Correction",
    content: null,
    subsections: [
        { at: 0, title: "Attention", content: <p>In quantum mechanics, momentum dictates scope. We use this to build a Variable Attention Mechanism.</p> },
        { at: 40, title: "De Broglie Wavelength", content: <div className="space-y-4">
            <p>We treat particles as wave-packets where the wavelength <span className="font-math">\lambda</span> is inversely proportional to momentum <span className="font-math">p</span> (Error magnitude):</p>
            <MathBlock>{'\\lambda = \\frac{h}{p} \\quad \\Rightarrow \\quad \\text{Attn Radius} \\propto \\frac{1}{\\text{Error}}'}</MathBlock>
            <ul className="list-disc pl-5">
                <li><strong>High Error (High Momentum):</strong> Small <span className="font-math">\lambda</span>. The particle focuses locally on immediate corrections.</li>
                <li><strong>Low Error (Low Momentum):</strong> Large <span className="font-math">\lambda</span>. The particle expands its scope to integrate global context.</li>
            </ul>
        </div>}
    ],
    config: p({ couplingEnabled: true }), setup: 'fluid_flow', symbols: [],
    script: [ { at: 10, type: 'force', targetId: 'all', vector: {x: 5, y: 0} }, { at: 50, type: 'annotate', label: "Wavelength Shrink" } ],
    narration: "Now we get truly quantum. We incorporate a correction term based on the De Broglie Wavelength. In quantum mechanics, every particle is also a wave, and its wavelength is inversely proportional to its momentum. Think about what that means. Fast-moving particles have short, frantic wavelengths. Slow, stable particles have long, rolling wavelengths. We use this to modulate coupling. When a particle is moving fast—meaning it has high error, high surprise, and is learning quickly—its wavelength shrinks. It becomes short-sighted. It only talks to its immediate neighbors. It focuses on the local details. When a particle settles down and becomes stable, its wavelength expands. It begins to tunnel across the network, connecting with distant nodes. This acts as an automatic, variable-scope Attention Mechanism. The system focuses on the pixels when it is confused, and integrates the big picture when it is calm."
};