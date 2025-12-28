import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step13: LessonStep = {
    title: "13. Reciprocity",
    content: null,
    subsections: [
        { at: 0, title: "Symmetry", content: <p>Cognition is a two-way street. We enforce Newton's Third Law: For every cognitive action, there is an equal and opposite reaction.</p> },
        { at: 40, title: "Bidirectional Coupling", content: <div className="space-y-4">
            <p>Traditional neural networks often rely on feedforward architectures. The L-Group framework is strictly <strong>Reciprocal</strong>. The coupling matrix is symmetric:</p>
            <MathBlock>{'w_{ij} = w_{ji} \\quad \\Rightarrow \\quad \\mathbf{F}_{ij} = -\\mathbf{F}_{ji}'}</MathBlock>
            <p>This ensures a perfect balance between Bottom-Up signals (Sensation pushing on the Model) and Top-Down signals (The Model pushing on Sensation). This equilibrium prevents the system from detaching from reality (Hallucination) or ignoring prior knowledge (Blindness). It is the mathematical definition of a dialogue.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'superposition', symbols: [],
    script: [ { at: 30, type: 'force', targetId: 0, vector: {x:2, y:0} }, { at: 35, type: 'annotate', label: "Push -> <- Pull" } ],
    narration: "For every action, there is an equal and opposite reaction. Sir Isaac Newton figured this out for apples and planets three hundred years ago, and today we apply it to thoughts and predictions. Our force equations satisfy Newton's Third Law perfectly. In the context of Predictive Coding, this creates a profound symmetry called Reciprocity. It solves a major problem. In many AI models, data flows one way: from input to output. But in the brain—and in our model—it is a two-way street. While the sensory data (the bottom-up signal) is pushing the internal model to change and adapt to reality, the internal model (the top-down prediction) is pushing back. It is pulling the sensory interpretation towards expectation. We do not just passively see the world; we project our expectations onto it. This creates a loop, a handshake between the world and the mind. If the sensory data is weak (like seeing a shape in the dark), the prediction wins, and we might hallucinate a monster. If the sensory data is strong (broad daylight), the prediction updates, and we learn. This physical tug-of-war is the loop of consciousness."
};