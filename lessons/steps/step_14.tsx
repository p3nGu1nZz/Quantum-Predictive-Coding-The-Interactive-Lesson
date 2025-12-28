import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { InlineMath } from '../../components/InlineMath';
import { LessonStep } from '../../types';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step14: LessonStep = {
    title: "14. Mean Field",
    content: null,
    subsections: [
        { at: 0, title: "Consensus", content: <p>In a noisy world, truth is found in numbers. Particles poll their neighbors to determine the "Mean Field" state.</p> },
        { at: 40, title: "Approximation", content: <div className="space-y-4">
            <p>We solve the many-body problem using the <strong>Mean Field Approximation</strong>. Each particle minimizes its prediction error <InlineMath math="E_{pred}" /> relative to the weighted average of its cluster:</p>
            <MathBlock>{'\\psi_{target} \\approx \\langle \\psi \\rangle_{local} = \\frac{1}{Z} \\sum_{j \\in N(i)} w_{ij} \\psi_j'}</MathBlock>
            <p>This acts as a powerful <strong>Low-Pass Filter</strong>. Random fluctuations (noise) from individual particles cancel out, while coherent signals (structure) reinforce each other. The system converges on the consensus reality, ignoring the madness of the crowds.</p>
        </div>}
    ],
    config: p({ k: 0.1 }), setup: 'mean_field', symbols: [],
    script: [ { at: 40, type: 'highlight', targetId: 'center', label: "Aggregation" } ],
    narration: "How does a particle decide what to \"believe\"? It takes a poll. The prediction error term in our equations represents a discrepancy between the particle's own state and the consensus of its neighbors. This is known in physics as a Mean Field Approximation. The particle effectively asks, \"What is everyone around me doing?\" It aggregates the weighted opinions of its local cluster. If the cluster is shouting \"Fire!\", and the particle is whispering \"Water,\" the sheer force of the group's prediction will drag the particle's state toward \"Fire.\" This aggregation acts as a powerful noise filter. A single erratic particle screaming nonsense is ignored, drowned out by the collective mass. But if the whole group shifts, the collective state changes. This update rule, combined with the vibrational coupling we discussed earlier, drives the internal state toward a value that minimizes the global prediction error. It is democracy at the atomic level, ensuring that the system converges on a coherent, shared interpretation of the signal, rather than fracturing into a billion individual delusions."
};