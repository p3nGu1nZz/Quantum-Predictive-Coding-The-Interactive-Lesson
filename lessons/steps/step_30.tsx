import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step30: LessonStep = {
    title: "30. Nonlocal Elasticity",
    content: null,
    subsections: [
        { at: 0, title: "Stiffness", content: <p>Instant communication across the solid.</p> },
        { at: 40, title: "Phonon Transmission", content: <div className="space-y-4">
            <p>Diffusion is slow. Elasticity is fast. Because the potential field <span className="font-math">{'V_{ij}'}</span> creates a stiff lattice, perturbations travel as <strong>Phonons</strong> (sound waves) at the speed of sound in the medium, rather than the speed of diffusion.</p>
            <MathBlock>{'v_{sound} = \\sqrt{\\frac{K}{\\rho}}'}</MathBlock>
            <p>This <strong>Nonlocal Elasticity</strong> allows the edge of the network to signal the core almost instantly, creating a "Hive Mind" response that defies the latency limits of chemical signaling.</p>
        </div>}
    ],
    config: p({ k: 0.5 }), setup: 'grid', symbols: [],
    script: [ { at: 20, type: 'force', targetId: 0, vector: {x: 5, y: 0} }, { at: 30, type: 'highlight', targetId: 'all', label: "Instant" } ],
    narration: "In a gas, if you push a particle, it bumps its neighbor, which bumps the next one. The signal travels slowly, restricted by the speed of sound. But in a solid, if you push one end of a steel rod, the other end moves almost instantly. Our network exhibits Nonlocal Elasticity. Because the potential energy field creates a stiff, coupled lattice, the system acts more like a solid crystal than a diffuse gas. A perturbation at the edge of the network travels as a phonon—a sound wave—through the potential field, alerting the core almost instantly. This explains how a deep biological network can react faster than simple chemical diffusion would allow. The network reacts as a single, rigid body due to the stiffness of the potential field. It is a hive mind where every member feels the touch of the others instantly."
};