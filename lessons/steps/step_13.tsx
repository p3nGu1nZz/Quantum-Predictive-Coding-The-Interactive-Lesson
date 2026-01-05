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
        { at: 0, title: "Newton's Third Law", content: <p>Newton's law of action and reaction applies to information dynamics.</p> },
        
        { at: 20, title: "Passive AI vs Active Mind", content: <div className="space-y-4">
             <p>Classical AI is a one-way street: Input → Output.</p>
             <p>The L-Group framework is a handshake. It enforces <strong>Reciprocity</strong>.</p>
        </div>},
        
        { at: 45, title: "Bidirectional Force", content: <div className="space-y-4">
             <p><strong>Sensory Push (Bottom-Up):</strong> Data demands recognition.</p>
             <p><strong>Prediction Pull (Top-Down):</strong> Expectation shapes reality.</p>
        </div>},
        
        { at: 70, title: "The Negotiation", content: <div className="space-y-4">
             <p>We do not just record the world; we negotiate with it.</p>
             <p>This physical tug-of-war is the fundamental loop of consciousness.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'superposition', symbols: [],
    script: [ 
        { at: 20, type: 'reset', label: "Passive" }, 
        { at: 45, type: 'force', targetId: 'all', vector: {x:0, y:5}, label: "Sensory Push" }, 
        { at: 55, type: 'force', targetId: 'all', vector: {x:0, y:-5}, label: "Prediction Pull" }, 
        { at: 80, type: 'pulse', targetId: 'all', label: "Negotiation" } 
    ],
    narration: "Newton's Third Law: for every action, an equal and opposite reaction. In classical AI, data flows one way—input to output. It is passive. But the L-Group framework enforces Reciprocity. Here, perception is a handshake. As sensory data pushes 'bottom-up', demanding to be recognized, the internal model pushes 'top-down', projecting its expectation. This bidirectional tension creates a dynamic loop. We do not just record the world; we negotiate with it. This physical tug-of-war between what we see and what we expect is the fundamental loop of consciousness."
};