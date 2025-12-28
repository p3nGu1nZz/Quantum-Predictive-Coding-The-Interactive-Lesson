import React from 'react';
import { PHYSICS } from '../../constants';
import { LessonStep } from '../../types';
import { InlineMath } from '../../components/InlineMath';

const p = (overrides: any = {}) => ({ ...PHYSICS, ...overrides });

export const Step18: LessonStep = {
    title: "18. Dynamic Attractors",
    content: null,
    subsections: [
        { at: 0, title: "Memory", content: <p>Without loops, there is no memory. We introduce recurrence to create persistence.</p> },
        { at: 40, title: "Phase Space", content: <div className="space-y-4">
            <p>In dynamical systems, a <strong>Limit Cycle</strong> is a stable, closed trajectory in phase space. By arranging particles in a ring and reducing damping <InlineMath math="\gamma" />, we create a trap for information.</p>
            <p>Signals entering the loop are preserved by their own <strong>Inertia</strong> (Momentum <InlineMath math="p" />). This is the physical mechanism for <strong>Working Memory</strong>—maintaining an active state after the sensory input has vanished. It is the echo of the past, spinning in the geometry of the present.</p>
        </div>}
    ],
    config: p({ damping: 0.999 }), setup: 'attractor', symbols: [],
    script: [ 
        { at: 25, type: 'highlight', targetId: 'all', label: "Recurrence" },
        { at: 45, type: 'rotate', targetId: 'all', duration: 40, label: "Spinning" }, 
        { at: 70, type: 'annotate', label: "Attractor" },
        { at: 90, type: 'pulse', targetId: 'all', label: "Memory" } 
    ],
    narration: "Feedforward processing is fast—it's reflex. You touch a hot stove, you pull away. But thinking? Thinking takes time. To hold a thought, to have a memory, to ponder, you need Recurrence. You need a loop. By arranging particles in a cycle, we create a closed trajectory in the phase space. A signal enters the loop and gets trapped, reverberating around and around like a marble spinning in a bowl. Because our Hamiltonian includes a momentum term, the signal carries inertia. It wants to keep moving. As long as the damping (friction) is low, that thought can spin in the void for a long time, echoing the original input. This is a Dynamic Attractor. It is the physical basis of Short-Term Working Memory. It allows the system to bridge the gap between the past and the future, holding a state active even after the sensory input has vanished. It is the ghost in the machine, the echo of the past living in the present geometry."
};