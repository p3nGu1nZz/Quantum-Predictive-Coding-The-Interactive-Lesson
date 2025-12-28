import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step28: LessonStep = {
    title: "28. CDMA",
    content: null,
    subsections: [
        { at: 0, title: "Channels", content: <p>Processing multiple reality streams in the same physical space using Quantum Spin.</p> },
        { at: 40, title: "Orthogonality", content: <div className="space-y-4">
            <p>We leverage the orthogonality of spin states to create independent communication channels:</p>
            <MathBlock>{'\\langle \\psi_{\\uparrow} | \\psi_{\\downarrow} \rangle = 0'}</MathBlock>
            <p>Particles with opposite spins pass through each other without interaction. This effectively creates <strong>Orthogonal Subspaces</strong> within the same manifold. It is the biological equivalent of <strong>CDMA (Code Division Multiple Access)</strong> used in cellular networks, allowing the brain to process color, motion, and depth simultaneously in the same volume of cortex without crosstalk.</p>
        </div>}
    ],
    config: p({ spinEnabled: true }), setup: 'spin_cluster', symbols: [],
    script: [ { at: 10, type: 'highlight', targetId: 'all' }, { at: 50, type: 'force', targetId: 'all', vector: {x: 5, y: 0} } ],
    narration: "How do you process multiple streams of data in the same chunk of tissue without them becoming a garbled mess? We use Spin Coupling. By assigning orthogonal spins to different groups of particles, we create invisible channels. Green particles (Spin Up) interact strongly with other Green particles. Orange particles (Spin Down) interact with other Orange particles. But Green and Orange? They pass right through each other like ghosts. They occupy the same space, but they exist in different realities. This is Code Division Multiple Access (CDMA) for the brain—the same technology your cell phone uses to find your call in a room full of radio waves. It allows us to layer parallel realities within a single computing volume. We can process vision, sound, and memory in the same physical space, at the same time, without interference. It is density through dimensionality."
};