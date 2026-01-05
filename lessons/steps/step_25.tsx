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
            <p>Standard neural networks use static activation functions like ReLU or Sigmoid. They are rigid. Our system employs a <strong>Dynamic Tanh (DyT)</strong> function (Eq 15) that breathes. The slope of this curve <InlineMath math="\\alpha_3" /> is not a constant; it is a variable coupled to the local energy density.</p>
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
    narration: "Imagine trying to listen to a whisper at a rock concert, or a shout in a library. To understand the signal, you must adjust your sensitivity. This is Homeostasis. In our simulation, every particle effectively has an automatic gain control. We use a dynamic activation function that breathes. When the local environment is quiet and low-energy, the curve steepens—the particle dilates its pupils to catch every single photon of information. It operates at maximum sensitivity. But when the environment explodes into chaos and high error, the curve flattens. The particle constricts to prevent being blinded by the noise. Mathematically, this maximizes Fisher Information. It ensures that the system is always listening within its optimal dynamic range, maintaining a delicate balance between responsiveness and stability, hovering right on the edge of a phase transition."
};