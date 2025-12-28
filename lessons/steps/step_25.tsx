import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step25: LessonStep = {
    title: "25. Adaptive Activation",
    content: null,
    subsections: [
        { at: 0, title: "Homeostasis", content: <MathBlock title="Dynamic Tanh">{'\\text{DyT}(x) = \\alpha_2 \\tanh(\\alpha_3 x)'}</MathBlock> },
        { at: 50, title: "Fisher Information", content: <div className="space-y-4">
            <p>Standard neural networks use static activation functions like ReLU or Sigmoid. They are rigid. Our system employs a <strong>Dynamic Tanh (DyT)</strong> function (Eq 15) that breathes. The slope of this curve <InlineMath math="\alpha_3" /> is not a constant; it is a variable coupled to the local energy density.</p>
            <p>In a low-energy (quiet) environment, the slope steepens, maximizing gain to catch faint signals—akin to the eye dilating in darkness. In a high-energy (chaotic) environment, the slope flattens to prevent saturation—akin to the pupil constricting in sunlight. This is <strong>Homeostasis</strong>. Mathematically, this dynamic gain control maximizes the <strong>Fisher Information</strong> of the channel, ensuring the particle always operates in the most sensitive region of its dynamic range, effectively "listening" harder when silence falls.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'adaptive_grid', symbols: [],
    script: [ 
        { at: 20, type: 'pulse', targetId: 'all', label: "Faint Signal" }, 
        { at: 40, type: 'annotate', label: "High Gain" }, 
        { at: 65, type: 'shake', targetId: 'all', duration: 10, label: "Loud Signal" }, 
        { at: 80, type: 'annotate', label: "Low Gain" } 
    ],
    narration: "Biological neurons are not static switches. They are adaptive. Think of your eye. In a dark room, your pupil dilates to capture every single photon. In bright sunlight, it constricts to prevent you from being blinded. This is Homeostasis. Our activation function does exactly this. It adapts its slope—its sensitivity—based on the local energy density. When the signal is faint, it steepens, increasing gain to amplify whispers. When the signal is loud, it flattens, decreasing gain to prevent saturation. Mathematically, this maximizes Fisher Information. It ensures the neuron is always operating in its most sensitive range, regardless of how loud or quiet the environment is. This allows the network to maintain optimal sensitivity across a massive dynamic range, distinguishing subtle patterns in the noise without getting blinded by the signal."
};