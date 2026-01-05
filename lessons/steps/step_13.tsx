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
        { at: 0, title: "Newton's Third Law", content: <p>For every action, there is an equal and opposite reaction. Sir Isaac Newton figured this out for apples and planets three hundred years ago.</p> },
        { at: 35, title: "The Loop", content: <div className="space-y-4">
            <p>Our force equations satisfy Newton's Third Law perfectly. In the context of Predictive Coding, this creates a profound symmetry called <strong>Reciprocity</strong>.</p>
            <p>It solves a major problem. In many AI models, data flows one way: from input to output.</p>
        </div>},
        { at: 70, title: "Push and Pull", content: <div className="space-y-4">
             <p>But in the brain—and in our model—it is a two-way street. While the sensory data is pushing the internal model to change, the internal model is pushing back.</p>
             <p>We do not just passively see the world; we project our expectations onto it.</p>
        </div>},
        { at: 90, title: "Consciousness", content: <div className="space-y-4">
             <p>This physical tug-of-war is the loop of consciousness.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'superposition', symbols: [],
    script: [ 
        { at: 30, type: 'force', targetId: 0, vector: {x:5, y:0}, label: "Action" }, 
        { at: 35, type: 'force', targetId: 1, vector: {x:-5, y:0}, label: "Reaction" }, 
        { at: 70, type: 'highlight', targetId: 'all', label: "Equilibrium" } 
    ],
    narration: "For every action, there is an equal and opposite reaction. Sir Isaac Newton figured this out for apples and planets three hundred years ago, and today we apply it to thoughts and predictions. Our force equations satisfy Newton's Third Law perfectly. In the context of Predictive Coding, this creates a profound symmetry called Reciprocity. It solves a major problem. In many AI models, data flows one way: from input to output. But in the brain—and in our model—it is a two-way street. While the sensory data (the bottom-up signal) is pushing the internal model to change and adapt to reality, the internal model (the top-down prediction) is pushing back. It is pulling the sensory interpretation towards expectation. We do not just passively see the world; we project our expectations onto it. This creates a loop, a handshake between the world and the mind. If the sensory data is weak (like seeing a shape in the dark), the prediction wins, and we might hallucinate a monster. If the sensory data is strong (broad daylight), the prediction updates, and we learn. This physical tug-of-war is the loop of consciousness."
};