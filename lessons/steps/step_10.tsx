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
            <p>This potential mirrors the <strong>Lennard-Jones potential</strong> found in molecular dynamics: it is repulsive at short ranges (preserving <InlineMath math="d_{ij} > 0" /> to maintain individuality) and attractive at long ranges (enforcing <InlineMath math="d_{ij} \\to r_0" /> to maintain cohesion). The parameter <InlineMath math="r_0" /> is not fixed; it is an optimization variable (Eq 6) that the system adjusts to find the most "comfortable" packing density for the data. The network effectively crystallizes into a geometry that physically represents the solution to the inference problem.</p>
        </div>}
    ],
    config: p({ k: 0.2 }), setup: 'grid', symbols: [],
    script: [ 
        { at: 15, type: 'highlight', targetId: 'all', label: "Springs" }, 
        { at: 50, type: 'force', targetId: 'all', vector: {x:0, y:0}, label: "Tension" }, 
        { at: 80, type: 'annotate', label: "Equilibrium" } 
    ],
    narration: "Deep down, the universe is just a collection of springs. From the bonds holding atoms together to the quantum fields pervading space, the Harmonic Oscillator is the fundamental unit of reality. We apply this physics to the connections between our neurons. We don't use rigid steel beams; we use elastic springs. The tension in these springs represents the 'Prediction Error.' If two concepts are too far apart, the spring stretches, pulling them together with a force proportional to the misunderstanding. If they are too close, it compresses, pushing them apart to preserve their individuality. The network is constantly vibrating, trying to relax these springs, hunting for the geometric sweet spot where all tensions balance out. This state of minimum energy is what we call 'Understanding'."
};