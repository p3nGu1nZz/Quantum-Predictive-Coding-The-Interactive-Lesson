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
            <p>In quantum field theory, a particle in an infinite void is a lonely, non-interacting entity. To generate complex dynamics, we define the configuration space as a subspace <InlineMath math="\\mathcal{H}_s" /> constrained by a boundary <InlineMath math="L" /> (Eq 1). This is not merely a wall; it is a <strong>Boundary Condition</strong> that forces the reflection of probability currents (Eq 20).</p>
            <p>When a particle's wavefunction strikes this boundary, it folds back upon itself, creating standing waves and high-pressure resonance chambers. This mirrors the biological reality of the cranium. The brain is a massive sheet of cortex crumpled into a finite volume. This folding isn't just for packing efficiency; it creates "wormholes" of adjacency, forcing distant neural populations into intimate contact. By confining the infinite potential of the field into a finite cavity, we force the system to confront itself, generating the friction and heat necessary for intelligence.</p>
        </div>}
    ],
    config: p({ r0: 100 }), setup: 'cavity', symbols: [],
    script: [ 
        { at: 15, type: 'force', targetId: 'all', vector: {x:5, y:5}, label: "Expansion" }, 
        { at: 45, type: 'shake', targetId: 'all', duration: 10, label: "Reflection" }, 
        { at: 80, type: 'zoom', targetZoom: 0.8, label: "Compression" } 
    ],
    narration: "If you release a gas into an infinite void, it dissipates. Entropy wins. To create structure, you need a container. In quantum mechanics, the 'particle in a box' is the first lesson where interesting things happen. The walls don't just contain the particle; they reflect it. They force the wavefunction to fold back on itself, creating standing waves—resonances. In our L-Group simulation, this boundary condition is critical. It acts like the skull encasing the brain. By confining the infinite potential of the field into a finite volume, we force the probability currents to collide, to interact, to self-organize. The geometry of the container dictates the shape of the thoughts it can hold. We are creating a pressure cooker for intelligence, where the friction of confinement generates the heat of cognition."
};