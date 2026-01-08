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
        { at: 0, title: "Beyond Binary", content: <div className="space-y-4">
            <p><strong>Digital:</strong> A bit is a switch (0 or 1).</p>
            <p><strong>Physical:</strong> Activation is a continuous wave. It has magnitude, direction, and most importantly, a <strong>Sign</strong>.</p>
        </div>},
        { at: 20, title: "Wave Mechanics", content: <div className="space-y-4">
            <p>Activation <InlineMath math="x_i" /> evolves dynamically based on free energy gradients (Eq 24).</p>
            <MathBlock title="Wave Evolution">{'\\frac{dx_i}{dt} = -\\frac{\\partial F}{\\partial x_i} + \\eta \\sum p_{ij}(t) x_j'}</MathBlock>
        </div>},
        { at: 40, title: "Interference", content: <div className="space-y-4">
            <p>Because waves have signs, they can interact:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>Constructive:</strong> Crest meets Crest (Amplification).</li>
                <li><strong>Destructive:</strong> Crest meets Trough (Cancellation).</li>
            </ul>
        </div>},
        { at: 60, title: "Explaining Away", content: <div className="space-y-4">
            <p>This provides a physical mechanism for Bayesian inference.</p>
            <p><strong>Prediction (+):</strong> "I expect a sound."</p>
            <p><strong>Sensation (-):</strong> "I hear a sound."</p>
            <p>They collide and sum to zero. The signal vanishes.</p>
        </div>},
        { at: 80, title: "Silence is Success", content: <div className="space-y-4">
            <p>When the internal model matches reality, the error term is neutralized.</p>
            <p>The channel falls silent. In this framework, silence is the sound of understanding.</p>
        </div>}
    ],
    config: p({ phaseEnabled: true, k: 0.05, r0: 130, sigma: 250 }), setup: 'interference_grid', symbols: [],
    script: [ 
        { at: 1, type: 'pulse', targetId: 'all', label: "Activation" }, 
        { at: 20, type: 'highlight', targetId: 'all', label: "Wavefront" },
        { at: 40, type: 'force', targetId: 'all', vector: {x:2, y:0}, label: "Constructive" }, 
        { at: 60, type: 'force', targetId: 'all', vector: {x:-2, y:0}, label: "Cancellation" },
        { at: 85, type: 'reset', label: "Equilibrium" }
    ],
    narration: "Look at the pulsing light of the nodes. This is Activation. In the digital world of zeros and ones, a bit is a switch. It’s either on or off. But in the physical world, things are rarely so binary. In our L-Group model, activation behaves like a wave on the ocean. It has height, it has power, and most importantly, it has a sign—positive or negative. This is crucial because it allows for the phenomenon of Interference. If you drop two pebbles in a pond, the ripples can pass through each other. Where a crest meets a crest, the wave doubles in size—this is constructive interference, an amplification of a thought. But where a crest meets a trough, they cancel out perfectly, leaving calm water. This is destructive interference. In our network, this allows for a powerful cognitive tool called \"explaining away.\" If the brain predicts a sound (a positive wave) and the ear hears that sound (a negative wave), they collide in the vacuum of the simulation and neutralize. Silence means success. Silence means the world is exactly as we expected. The particle's brightness is constantly being pushed and pulled by the \"force\" of prediction error, swelling and dimming as it tries to match the reality of the input. It is probability flowing like water."
};