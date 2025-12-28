import React from 'react';
import { PHYSICS } from '../../constants';
import { MathBlock } from '../../components/MathBlock';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step29: LessonStep = {
    title: "29. Kuramoto Order",
    content: null,
    subsections: [
        { at: 0, title: "Insight", content: <p>The "Aha!" moment is a phase transition from chaos to order.</p> },
        { at: 40, title: "Synchronization", content: <div className="space-y-4">
            <p>We quantify "understanding" using the <strong>Kuramoto Order Parameter</strong> <InlineMath math="R" />:</p>
            <MathBlock>{'R e^{i \\Psi} = \\frac{1}{N} \\sum_{j=1}^{N} e^{i \\theta_j}'}</MathBlock>
            <p><InlineMath math="R \approx 0" /> represents noise and confusion. <InlineMath math="R \approx 1" /> represents synchronization and insight. The moment of learning is a <strong>Thermodynamic Phase Transition</strong>. We use this signal to gate Hebbian plasticity—meaning we only "save" the memory when the network successfully clicks into place ("He who syncs, links").</p>
        </div>}
    ],
    config: p({ phaseEnabled: true }), setup: 'kuramoto_sync', symbols: [],
    script: [ 
        { at: 15, type: 'shake', targetId: 'all', duration: 20, label: "Confusion" }, 
        { at: 50, type: 'pulse', targetId: 'all', label: "Phase Lock" }, 
        { at: 75, type: 'annotate', label: "Insight (Order=1)" } 
    ],
    narration: "How do we know when the system has \"understood\" something? We measure synchrony. We use the Kuramoto Order Parameter to track the phase alignment of the particles. When the system is confused, the phases are chaotic, random, out of sync. It is noise. The Order Parameter is near zero. But as the system solves the problem, as the error minimizes, something magical happens. The phases begin to lock. A wave of synchronization sweeps through the network. The Order Parameter shoots up to one. This phase transition is the physical correlate of the \"Aha!\" moment—the moment of insight. We use this signal to gate learning: we only consolidate memories when the system is synchronized. As the saying goes: \"He who syncs, links.\" We only remember the moments where the world made sense."
};