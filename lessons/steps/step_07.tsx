import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step07: LessonStep = {
    title: "7. The Cavity",
    content: null,
    subsections: [
        { at: 0, title: "Boundary", content: <p>Boundaries create resonance and pressure.</p> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>In quantum field theory, a particle in an infinite void is a lonely, non-interacting entity. To generate complex dynamics, we define the configuration space as a subspace <InlineMath math="\mathcal{H}_s" /> constrained by a boundary <InlineMath math="L" /> (Eq 1). This is not merely a wall; it is a <strong>Boundary Condition</strong> that forces the reflection of probability currents (Eq 20).</p>
            <p>When a particle's wavefunction strikes this boundary, it folds back upon itself, creating standing waves and high-pressure resonance chambers. This mirrors the biological reality of the cranium. The brain is a massive sheet of cortex crumpled into a finite volume. This folding isn't just for packing efficiency; it creates "wormholes" of adjacency, forcing distant neural populations into intimate contact. By confining the infinite potential of the field into a finite cavity, we force the system to confront itself, generating the friction and heat necessary for intelligence.</p>
        </div>}
    ],
    config: p({ r0: 100 }), setup: 'cavity', symbols: [],
    script: [ { at: 20, type: 'force', targetId: 'all', vector: {x:5, y:5} }, { at: 75, type: 'annotate', label: "Reflected Wave" } ],
    narration: "Physics teaches us that infinite space is boring. If you release a gas into an infinite void, the particles just fly away from each other forever. They cool down. They die. Entropy wins. To have structure, you need a container. You need a Cavity. In our simulation, the boundary is not just a limit; it is an active participant. When a particle emits a probability wave, it strikes the wall and reflects back. This creates a standing wave—a pressure field that forces the system to confront itself. This is non-local awareness. A particle on the left 'knows' about the wall on the right because the pressure wave connects them. This mechanism mirrors the biological necessity of cortical folding. The brain is a massive sheet of tissue crinkled into the finite volume of the skull. This folding doesn't just save space; it creates resonance chambers. It forces distant neurons into close proximity, creating 'wormholes' for information. The skull forces the mind to fold in on itself, generating the high-energy density required for consciousness. Creativity, it turns out, requires boundaries."
};