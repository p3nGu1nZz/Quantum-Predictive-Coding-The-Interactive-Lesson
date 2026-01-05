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
        { at: 0, title: "Newton's Third Law", content: <p>For every action, there is an equal and opposite reaction. We apply this physics to thoughts.</p> },
        { at: 20, title: "Symmetry", content: <div className="space-y-4">
             <p>Our force equations satisfy Newton's Third Law perfectly, creating a symmetry called <strong>Reciprocity</strong>.</p>
        </div>},
        { at: 40, title: "Bidirectional Flow", content: <div className="space-y-4">
             <p>In standard AI, data often flows one way (Input → Output). But in the brain, it is a two-way street.</p>
        </div>},
        { at: 60, title: "The Handshake", content: <div className="space-y-4">
             <p><strong>Bottom-Up:</strong> Sensory data pushes the internal model to adapt to reality.</p>
             <p><strong>Top-Down:</strong> The internal model pushes back, pulling sensory interpretation towards expectation.</p>
        </div>},
        { at: 80, title: "Consciousness", content: <div className="space-y-4">
             <p>We do not just passively see the world; we project our expectations onto it. This physical tug-of-war is the loop of consciousness.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'superposition', symbols: [],
    script: [ 
        { at: 20, type: 'force', targetId: 0, vector: {x:5, y:0}, label: "Action" }, 
        { at: 25, type: 'force', targetId: 1, vector: {x:-5, y:0}, label: "Reaction" }, 
        { at: 50, type: 'force', targetId: 'all', vector: {x:0, y:5}, label: "Bottom-Up" },
        { at: 60, type: 'force', targetId: 'all', vector: {x:0, y:-5}, label: "Top-Down" },
        { at: 80, type: 'highlight', targetId: 'all', label: "Equilibrium" } 
    ],
    narration: "For every action, there is an equal and opposite reaction. Sir Isaac Newton figured this out for apples and planets three hundred years ago, and today we apply it to thoughts. In many AI models, data flows one way: from input to output. But in the brain—and in our model—it is a two-way street. While the sensory data (the bottom-up signal) is pushing the internal model to change and adapt to reality, the internal model (the top-down prediction) is pushing back. It is pulling the sensory interpretation towards expectation. We do not just passively see the world; we project our expectations onto it. This physical tug-of-war is the loop of consciousness."
};