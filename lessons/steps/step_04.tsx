import React from 'react';
import { PHYSICS } from '../../constants';
import { InlineMath } from '../../components/InlineMath';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step04: LessonStep = {
    title: "4. Activation Waves",
    content: null,
    subsections: [
        { at: 0, title: "Interference", content: <p>Waves allow for 'explaining away' via destructive interference.</p> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>Activation <InlineMath math="x_i" /> is not a static value; it is a dynamic variable that evolves according to the gradient of free energy (Eq 24). Crucially, the coupling term <InlineMath math="p_{ij}(t)" /> introduces vibrational mechanics.</p>
            <MathBlock title="Wave Evolution">{'\\frac{dx_i}{dt} = -\\frac{\\partial F}{\\partial x_i} + \\eta \\sum p_{ij}(t) x_j'}</MathBlock>
            <p>Because <InlineMath math="x_i" /> can be positive or negative, signals can undergo <strong>Destructive Interference</strong>. This provides a physical mechanism for the Bayesian concept of "explaining away." If a top-down prediction (positive wave) perfectly matches a bottom-up sensation (negative wave), they sum to zero. The error vanishes, the channel falls silent, and the system rests. In this framework, silence is the sound of understanding.</p>
        </div>}
    ],
    config: p({ phaseEnabled: true }), setup: 'interference_grid', symbols: [],
    script: [ { at: 10, type: 'pulse', targetId: 'all' }, { at: 50, type: 'highlight', targetId: 'center', label: "Cancellation" } ],
    narration: "Look at the pulsing light of the nodes. This is Activation. In the digital world of zeros and ones, a bit is a switch. It’s either on or off. But in the physical world, things are rarely so binary. In our L-Group model, activation behaves like a wave on the ocean. It has height, it has power, and most importantly, it has a sign—positive or negative. This is crucial because it allows for the phenomenon of Interference. If you drop two pebbles in a pond, the ripples can pass through each other. Where a crest meets a crest, the wave doubles in size—this is constructive interference, an amplification of a thought. But where a crest meets a trough, they cancel out perfectly, leaving calm water. This is destructive interference. In our network, this allows for a powerful cognitive tool called \"explaining away.\" If the brain predicts a sound (a positive wave) and the ear hears that sound (a negative wave), they collide in the vacuum of the simulation and neutralize. Silence means success. Silence means the world is exactly as we expected. The particle's brightness is constantly being pushed and pulled by the \"force\" of prediction error, swelling and dimming as it tries to match the reality of the input. It is probability flowing like water."
};