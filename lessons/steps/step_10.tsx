import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step10: LessonStep = {
    title: "10. Harmonic Connection",
    content: null,
    subsections: [
        { at: 0, title: "Springs", content: <MathBlock title="Potential">{'V_{ij} = -k (d_{ij} - r_0) \\hat{d}_{ij}'}</MathBlock> },
        { at: 50, title: "Deep Dive", content: <div className="space-y-4">
            <p>Our interaction model is based on the <strong>Harmonic Oscillator</strong>, the most fundamental object in physics. We define an interaction potential <InlineMath math="V_{ij}" /> (Eq 7) that penalizes deviations from an equilibrium separation <InlineMath math="r_0" />.</p>
            <p>This potential mirrors the <strong>Lennard-Jones potential</strong> found in molecular dynamics: it is repulsive at short ranges (preserving <InlineMath math="d_{ij} > 0" /> to maintain individuality) and attractive at long ranges (enforcing <InlineMath math="d_{ij} \to r_0" /> to maintain cohesion). The parameter <InlineMath math="r_0" /> is not fixed; it is an optimization variable (Eq 6) that the system adjusts to find the most "comfortable" packing density for the data. The network effectively crystallizes into a geometry that physically represents the solution to the inference problem.</p>
        </div>}
    ],
    config: p({ k: 0.2 }), setup: 'grid', symbols: [],
    script: [ { at: 40, type: 'annotate', label: "Individuality" }, { at: 65, type: 'annotate', label: "Cohesion" } ],
    narration: "At the very heart of our interaction model sits the humble spring. It is the most fundamental object in physics—the Harmonic Oscillator. We model the connection between any two particles not as a rigid beam, but as an elastic spring. The math is simple: the energy scales with the square of the distance from a \"happy medium,\" or equilibrium point. If the particles get too close, the spring compresses and pushes them apart. This represents Individuality—it prevents the system from collapsing into a black hole of singularity where all distinction is lost. If they drift too far apart, the spring stretches and pulls them back together. This represents Cohesion—it keeps the cluster alive as a unified entity. But here is the magic twist: that \"equilibrium distance\" is not fixed. The system actively optimizes it. It’s like a spring that can decide how long it wants to be. The network searches for the perfect packing density that minimizes the total tension. It is constantly trying to relax into a crystal-like stability, balancing the forces of attraction and repulsion to find a comfortable geometric shape that represents the answer to your question. It is a geometry of compromise, finding the lowest energy state between the need to be oneself and the need to be part of the whole."
};